"""StudyOS backend API tests."""
import os, uuid, requests, pytest
from datetime import date, timedelta

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://study-boost-107.preview.emergentagent.com").rstrip("/") + "/api"
DEMO = {"email": "demo@studyos.app", "password": "demo1234"}

@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE}/auth/login", json=DEMO, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]

@pytest.fixture(scope="module")
def h(token):
    return {"Authorization": f"Bearer {token}"}

def test_root():
    r = requests.get(f"{BASE}/", timeout=15)
    assert r.status_code == 200 and r.json().get("ok") is True

def test_login_bad():
    r = requests.post(f"{BASE}/auth/login", json={"email":"demo@studyos.app","password":"x"}, timeout=15)
    assert r.status_code == 401

def test_signup_and_me():
    email = f"test_{uuid.uuid4().hex[:8]}@studyos.app"
    r = requests.post(f"{BASE}/auth/signup", json={"email":email,"password":"pw12345","name":"T"}, timeout=20)
    assert r.status_code == 200
    tok = r.json()["token"]
    me = requests.get(f"{BASE}/auth/me", headers={"Authorization":f"Bearer {tok}"}, timeout=15)
    assert me.status_code == 200 and me.json()["email"] == email

def test_me(h):
    r = requests.get(f"{BASE}/auth/me", headers=h, timeout=15)
    assert r.status_code == 200 and r.json()["email"] == DEMO["email"]

def test_me_unauth():
    assert requests.get(f"{BASE}/auth/me", timeout=15).status_code == 401

def test_materials_list(h):
    r = requests.get(f"{BASE}/materials", headers=h, timeout=20)
    assert r.status_code == 200 and isinstance(r.json(), list)

def test_stats(h):
    r = requests.get(f"{BASE}/stats/overview", headers=h, timeout=20)
    assert r.status_code == 200
    d = r.json()
    for k in ["materials","quizzes_taken","avg_score_pct","flashcards_reviewed","activity"]:
        assert k in d
    assert len(d["activity"]) == 7

def test_material_text_and_flow(h):
    """Create material via text - LLM call takes time."""
    text = ("La fotosintesi clorofilliana è il processo biochimico con cui le piante verdi producono glucosio a partire da anidride carbonica e acqua "
            "utilizzando la luce solare. Avviene nei cloroplasti, organelli cellulari contenenti clorofilla. Il processo si divide in fase luminosa, che "
            "avviene nei tilacoidi e produce ATP e NADPH, e fase oscura o ciclo di Calvin, che avviene nello stroma e fissa la CO2 in zuccheri. "
            "La clorofilla assorbe principalmente luce rossa e blu, riflettendo il verde. Il prodotto finale include glucosio e ossigeno come sottoprodotto, "
            "fondamentale per la respirazione di tutti gli organismi aerobi. L'equazione netta è 6 CO2 + 6 H2O -> C6H12O6 + 6 O2. ") * 2
    r = requests.post(f"{BASE}/materials/text", headers=h, json={"title":"TEST_Fotosintesi","text":text}, timeout=180)
    assert r.status_code == 200, r.text
    mat = r.json()
    mid = mat["id"]
    assert mat["summary"]
    # Get
    g = requests.get(f"{BASE}/materials/{mid}", headers=h, timeout=20)
    assert g.status_code == 200
    # Quiz submit
    q = requests.post(f"{BASE}/materials/{mid}/quiz/submit", headers=h,
                      json={"material_id":mid,"score":3,"total":5,"answers":[]}, timeout=20)
    assert q.status_code == 200
    # Flashcard review (if any card exists)
    cards = mat.get("flashcards", [])
    if cards:
        cid = cards[0]["id"]
        fr = requests.post(f"{BASE}/materials/{mid}/flashcards/{cid}/review", headers=h,
                           json={"card_id":cid,"quality":4}, timeout=20)
        assert fr.status_code == 200
    # Delete
    d = requests.delete(f"{BASE}/materials/{mid}", headers=h, timeout=20)
    assert d.status_code == 200

def test_study_plan(h):
    exam = (date.today() + timedelta(days=10)).isoformat()
    r = requests.post(f"{BASE}/study-plans", headers=h,
                      json={"title":"TEST_Plan","exam_date":exam,"total_pages":50,"material_ids":[]}, timeout=20)
    assert r.status_code == 200, r.text
    pid = r.json()["id"]
    assert len(r.json()["days"]) >= 2
    # Toggle day
    t = requests.patch(f"{BASE}/study-plans/{pid}/day/0", headers=h, timeout=15)
    assert t.status_code == 200 and t.json()["done"] is True
    lst = requests.get(f"{BASE}/study-plans", headers=h, timeout=15)
    assert lst.status_code == 200 and any(p["id"]==pid for p in lst.json())

def test_billing_upgrade_downgrade(h):
    r = requests.post(f"{BASE}/billing/upgrade", headers=h, timeout=15)
    assert r.status_code == 200 and r.json()["plan"] == "premium"
    me = requests.get(f"{BASE}/auth/me", headers=h, timeout=15).json()
    assert me["plan"] == "premium"
    d = requests.post(f"{BASE}/billing/downgrade", headers=h, timeout=15)
    assert d.status_code == 200 and d.json()["plan"] == "free"

def test_text_too_short(h):
    r = requests.post(f"{BASE}/materials/text", headers=h, json={"title":"x","text":"short"}, timeout=20)
    assert r.status_code == 400
