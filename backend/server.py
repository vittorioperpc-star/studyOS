"""StudyOS backend - FastAPI server."""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header, Request, Response, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import json
import uuid
import logging
import base64
import bcrypt
import jwt
import requests
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from pypdf import PdfReader

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
APP_NAME = os.environ.get("APP_NAME", "studyos")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="StudyOS API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("studyos")

# ------------------------- Object Storage -------------------------
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
_storage_key: Optional[str] = None


def init_storage() -> Optional[str]:
    global _storage_key
    if _storage_key:
        return _storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        return _storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        return {"path": path, "size": len(data), "etag": ""}
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple[bytes, str]:
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ------------------------- Models -------------------------
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    plan: str = "free"  # free | premium
    premium_until: Optional[str] = None
    created_at: str


class SignupReq(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class AuthResp(BaseModel):
    token: str
    user: User


class Material(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    title: str
    source_type: str  # pdf | image | text
    storage_path: Optional[str] = None
    original_filename: Optional[str] = None
    raw_text: str
    summary: str = ""
    schema_outline: str = ""
    flashcards: List[Dict[str, Any]] = []
    quiz: List[Dict[str, Any]] = []
    exam_questions: List[str] = []
    created_at: str


class StudyPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    title: str
    exam_date: str
    total_pages: int
    days: List[Dict[str, Any]]  # [{date, topics, type: study/review}]
    created_at: str


class QuizResult(BaseModel):
    material_id: str
    score: int
    total: int
    answers: List[Dict[str, Any]]


class FlashcardReview(BaseModel):
    card_id: str
    quality: int  # 0-5 SM-2 scale


# ------------------------- Auth helpers -------------------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_jwt(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def get_user_from_token(token: str) -> Optional[dict]:
    if not token:
        return None
    # Try JWT first
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if user_id:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
            if user:
                return user
    except Exception:
        pass
    # Try session token (Google OAuth)
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        return None
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user


async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
) -> dict:
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
    if not token:
        token = request.cookies.get("session_token")
    user = await get_user_from_token(token) if token else None
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


# ------------------------- LLM helpers -------------------------
def _strip_json(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = t.split("```", 2)
        t = t[1] if len(t) > 1 else ""
        if t.lower().startswith("json"):
            t = t[4:].lstrip("\n")
    if t.endswith("```"):
        t = t[: -3]
    # Extract first {...} or [...]
    for opener, closer in [("{", "}"), ("[", "]")]:
        if opener in t:
            start = t.index(opener)
            end = t.rfind(closer)
            if end > start:
                return t[start:end + 1]
    return t


async def llm_chat(system_msg: str, user_text: str, images_b64: Optional[List[str]] = None) -> str:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"studyos-{uuid.uuid4().hex[:10]}",
        system_message=system_msg,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    file_contents = None
    if images_b64:
        file_contents = [ImageContent(image_base64=b) for b in images_b64]
    msg = UserMessage(text=user_text, file_contents=file_contents) if file_contents else UserMessage(text=user_text)
    return await chat.send_message(msg)


async def generate_study_content(text: str) -> dict:
    """Generate summary, schema, flashcards, quiz, and exam questions from raw text."""
    system = (
        "Sei un tutor AI esperto per studenti italiani. Rispondi SEMPRE in italiano. "
        "Produci output SOLO in JSON valido, senza testo aggiuntivo, senza markdown fences."
    )
    prompt = f"""Analizza il seguente materiale di studio e produci un oggetto JSON con ESATTAMENTE queste chiavi:

{{
  "summary": "un riassunto chiaro e scorrevole, 150-300 parole",
  "schema_outline": "uno schema strutturato con titoli, sottopunti usando markdown (## Sezione, - punto)",
  "flashcards": [{{"id":"fc1","question":"...","answer":"...","ease":2.5,"interval":0,"next_review":null}}, ...almeno 8 flashcard],
  "quiz": [{{"id":"q1","question":"...","options":["A","B","C","D"],"correct_index":0,"explanation":"..."}}, ...almeno 6 domande a risposta multipla],
  "exam_questions": ["domanda aperta 1","domanda 2", ...almeno 5 possibili domande d'esame]
}}

Testo da analizzare:
\"\"\"
{text[:12000]}
\"\"\"

Rispondi SOLO con l'oggetto JSON."""
    raw = await llm_chat(system, prompt)
    try:
        data = json.loads(_strip_json(raw))
    except Exception as e:
        logger.error(f"JSON parse failed: {e}; raw[:400]={raw[:400]}")
        data = {
            "summary": raw[:1000],
            "schema_outline": "",
            "flashcards": [],
            "quiz": [],
            "exam_questions": [],
        }
    # Ensure card ids
    for i, fc in enumerate(data.get("flashcards", [])):
        fc.setdefault("id", f"fc{i+1}")
        fc.setdefault("ease", 2.5)
        fc.setdefault("interval", 0)
        fc.setdefault("next_review", None)
        fc.setdefault("repetitions", 0)
    for i, q in enumerate(data.get("quiz", [])):
        q.setdefault("id", f"q{i+1}")
    return data


async def ocr_image(image_b64: str) -> str:
    system = "Sei un OCR assistant. Estrai TUTTO il testo visibile dall'immagine, preservando la struttura. Rispondi solo con il testo, senza commenti."
    return await llm_chat(system, "Estrai tutto il testo da questa immagine.", [image_b64])


def extract_pdf_text(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        parts = []
        for page in reader.pages:
            try:
                parts.append(page.extract_text() or "")
            except Exception:
                pass
        return "\n\n".join(parts).strip()
    except Exception as e:
        logger.error(f"PDF extract error: {e}")
        return ""


# ------------------------- Usage limits -------------------------
FREE_DAILY_UPLOADS = 3


async def check_upload_limit(user: dict) -> None:
    if user.get("plan") == "premium":
        return
    today = datetime.now(timezone.utc).date().isoformat()
    count = await db.materials.count_documents({
        "user_id": user["user_id"],
        "created_at": {"$gte": today + "T00:00:00+00:00", "$lt": today + "T23:59:59+00:00"},
    })
    if count >= FREE_DAILY_UPLOADS:
        raise HTTPException(status_code=402, detail=f"Limite giornaliero raggiunto ({FREE_DAILY_UPLOADS} upload). Passa a Premium per upload illimitati.")


# ------------------------- Routes: Auth -------------------------
@api_router.get("/")
async def root():
    return {"ok": True, "app": "StudyOS"}


@api_router.post("/auth/signup", response_model=AuthResp)
async def signup(data: SignupReq):
    existing = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email già registrata")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": data.email.lower(),
        "name": data.name,
        "picture": None,
        "plan": "free",
        "password_hash": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_jwt(user_id)
    return AuthResp(token=token, user=User(**doc))


@api_router.post("/auth/login", response_model=AuthResp)
async def login(data: LoginReq):
    user = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    token = create_jwt(user["user_id"])
    return AuthResp(token=token, user=User(**user))


@api_router.post("/auth/session")
async def auth_session(payload: Dict[str, str], response: Response):
    """Exchange Emergent OAuth session_id for our session."""
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    try:
        r = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}, timeout=20,
        )
        r.raise_for_status()
        info = r.json()
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"OAuth failed: {e}")

    email = info["email"].lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": info.get("name", email.split("@")[0]),
            "picture": info.get("picture"),
            "plan": "free",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
    session_token = info["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/",
        max_age=7 * 24 * 3600,
    )
    user.pop("password_hash", None)
    return {"token": session_token, "user": user}


