from tests.conftest import category_payload


async def test_list_categories_empty(client, auth_headers):
    res = await client.get("/api/v1/categories", headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == []


async def test_create_category(client, auth_headers):
    res = await client.post("/api/v1/categories", json=category_payload(), headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Food"
    assert data["icon"] == "🍔"
    assert data["type"] == "expense"
    assert data["is_default"] is False


async def test_create_category_income_type(client, auth_headers):
    res = await client.post(
        "/api/v1/categories",
        json=category_payload(name="Salary", type="income"),
        headers=auth_headers,
    )
    assert res.status_code == 201
    assert res.json()["type"] == "income"


async def test_list_categories_returns_own_only(client, auth_headers, other_auth_headers):
    await client.post("/api/v1/categories", json=category_payload(), headers=auth_headers)
    await client.post("/api/v1/categories", json=category_payload(name="Transport"), headers=auth_headers)

    res_a = await client.get("/api/v1/categories", headers=auth_headers)
    res_b = await client.get("/api/v1/categories", headers=other_auth_headers)

    assert len(res_a.json()) == 2
    assert len(res_b.json()) == 0


async def test_update_category(client, auth_headers):
    created = (await client.post("/api/v1/categories", json=category_payload(), headers=auth_headers)).json()
    res = await client.patch(
        f"/api/v1/categories/{created['id']}",
        json={"name": "Groceries", "icon": "🛒", "color": "#00FF00", "type": "expense"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["name"] == "Groceries"
    assert res.json()["icon"] == "🛒"


async def test_update_category_not_found(client, auth_headers):
    res = await client.patch(
        "/api/v1/categories/nonexistent",
        json=category_payload(),
        headers=auth_headers,
    )
    assert res.status_code == 404


async def test_update_other_user_category_forbidden(client, auth_headers, other_auth_headers):
    created = (await client.post("/api/v1/categories", json=category_payload(), headers=auth_headers)).json()
    res = await client.patch(
        f"/api/v1/categories/{created['id']}",
        json=category_payload(name="Hacked"),
        headers=other_auth_headers,
    )
    assert res.status_code == 404


async def test_delete_category(client, auth_headers):
    created = (await client.post("/api/v1/categories", json=category_payload(), headers=auth_headers)).json()
    del_res = await client.delete(f"/api/v1/categories/{created['id']}", headers=auth_headers)
    assert del_res.status_code == 204

    res = await client.get("/api/v1/categories", headers=auth_headers)
    assert all(c["id"] != created["id"] for c in res.json())


async def test_delete_category_not_found(client, auth_headers):
    res = await client.delete("/api/v1/categories/nonexistent", headers=auth_headers)
    assert res.status_code == 404


async def test_categories_require_auth(client):
    assert (await client.get("/api/v1/categories")).status_code == 401
    assert (await client.post("/api/v1/categories", json=category_payload())).status_code == 401
