from tests.conftest import budget_payload, category_payload


async def _create_category(client, headers, **overrides) -> dict:
    res = await client.post("/api/v1/categories", json=category_payload(**overrides), headers=headers)
    return res.json()


async def _create_category_id(client, headers, **overrides) -> str:
    return (await _create_category(client, headers, **overrides))["id"]


async def test_list_budgets_empty(client, auth_headers):
    res = await client.get("/api/v1/budgets", headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == []


async def test_create_budget(client, auth_headers):
    cat_id = await _create_category_id(client, auth_headers)
    res = await client.post("/api/v1/budgets", json=budget_payload(cat_id), headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["amount"] == 50000.0
    assert data["currency"] == "NGN"
    assert data["period"] == "monthly"
    assert data["is_active"] is True
    assert data["category_id"] == cat_id


async def test_budget_response_includes_joined_fields(client, auth_headers, registered_user):
    cat = await _create_category(
        client, auth_headers,
        name="Groceries", type="expense", frequency="monthly"
    )
    res = await client.post("/api/v1/budgets", json=budget_payload(cat["id"]), headers=auth_headers)
    assert res.status_code == 201
    data = res.json()

    # user join
    assert data["user"]["name"] == registered_user["user"]["name"]
    assert data["user"]["id"] == registered_user["user"]["id"]

    # category join
    assert data["category"]["name"] == "Groceries"
    assert data["category"]["type"] == "expense"
    assert data["category"]["frequency"] == "monthly"
    assert "icon" in data["category"]
    assert "color" in data["category"]


async def test_list_budgets_includes_joined_fields(client, auth_headers):
    cat_id = await _create_category_id(client, auth_headers, name="Transport")
    await client.post("/api/v1/budgets", json=budget_payload(cat_id), headers=auth_headers)

    res = await client.get("/api/v1/budgets", headers=auth_headers)
    budget = res.json()[0]
    assert budget["category"]["name"] == "Transport"
    assert "user" in budget
    assert budget["user"]["name"] is not None


async def test_create_budget_different_periods(client, auth_headers):
    cat_id = await _create_category_id(client, auth_headers)
    for period in ("daily", "weekly", "monthly", "quarterly", "annual"):
        res = await client.post(
            "/api/v1/budgets",
            json=budget_payload(cat_id, period=period, amount=1000.0),
            headers=auth_headers,
        )
        assert res.status_code == 201
        assert res.json()["period"] == period


async def test_list_budgets_returns_own_only(client, auth_headers, other_auth_headers):
    cat_id = await _create_category_id(client, auth_headers)
    await client.post("/api/v1/budgets", json=budget_payload(cat_id), headers=auth_headers)

    res_a = await client.get("/api/v1/budgets", headers=auth_headers)
    res_b = await client.get("/api/v1/budgets", headers=other_auth_headers)

    assert len(res_a.json()) == 1
    assert len(res_b.json()) == 0


async def test_update_budget(client, auth_headers):
    cat_id = await _create_category_id(client, auth_headers)
    created = (await client.post("/api/v1/budgets", json=budget_payload(cat_id), headers=auth_headers)).json()

    res = await client.patch(
        f"/api/v1/budgets/{created['id']}",
        json={"amount": 75000.0, "period": "weekly"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["amount"] == 75000.0
    assert res.json()["period"] == "weekly"
    # joined fields still present after update
    assert res.json()["category"]["id"] == cat_id


async def test_update_budget_not_found(client, auth_headers):
    cat_id = await _create_category_id(client, auth_headers)
    res = await client.patch(
        "/api/v1/budgets/nonexistent",
        json=budget_payload(cat_id),
        headers=auth_headers,
    )
    assert res.status_code == 404


async def test_delete_budget(client, auth_headers):
    cat_id = await _create_category_id(client, auth_headers)
    created = (await client.post("/api/v1/budgets", json=budget_payload(cat_id), headers=auth_headers)).json()
    del_res = await client.delete(f"/api/v1/budgets/{created['id']}", headers=auth_headers)
    assert del_res.status_code == 204

    remaining = await client.get("/api/v1/budgets", headers=auth_headers)
    assert all(b["id"] != created["id"] for b in remaining.json())


async def test_delete_budget_not_found(client, auth_headers):
    res = await client.delete("/api/v1/budgets/nonexistent", headers=auth_headers)
    assert res.status_code == 404


async def test_delete_other_user_budget_forbidden(client, auth_headers, other_auth_headers):
    cat_id = await _create_category_id(client, auth_headers)
    created = (await client.post("/api/v1/budgets", json=budget_payload(cat_id), headers=auth_headers)).json()
    res = await client.delete(f"/api/v1/budgets/{created['id']}", headers=other_auth_headers)
    assert res.status_code == 404


async def test_budgets_require_auth(client):
    assert (await client.get("/api/v1/budgets")).status_code == 401