async def _refresh_plan(user: dict) -> dict:
    """Downgrade to free if premium_until expired."""
    pu = user.get("premium_until")
    if user.get("plan") == "premium" and pu:
        try:
            until = datetime.fromisoformat(pu)
            if until.tzinfo is None:
                until = until.replace(tzinfo=timezone.utc)
            if until < datetime.now(timezone.utc):
                await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"plan": "free"}})
                user["plan"] = "free"
        except Exception:
            pass
    return user


@api_router.get("/auth/me", response_model=User)
async def get_me(user: dict = Depends(get_current_user)):
    user.pop("password_hash", None)
    user = await _refresh_plan(user)
    return User(**user)


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ------------------------- Routes: Materials -------------------------
@api_router.post("/materials/upload")
async def upload_material(
    file: UploadFile = File(...),
    title: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    await check_upload_limit(user)
    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File troppo grande (max 15 MB)")

    filename = file.filename or "upload"
    ext = (filename.rsplit(".", 1)[-1] if "." in filename else "").lower()
    content_type = file.content_type or "application/octet-stream"

    # Store file
    storage_path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4()}.{ext or 'bin'}"
    try:
        put_object(storage_path, data, content_type)
    except Exception as e:
        logger.error(f"Upload storage failed: {e}")
        storage_path = None

    # Extract text
    raw_text = ""
    source_type = "text"
    if ext == "pdf" or content_type == "application/pdf":
        source_type = "pdf"
        raw_text = extract_pdf_text(data)
        if len(raw_text) < 40:
            # fallback: try vision on first page as base64? skip - just note
            raise HTTPException(status_code=422, detail="Impossibile estrarre testo dal PDF. Potrebbe essere un'immagine scansionata.")
    elif ext in {"png", "jpg", "jpeg", "webp"} or content_type.startswith("image/"):
        source_type = "image"
        b64 = base64.b64encode(data).decode("utf-8")
        raw_text = await ocr_image(b64)
        if len(raw_text) < 20:
            raise HTTPException(status_code=422, detail="OCR non ha trovato testo nell'immagine.")
    else:
        try:
            raw_text = data.decode("utf-8", errors="ignore")
        except Exception:
            raise HTTPException(status_code=415, detail="Formato non supportato")

    # Generate content
    gen = await generate_study_content(raw_text)

    mat_id = str(uuid.uuid4())
    mat = {
        "id": mat_id,
        "user_id": user["user_id"],
        "title": title or filename,
        "source_type": source_type,
        "storage_path": storage_path,
        "original_filename": filename,
        "raw_text": raw_text[:50000],
        "summary": gen.get("summary", ""),
        "schema_outline": gen.get("schema_outline", ""),
        "flashcards": gen.get("flashcards", []),
        "quiz": gen.get("quiz", []),
        "exam_questions": gen.get("exam_questions", []),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.materials.insert_one(mat)
    mat.pop("_id", None)
    return mat


class CreateFromTextReq(BaseModel):
    title: str
    text: str


@api_router.post("/materials/text")
async def create_from_text(req: CreateFromTextReq, user: dict = Depends(get_current_user)):
    await check_upload_limit(user)
    if len(req.text.strip()) < 30:
        raise HTTPException(status_code=400, detail="Testo troppo corto")
    gen = await generate_study_content(req.text)
    mat_id = str(uuid.uuid4())
    mat = {
        "id": mat_id,
        "user_id": user["user_id"],
        "title": req.title,
        "source_type": "text",
        "storage_path": None,
        "original_filename": None,
        "raw_text": req.text[:50000],
        "summary": gen.get("summary", ""),
        "schema_outline": gen.get("schema_outline", ""),
        "flashcards": gen.get("flashcards", []),
        "quiz": gen.get("quiz", []),
        "exam_questions": gen.get("exam_questions", []),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.materials.insert_one(mat)
    mat.pop("_id", None)
    return mat


@api_router.get("/materials")
async def list_materials(user: dict = Depends(get_current_user)):
    items = await db.materials.find({"user_id": user["user_id"]}, {"_id": 0, "raw_text": 0}).sort("created_at", -1).to_list(200)
    return items


@api_router.get("/materials/{material_id}")
async def get_material(material_id: str, user: dict = Depends(get_current_user)):
    mat = await db.materials.find_one({"id": material_id, "user_id": user["user_id"]}, {"_id": 0})
    if not mat:
        raise HTTPException(status_code=404, detail="Non trovato")
    return mat


@api_router.delete("/materials/{material_id}")
async def delete_material(material_id: str, user: dict = Depends(get_current_user)):
    r = await db.materials.delete_one({"id": material_id, "user_id": user["user_id"]})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Non trovato")
    return {"ok": True}


# ------------------------- Quiz + SRS -------------------------
@api_router.post("/materials/{material_id}/quiz/submit")
async def submit_quiz(material_id: str, result: QuizResult, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "material_id": material_id,
        "score": result.score,
        "total": result.total,
        "answers": result.answers,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.quiz_results.insert_one(doc)
    doc.pop("_id", None)
    return doc


def sm2_update(card: dict, quality: int) -> dict:
    """SuperMemo-2 spaced repetition."""
    ease = card.get("ease", 2.5)
    reps = card.get("repetitions", 0)
    interval = card.get("interval", 0)
    if quality < 3:
        reps = 0
        interval = 1
    else:
        if reps == 0:
            interval = 1
        elif reps == 1:
            interval = 6
        else:
            interval = round(interval * ease)
        reps += 1
        ease = max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    next_review = (datetime.now(timezone.utc) + timedelta(days=interval)).isoformat()
    card["ease"] = round(ease, 2)
    card["interval"] = interval
    card["repetitions"] = reps
    card["next_review"] = next_review
    return card


@api_router.post("/materials/{material_id}/flashcards/{card_id}/review")
async def review_flashcard(material_id: str, card_id: str, body: FlashcardReview, user: dict = Depends(get_current_user)):
    mat = await db.materials.find_one({"id": material_id, "user_id": user["user_id"]}, {"_id": 0})
    if not mat:
        raise HTTPException(status_code=404, detail="Non trovato")
    cards = mat.get("flashcards", [])
    updated = None
    for i, c in enumerate(cards):
        if c.get("id") == card_id:
            cards[i] = sm2_update(c, body.quality)
            updated = cards[i]
            break
    if not updated:
        raise HTTPException(status_code=404, detail="Flashcard non trovata")
    await db.materials.update_one({"id": material_id}, {"$set": {"flashcards": cards}})
    await db.flashcard_reviews.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "material_id": material_id,
        "card_id": card_id,
        "quality": body.quality,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return updated


# ------------------------- Study plan -------------------------
class StudyPlanReq(BaseModel):
    title: str
    exam_date: str  # ISO date
    total_pages: int
    material_ids: List[str] = []


@api_router.post("/study-plans")
async def create_study_plan(req: StudyPlanReq, user: dict = Depends(get_current_user)):
    try:
        exam = datetime.fromisoformat(req.exam_date).date()
    except Exception:
        raise HTTPException(status_code=400, detail="exam_date non valida")
    today = datetime.now(timezone.utc).date()
    days_avail = (exam - today).days
    if days_avail < 2:
        raise HTTPException(status_code=400, detail="L'esame deve essere almeno 2 giorni dopo oggi")

    # ~80% study, 20% review
    study_days = max(1, int(days_avail * 0.8))
    review_days = days_avail - study_days
    pages_per_day = max(1, req.total_pages // study_days) if study_days else req.total_pages

    # Pull topic names from materials if provided
    topics = []
    if req.material_ids:
        mats = await db.materials.find({"id": {"$in": req.material_ids}, "user_id": user["user_id"]}, {"_id": 0, "title": 1}).to_list(100)
        topics = [m["title"] for m in mats]

    days = []
    for i in range(days_avail):
        d = today + timedelta(days=i + 1)
        if i < study_days:
            start_p = i * pages_per_day + 1
            end_p = min(req.total_pages, (i + 1) * pages_per_day)
            topic = topics[i % len(topics)] if topics else f"Studio pagine {start_p}-{end_p}"
            days.append({
                "date": d.isoformat(),
                "type": "study",
                "pages": f"{start_p}-{end_p}",
                "topic": topic,
                "done": False,
            })
        else:
            days.append({
                "date": d.isoformat(),
                "type": "review",
                "pages": "",
                "topic": "Ripasso generale",
                "done": False,
            })
    plan = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "title": req.title,
        "exam_date": req.exam_date,
        "total_pages": req.total_pages,
        "material_ids": req.material_ids,
        "days": days,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.study_plans.insert_one(plan)
    plan.pop("_id", None)
    return plan


@api_router.get("/study-plans")
async def list_study_plans(user: dict = Depends(get_current_user)):
    return await db.study_plans.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)


@api_router.patch("/study-plans/{plan_id}/day/{day_index}")
async def toggle_plan_day(plan_id: str, day_index: int, user: dict = Depends(get_current_user)):
    plan = await db.study_plans.find_one({"id": plan_id, "user_id": user["user_id"]}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Non trovato")
    days = plan["days"]
    if day_index < 0 or day_index >= len(days):
        raise HTTPException(status_code=400, detail="Indice non valido")
    days[day_index]["done"] = not days[day_index].get("done", False)
    await db.study_plans.update_one({"id": plan_id}, {"$set": {"days": days}})
    return days[day_index]


# ------------------------- Stats -------------------------
@api_router.get("/stats/overview")
async def stats_overview(user: dict = Depends(get_current_user)):
    uid = user["user_id"]
    mats = await db.materials.count_documents({"user_id": uid})
    quizzes = await db.quiz_results.find({"user_id": uid}, {"_id": 0}).to_list(1000)
    reviews = await db.flashcard_reviews.count_documents({"user_id": uid})
    avg_score = 0
    if quizzes:
        avg_score = round(sum((q["score"] / max(1, q["total"])) for q in quizzes) / len(quizzes) * 100)
    # Last 7 days activity
    by_day = {}
    cutoff = (datetime.now(timezone.utc) - timedelta(days=6)).date()
    for q in quizzes:
        d = q["created_at"][:10]
        if datetime.fromisoformat(d).date() >= cutoff:
            by_day[d] = by_day.get(d, 0) + 1
    activity = []
    for i in range(7):
        d = (cutoff + timedelta(days=i)).isoformat()
        activity.append({"date": d, "quizzes": by_day.get(d, 0)})
    return {
        "materials": mats,
        "quizzes_taken": len(quizzes),
        "avg_score_pct": avg_score,
        "flashcards_reviewed": reviews,
        "activity": activity,
    }


# ------------------------- Billing (legacy mock kept for downgrade) -------------------------
@api_router.post("/billing/downgrade")
async def downgrade_free(user: dict = Depends(get_current_user)):
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"plan": "free", "premium_until": None}})
    return {"ok": True, "plan": "free"}


# ------------------------- Setup -------------------------
app.include_router(api_router)
from extras import extras_router  # noqa: E402
app.include_router(extras_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
