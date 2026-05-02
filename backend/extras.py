"""StudyOS additional routes: chat, notifications, paypal billing, web push."""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import os
import uuid
import json
import base64
import logging
import requests
from pathlib import Path

logger = logging.getLogger("studyos.extras")

extras_router = APIRouter(prefix="/api")


# ------------------------- VAPID keys (web push) -------------------------
VAPID_FILE = Path(__file__).parent / ".vapid_keys.json"


def get_vapid_keys() -> dict:
    if VAPID_FILE.exists():
        return json.loads(VAPID_FILE.read_text())
    # Generate fresh
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import serialization
    private = ec.generate_private_key(ec.SECP256R1())
    priv_pem = private.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    pub = private.public_key()
    raw = pub.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint,
    )
    pub_b64 = base64.urlsafe_b64encode(raw).decode().rstrip("=")
    keys = {"private_pem": priv_pem, "public_b64": pub_b64}
    VAPID_FILE.write_text(json.dumps(keys))
    return keys


# ------------------------- Helpers (lazy access to deps) -------------------------
def _get_deps():
    """Pull shared deps from server module to avoid circular import at module load."""
    from server import db, get_current_user, llm_chat
    return db, get_current_user, llm_chat


# ------------------------- AI Chat with material -------------------------
class ChatMsgReq(BaseModel):
    message: str


@extras_router.post("/materials/{material_id}/chat")
async def chat_with_material(material_id: str, body: ChatMsgReq, request: Request):
    db, get_current_user, llm_chat = _get_deps()
    user = await get_current_user(request, request.headers.get("authorization"))

    mat = await db.materials.find_one({"id": material_id, "user_id": user["user_id"]}, {"_id": 0})
    if not mat:
        raise HTTPException(status_code=404, detail="Materiale non trovato")

    # Get last 8 messages for context
    history = await db.chat_messages.find(
        {"user_id": user["user_id"], "material_id": material_id},
        {"_id": 0},
    ).sort("created_at", -1).to_list(8)
    history.reverse()

    history_text = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in history])
    system = (
        "Sei un tutor AI specializzato che aiuta uno studente a comprendere il materiale di studio fornito. "
        "Rispondi SEMPRE in italiano, in modo chiaro, didattico e conciso. "
        "Basa le tue risposte SOLO sul materiale fornito; se la risposta non è nel materiale, dillo onestamente."
    )
    prompt = f"""# MATERIALE DI STUDIO
Titolo: {mat['title']}

{mat.get('raw_text', '')[:8000]}

# CONVERSAZIONE PRECEDENTE
{history_text or '(nessuna)'}

# DOMANDA DELLO STUDENTE
{body.message}

Rispondi alla domanda."""

    reply = await llm_chat(system, prompt)

    now = datetime.now(timezone.utc).isoformat()
    await db.chat_messages.insert_many([
        {"id": str(uuid.uuid4()), "user_id": user["user_id"], "material_id": material_id, "role": "user", "content": body.message, "created_at": now},
        {"id": str(uuid.uuid4()), "user_id": user["user_id"], "material_id": material_id, "role": "assistant", "content": reply, "created_at": now},
    ])
    return {"reply": reply}


@extras_router.get("/materials/{material_id}/chat/history")
async def chat_history(material_id: str, request: Request):
    db, get_current_user, _ = _get_deps()
    user = await get_current_user(request, request.headers.get("authorization"))
    msgs = await db.chat_messages.find(
        {"user_id": user["user_id"], "material_id": material_id},
        {"_id": 0},
    ).sort("created_at", 1).to_list(200)
    return msgs


# ------------------------- Notifications -------------------------
@extras_router.get("/notifications")
async def list_notifications(request: Request):
    db, get_current_user, _ = _get_deps()
    user = await get_current_user(request, request.headers.get("authorization"))
    # Auto-generate today's reminders (idempotent)
    await _generate_today_reminders(db, user["user_id"])
    items = await db.notifications.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    unread = sum(1 for n in items if not n.get("read"))
    return {"items": items, "unread": unread}


