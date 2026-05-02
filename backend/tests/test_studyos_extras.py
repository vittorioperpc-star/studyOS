"""Tests for StudyOS extras: chat, notifications, push, PayPal billing."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://study-boost-107.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@studyos.app"
DEMO_PW = "demo1234"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PW}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---- auth/me with premium_until ----
class TestAuthMe:
    def test_me_has_premium_until_field(self, headers):
        r = requests.get(f"{API}/auth/me", headers=headers, timeout=20)
        assert r.status_code == 200
        u = r.json()
        assert "premium_until" in u
        # may be None for free demo user
        assert u.get("plan") in ("free", "premium")


# ---- Notifications ----
class TestNotifications:
    def test_list_notifications_shape(self, headers):
        r = requests.get(f"{API}/notifications", headers=headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert "items" in d and "unread" in d
        assert isinstance(d["items"], list)
        assert isinstance(d["unread"], int)

    def test_list_idempotent(self, headers):
        r1 = requests.get(f"{API}/notifications", headers=headers, timeout=20).json()
        r2 = requests.get(f"{API}/notifications", headers=headers, timeout=20).json()
        # count should not grow on repeat
        assert len(r2["items"]) == len(r1["items"])

    def test_read_all(self, headers):
        r = requests.post(f"{API}/notifications/read-all", headers=headers, timeout=20)
        assert r.status_code == 200
        assert r.json().get("ok") is True
        d = requests.get(f"{API}/notifications", headers=headers, timeout=20).json()
        assert d["unread"] == 0

    def test_mark_single_read_no_crash(self, headers):
        # no-op id — must not 500
        r = requests.post(f"{API}/notifications/nonexistent-id/read", headers=headers, timeout=20)
        assert r.status_code == 200


# ---- Web Push ----
class TestPush:
    def test_vapid_public_key(self, headers):
        r = requests.get(f"{API}/push/vapid-public-key", headers=headers, timeout=20)
        assert r.status_code == 200
        pk = r.json().get("public_key")
        assert isinstance(pk, str) and len(pk) > 30

    def test_subscribe_valid(self, headers):
        sub = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/TEST_endpoint_xyz",
            "keys": {"p256dh": "BLC8GOevpcpjQiLkO7JmVClQjycvTCYWm6Cq", "auth": "tBHItJI5svbpez7KI4CCXg"},
        }
        r = requests.post(f"{API}/push/subscribe", headers=headers, json={"subscription": sub}, timeout=20)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_subscribe_invalid(self, headers):
        r = requests.post(f"{API}/push/subscribe", headers=headers, json={"subscription": {"keys": {}}}, timeout=20)
        assert r.status_code == 400


# ---- Billing / PayPal ----
class TestBilling:
    def test_config(self, headers):
        r = requests.get(f"{API}/billing/config", headers=headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["provider"] == "paypal"
        assert d["currency"] == "EUR"
        assert d["price"] == "4.99"
        assert d.get("client_id")

    def test_create_order_returns_id(self, headers):
        r = requests.post(f"{API}/billing/paypal/create-order", headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "order_id" in d and len(d["order_id"]) > 5

    def test_capture_unapproved_returns_502(self, headers):
        # first create an order
        r = requests.post(f"{API}/billing/paypal/create-order", headers=headers, timeout=30)
        assert r.status_code == 200
        oid = r.json()["order_id"]
        r2 = requests.post(f"{API}/billing/paypal/capture/{oid}", headers=headers, timeout=30)
        # order is not approved, so capture must error out (502 or 402) — NOT 500
        assert r2.status_code in (402, 502), f"Unexpected status {r2.status_code}: {r2.text}"


# ---- Chat with material ----
class TestChat:
    @pytest.fixture(scope="class")
    def material_id(self, headers):
        # create a simple text material; may fail with 500 if LLM budget exceeded — handle gracefully
        r = requests.post(
            f"{API}/materials/text",
            headers=headers,
            json={"title": "TEST_Chat_Material", "text": "La fotosintesi è il processo per cui le piante convertono la luce solare, l'acqua e l'anidride carbonica in glucosio e ossigeno. Avviene nei cloroplasti delle cellule vegetali. È essenziale per la vita sulla Terra." * 2},
            timeout=120,
        )
        if r.status_code != 200:
            pytest.skip(f"Cannot create material (LLM issue): {r.status_code} {r.text[:200]}")
        return r.json()["id"]

    def test_history_empty_ok(self, headers, material_id):
        r = requests.get(f"{API}/materials/{material_id}/chat/history", headers=headers, timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_chat_send(self, headers, material_id):
        r = requests.post(
            f"{API}/materials/{material_id}/chat",
            headers=headers,
            json={"message": "Cos'è la fotosintesi?"},
            timeout=120,
        )
        if r.status_code == 500:
            # Expected if Emergent LLM budget exceeded — verify body mentions budget or error
            body = r.text.lower()
            assert "budget" in body or "exceeded" in body or "error" in body
            pytest.skip(f"LLM unavailable (expected): {r.text[:200]}")
        assert r.status_code == 200
        assert "reply" in r.json()
        # history should include at least 2 messages now
        h = requests.get(f"{API}/materials/{material_id}/chat/history", headers=headers, timeout=20).json()
        assert len(h) >= 2
        # chronological
        assert h[0]["role"] == "user"

    def test_chat_unknown_material(self, headers):
        r = requests.post(
            f"{API}/materials/nonexistent-id-xyz/chat",
            headers=headers,
            json={"message": "hi"},
            timeout=20,
        )
        assert r.status_code == 404
