from tests.conftest import goal_payload


async def test_list_goals_empty(client, auth_headers):
    res = await client.get("/api/v1/goals", headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == []


async def test_create_goal(client, auth_headers):
    res = await client.post("/api/v1/goals", json=goal_payload(), headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Emergency Fund"
    assert data["target_amount"] == 500000.0
    assert data["current_amount"] == 0.0
    assert data["is_completed"] is False
    assert data["type"] == "emergency"


async def test_create_goal_all_types(client, auth_headers):
    for goal_type in ("savings", "debt", "emergency", "investment", "custom"):
        res = await client.post(
            "/api/v1/goals",
            json=goal_payload(name=goal_type.capitalize(), type=goal_type),
            headers=auth_headers,
        )
        assert res.status_code == 201
        assert res.json()["type"] == goal_type


async def test_create_goal_with_deadline(client, auth_headers):
    res = await client.post(
        "/api/v1/goals",
        json=goal_payload(deadline="2025-12-31T00:00:00Z"),
        headers=auth_headers,
    )
    assert res.status_code == 201
    assert res.json()["deadline"] is not None


async def test_list_goals_returns_own_only(client, auth_headers, other_auth_headers):
    await client.post("/api/v1/goals", json=goal_payload(), headers=auth_headers)
    await client.post("/api/v1/goals", json=goal_payload(name="Car Fund"), headers=auth_headers)

    res_a = await client.get("/api/v1/goals", headers=auth_headers)
    res_b = await client.get("/api/v1/goals", headers=other_auth_headers)

    assert len(res_a.json()) == 2
    assert len(res_b.json()) == 0


async def test_update_goal_progress(client, auth_headers):
    created = (await client.post("/api/v1/goals", json=goal_payload(), headers=auth_headers)).json()
    res = await client.patch(
        f"/api/v1/goals/{created['id']}/progress",
        json={"current_amount": 250000.0},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["current_amount"] == 250000.0
    assert res.json()["is_completed"] is False


async def test_goal_auto_completes_when_target_reached(client, auth_headers):
    created = (await client.post("/api/v1/goals", json=goal_payload(target_amount=100000.0), headers=auth_headers)).json()
    res = await client.patch(
        f"/api/v1/goals/{created['id']}/progress",
        json={"current_amount": 100000.0},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["is_completed"] is True


async def test_goal_completes_when_exceeded(client, auth_headers):
    created = (await client.post("/api/v1/goals", json=goal_payload(target_amount=100000.0), headers=auth_headers)).json()
    res = await client.patch(
        f"/api/v1/goals/{created['id']}/progress",
        json={"current_amount": 120000.0},
        headers=auth_headers,
    )
    assert res.json()["is_completed"] is True


async def test_update_goal_progress_not_found(client, auth_headers):
    res = await client.patch(
        "/api/v1/goals/nonexistent/progress",
        json={"current_amount": 100.0},
        headers=auth_headers,
    )
    assert res.status_code == 404


async def test_update_other_user_goal_forbidden(client, auth_headers, other_auth_headers):
    created = (await client.post("/api/v1/goals", json=goal_payload(), headers=auth_headers)).json()
    res = await client.patch(
        f"/api/v1/goals/{created['id']}/progress",
        json={"current_amount": 1.0},
        headers=other_auth_headers,
    )
    assert res.status_code == 404


async def test_delete_goal(client, auth_headers):
    created = (await client.post("/api/v1/goals", json=goal_payload(), headers=auth_headers)).json()
    del_res = await client.delete(f"/api/v1/goals/{created['id']}", headers=auth_headers)
    assert del_res.status_code == 204

    remaining = await client.get("/api/v1/goals", headers=auth_headers)
    assert all(g["id"] != created["id"] for g in remaining.json())


async def test_delete_goal_not_found(client, auth_headers):
    res = await client.delete("/api/v1/goals/nonexistent", headers=auth_headers)
    assert res.status_code == 404


async def test_goals_require_auth(client):
    assert (await client.get("/api/v1/goals")).status_code == 401
    assert (await client.post("/api/v1/goals", json=goal_payload())).status_code == 401
