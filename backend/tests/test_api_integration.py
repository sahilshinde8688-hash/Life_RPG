import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal, Base, engine
from app.core.seeds import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
    yield

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_auth_register_and_login():
    # 1. Register User A
    reg_payload = {
        "email": "user_a@liferpg.test",
        "password": "Password123!",
        "display_name": "Hero A",
        "character_title": "The Novice"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 200
    data = res.json()
    token_a = data["access_token"]
    assert token_a is not None

    # 2. Login User A
    login_res = client.post("/api/v1/auth/login", json={
        "email": "user_a@liferpg.test",
        "password": "Password123!"
    })
    assert login_res.status_code == 200

    # 3. Get User A profile
    me_res = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token_a}"})
    assert me_res.status_code == 200
    assert me_res.json()["display_name"] == "Hero A"

def test_quest_crud_and_completion_cascade():
    # Login as demo user
    login_res = client.post("/api/v1/auth/login", json={
        "email": "wanderer@liferpg.app",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Quest
    quest_payload = {
        "title": "Solve 3 Graph Theory Problems",
        "description": "BFS, DFS, and Dijkstra on LeetCode",
        "category_name": "Coding",
        "difficulty": "medium",
        "estimated_duration": 45
    }
    create_res = client.post("/api/v1/quests", json=quest_payload, headers=headers)
    assert create_res.status_code == 201
    quest_id = create_res.json()["id"]

    # 2. List quests
    list_res = client.get("/api/v1/quests", headers=headers)
    assert list_res.status_code == 200
    quest_titles = [q["title"] for q in list_res.json()]
    assert "Solve 3 Graph Theory Problems" in quest_titles

    # 3. Complete Quest (cascade test)
    complete_res = client.post(f"/api/v1/quests/{quest_id}/complete", headers=headers)
    assert complete_res.status_code == 200
    comp_data = complete_res.json()
    assert comp_data["xp_awarded"] > 0
    assert comp_data["gold_awarded"] > 0
    assert "intellect" in comp_data["attribute_deltas"]

    # 4. Check that progress reflects append-only ledger update
    prog_res = client.get("/api/v1/progress", headers=headers)
    assert prog_res.status_code == 200
    assert prog_res.json()["total_xp"] >= comp_data["xp_awarded"]

def test_bola_security_isolation():
    """Verify that User B cannot view or complete User A's quest."""
    # Register User A
    res_a = client.post("/api/v1/auth/register", json={
        "email": "owner@liferpg.test",
        "password": "Password123!",
        "display_name": "Owner"
    })
    token_a = res_a.json()["access_token"]

    # User A creates a quest
    quest_res = client.post(
        "/api/v1/quests",
        json={"title": "Secret Strategy", "difficulty": "hard"},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    secret_quest_id = quest_res.json()["id"]

    # Register User B (Attacker / snooper)
    res_b = client.post("/api/v1/auth/register", json={
        "email": "snooper@liferpg.test",
        "password": "Password123!",
        "display_name": "Snooper"
    })
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B attempts to GET User A's quest -> MUST 404 (BOLA protection)
    get_res = client.get(f"/api/v1/quests/{secret_quest_id}", headers=headers_b)
    assert get_res.status_code == 404

    # User B attempts to COMPLETE User A's quest -> MUST 404
    comp_res = client.post(f"/api/v1/quests/{secret_quest_id}/complete", headers=headers_b)
    assert comp_res.status_code == 404

def test_economy_insufficient_funds_and_atomic_purchase():
    # Register new user with low starting gold
    res = client.post("/api/v1/auth/register", json={
        "email": "shopper@liferpg.test",
        "password": "Password123!",
        "display_name": "Shopper"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Shop catalog
    shop_res = client.get("/api/v1/shop", headers=headers)
    assert shop_res.status_code == 200
    items = shop_res.json()["items"]
    expensive_item = next(i for i in items if i["price_gold"] >= 200)

    # Attempt to purchase with insufficient funds -> MUST fail with 400
    fail_purchase = client.post(f"/api/v1/shop/{expensive_item['id']}/purchase", headers=headers)
    assert fail_purchase.status_code == 400
    assert fail_purchase.json()["detail"]["error"]["code"] == "INSUFFICIENT_FUNDS"

def test_ai_planner_and_coach():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "wanderer@liferpg.app",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. AI Quest Plan
    plan_res = client.post("/api/v1/ai/quest-plan", json={
        "goal": "Prepare for Machine Learning Examination",
        "timeframe_days": 14,
        "auto_save_drafts": True
    }, headers=headers)
    assert plan_res.status_code == 200
    proposed = plan_res.json()["proposed_quests"]
    assert len(proposed) >= 2
    assert proposed[0]["status"] == "DRAFT"

    # 2. AI Daily Coach
    coach_res = client.post("/api/v1/ai/daily-coach", headers=headers)
    assert coach_res.status_code == 200
    assert "coach_insight" in coach_res.json()
    assert "recommended_quest" in coach_res.json()
