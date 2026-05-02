"""StudyOS v3 tests: /me/limits, support chat, study-plan free gate, chat 10/day gate."""
import os
import pytest
import requests
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://study-boost-107.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@studyos.app"
DEMO_PW = "demo1234"


@pytest.fixture(scope="module")
def headers():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PW}, timeout=60)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


# ------------- /me/limits -------------
class TestLimits:
    def test_limits_shape_and_values(self, headers):
        r = requests.get(f"{API}/me/limits", headers=headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "plan" in d
        assert d["plan"] in ("free", "premium")
        assert "limits" in d
        for key in ("uploads", "chat_messages", "study_plans"):
            assert key in d["limits"], f"missing {key}"
            blk = d["limits"][key]
            assert "used" in blk and "max" in blk
            assert isinstance(blk["used"], int)
            if d["plan"] == "free":
                assert blk["max"] is not None and isinstance(blk["max"], int)
            else:
                assert blk["max"] is None

    def test_limits_free_max_values(self, headers):
        r = requests.get(f"{API}/me/limits", headers=headers, timeout=20).json()
        if r["plan"] == "free":
            assert r["limits"]["uploads"]["max"] == 3
            assert r["limits"]["chat_messages"]["max"] == 10
            assert r["limits"]["study_plans"]["max"] == 1


# ------------- Study-plan Free gate -------------
class TestStudyPlanFreeGate:
    def test_existing_plans_visible_via_get(self, headers):
        r = requests.get(f"{API}/study-plans", headers=headers, timeout=20)
        assert r.status_code == 200
        plans = r.json()
        # demo user already has >=1 (per problem statement), so GET works
        assert isinstance(plans, list)

    def test_create_blocked_402_for_free(self, headers):
        # confirm plan is free first
        me = requests.get(f"{API}/auth/me", headers=headers, timeout=20).json()
        if me.get("plan") == "premium":
            pytest.skip("Demo user is premium right now; gate test N/A")
        # confirm there is at least 1 plan
        plans = requests.get(f"{API}/study-plans", headers=headers, timeout=20).json()
        if len(plans) < 1:
            # create one to set the floor
            future = (datetime.now(timezone.utc) + timedelta(days=10)).date().isoformat()
            r0 = requests.post(
                f"{API}/study-plans", headers=headers,
                json={"title": "TEST_Plan_Seed", "exam_date": future, "total_pages": 50, "material_ids": []},
                timeout=30,
            )
            assert r0.status_code == 200, r0.text
        future = (datetime.now(timezone.utc) + timedelta(days=10)).date().isoformat()
        r = requests.post(
            f"{API}/study-plans",
            headers=headers,
            json={"title": "TEST_Plan_Blocked", "exam_date": future, "total_pages": 50, "material_ids": []},
            timeout=30,
        )
        assert r.status_code == 402, f"Expected 402, got {r.status_code}: {r.text}"
        assert "Premium" in r.text or "premium" in r.text


# ------------- Support chat -------------
class TestSupportChat:
    def test_history_endpoint(self, headers):
        r = requests.get(f"{API}/support/chat/history", headers=headers, timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_history_chronological(self, headers):
        msgs = requests.get(f"{API}/support/chat/history", headers=headers, timeout=20).json()
        if len(msgs) >= 2:
            # ascending by created_at
            for i in range(1, len(msgs)):
                assert msgs[i - 1]["created_at"] <= msgs[i]["created_at"]

    def test_send_message(self, headers):
        r = requests.post(
            f"{API}/support/chat",
            headers=headers,
            json={"message": "Come funziona StudyOS?"},
            timeout=120,
        )
        if r.status_code == 500 and ("budget" in r.text.lower() or "exceeded" in r.text.lower()):
            pytest.skip("LLM budget exceeded (expected)")
        assert r.status_code == 200, r.text
        d = r.json()
        assert "reply" in d
        assert isinstance(d["reply"], str) and len(d["reply"]) > 0

        # history reflects new pair
        h = requests.get(f"{API}/support/chat/history", headers=headers, timeout=20).json()
        assert len(h) >= 2
        # last 2 should be user then assistant
        assert h[-2]["role"] == "user"
        assert h[-1]["role"] == "assistant"


# ------------- Material chat 10/day gate (smoke) -------------
class TestMaterialChatGate:
    """We don't exhaust the 10/day budget; we just verify the endpoint enforces auth and 404 for unknown."""
    def test_unknown_material_404(self, headers):
        r = requests.post(
            f"{API}/materials/does-not-exist/chat",
            headers=headers, json={"message": "hi"}, timeout=20,
        )
        assert r.status_code == 404

    def test_unauth_401(self):
        r = requests.post(
            f"{API}/materials/x/chat", json={"message": "hi"}, timeout=20,
        )
        assert r.status_code == 401