@extras_router.post("/notifications/{nid}/read")
async def mark_read(nid: str, request: Request):
    db, get_current_user, _ = _get_deps()
    user = await get_current_user(request, request.headers.get("authorization"))
    await db.notifications.update_one(
        {"id": nid, "user_id": user["user_id"]}, {"$set": {"read": True}}
    )
    return {"ok": True}


@extras_router.post("/notifications/read-all")
async def mark_all_read(request: Request):
    db, get_current_user, _ = _get_deps()
    user = await get_current_user(request, request.headers.get("authorization"))
    await db.notifications.update_many(
        {"user_id": user["user_id"]}, {"$set": {"read": True}}
    )
    return {"ok": True}


async def _generate_today_reminders(db, user_id: str):
    """For each active study plan, ensure today's task has a notification (idempotent)."""
    today = datetime.now(timezone.utc).date().isoformat()
    plans = await db.study_plans.find({"user_id": user_id}, {"_id": 0}).to_list(50)
    for plan in plans:
        for d in plan.get("days", []):
            if d.get("date") == today and not d.get("done"):
                key = f"plan-{plan['id']}-{today}"
                exists = await db.notifications.find_one({"user_id": user_id, "key": key})
                if exists:
                    continue
                title = "📚 Tocca a te studiare oggi"
                body = f"{plan['title']} • {d.get('topic')}"
                if d.get("pages"):
                    body += f" (pp. {d['pages']})"
                await db.notifications.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "key": key,
                    "title": title,
                    "body": body,
                    "link": "/study-plan",
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })


# ------------------------- Web Push -------------------------
class PushSubReq(BaseModel):
    subscription: Dict[str, Any]


@extras_router.get("/push/vapid-public-key")
async def vapid_public_key():
    return {"public_key": get_vapid_keys()["public_b64"]}


@extras_router.post("/push/subscribe")
async def push_subscribe(body: PushSubReq, request: Request):
    db, get_current_user, _ = _get_deps()
    user = await get_current_user(request, request.headers.get("authorization"))
    sub = body.subscription
    endpoint = sub.get("endpoint")
    if not endpoint:
        raise HTTPException(status_code=400, detail="invalid subscription")
    await db.push_subscriptions.update_one(
        {"endpoint": endpoint},
        {"$set": {
            "user_id": user["user_id"],
            "endpoint": endpoint,
            "keys": sub.get("keys", {}),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }}, upsert=True,
    )
    return {"ok": True}


@extras_router.post("/push/test")
async def push_test(request: Request):
    db, get_current_user, _ = _get_deps()
    user = await get_current_user(request, request.headers.get("authorization"))
    subs = await db.push_subscriptions.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(20)
    if not subs:
        raise HTTPException(status_code=404, detail="Nessuna sottoscrizione push attiva")
    sent = 0
    for s in subs:
        if _send_push(s, "📚 StudyOS", "Notifiche push attive! Ti ricorderemo di studiare ogni giorno."):
            sent += 1
    return {"sent": sent, "total": len(subs)}


def _send_push(sub: dict, title: str, body: str) -> bool:
    try:
        from pywebpush import webpush, WebPushException
        keys = get_vapid_keys()
        webpush(
            subscription_info={"endpoint": sub["endpoint"], "keys": sub["keys"]},
            data=json.dumps({"title": title, "body": body, "url": "/dashboard"}),
            vapid_private_key=keys["private_pem"],
            vapid_claims={"sub": os.environ.get("VAPID_SUBJECT", "mailto:admin@studyos.app")},
        )
        return True
    except Exception as e:
        logger.warning(f"push failed: {e}")
        return False


# ------------------------- PayPal -------------------------
PAYPAL_BASE = os.environ.get("PAYPAL_BASE", "https://api-m.sandbox.paypal.com")
PRICE = os.environ.get("PREMIUM_PRICE_EUR", "4.99")


def _paypal_token() -> str:
    cid = os.environ.get("PAYPAL_CLIENT_ID")
    secret = os.environ.get("PAYPAL_SECRET")
    if not cid or not secret:
        raise HTTPException(status_code=500, detail="PayPal non configurato")
    r = requests.post(
        f"{PAYPAL_BASE}/v1/oauth2/token",
        data={"grant_type": "client_credentials"},
        headers={"Accept": "application/json"},
        auth=(cid, secret), timeout=15,
    )
    r.raise_for_status()
    return r.json()["access_token"]


@extras_router.get("/billing/config")
async def billing_config():
    return {
        "provider": "paypal",
        "client_id": os.environ.get("PAYPAL_CLIENT_ID", ""),
        "currency": "EUR",
        "price": PRICE,
    }


@extras_router.post("/billing/paypal/create-order")
async def create_paypal_order(request: Request):
    db, get_current_user, _ = _get_deps()
    user = await get_current_user(request, request.headers.get("authorization"))
    token = _paypal_token()
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "reference_id": f"premium-{user['user_id']}",
            "description": "StudyOS Premium — 30 giorni",
            "amount": {"currency_code": "EUR", "value": PRICE},
        }],
        "application_context": {
            "brand_name": "StudyOS",
            "shipping_preference": "NO_SHIPPING",
            "user_action": "PAY_NOW",
        },
    }
    r = requests.post(
        f"{PAYPAL_BASE}/v2/checkout/orders",
        json=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=20,
    )
    if r.status_code >= 400:
        logger.error(f"paypal create error: {r.text}")
        raise HTTPException(status_code=502, detail="Errore PayPal nella creazione ordine")
    data = r.json()
    return {"order_id": data["id"]}


@extras_router.post("/billing/paypal/capture/{order_id}")
async def capture_paypal_order(order_id: str, request: Request):
    db, get_current_user, _ = _get_deps()
    user = await get_current_user(request, request.headers.get("authorization"))
    token = _paypal_token()
    r = requests.post(
        f"{PAYPAL_BASE}/v2/checkout/orders/{order_id}/capture",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=20,
    )
    if r.status_code >= 400:
        logger.error(f"paypal capture error: {r.text}")
        raise HTTPException(status_code=502, detail="Capture PayPal fallito")
    data = r.json()
    if data.get("status") != "COMPLETED":
        raise HTTPException(status_code=402, detail=f"Pagamento non completato: {data.get('status')}")

    # Activate premium for 30 days
    now = datetime.now(timezone.utc)
    current_until = None
    udoc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "premium_until": 1})
    if udoc and udoc.get("premium_until"):
        try:
            cu = datetime.fromisoformat(udoc["premium_until"])
            if cu.tzinfo is None:
                cu = cu.replace(tzinfo=timezone.utc)
            if cu > now:
                current_until = cu
        except Exception:
            pass
    new_until = (current_until or now) + timedelta(days=30)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"plan": "premium", "premium_until": new_until.isoformat()}},
    )
    await db.payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "provider": "paypal",
        "order_id": order_id,
        "amount": PRICE,
        "currency": "EUR",
        "status": "COMPLETED",
        "raw": data,
        "created_at": now.isoformat(),
    })
    # Push notify
    subs = await db.push_subscriptions.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(10)
    for s in subs:
        _send_push(s, "🎉 Premium attivato!", "Il tuo account StudyOS è ora Premium per 30 giorni.")
    # In-app notif
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "title": "🎉 Benvenuto in Premium!",
        "body": f"Premium attivo fino al {new_until.strftime('%d/%m/%Y')}",
        "link": "/dashboard", "read": False,
        "created_at": now.isoformat(),
    })
    return {"ok": True, "plan": "premium", "premium_until": new_until.isoformat()}
