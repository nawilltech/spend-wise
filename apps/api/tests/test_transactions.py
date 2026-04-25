from tests.conftest import tx_payload


async def test_create_transaction(client, auth_headers):
    res = await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["amount"] == 5000.0
    assert data["currency"] == "NGN"
    assert data["type"] == "expense"
    assert "id" in data
    assert "created_at" in data


async def test_create_transaction_income(client, auth_headers):
    res = await client.post(
        "/api/v1/transactions",
        json=tx_payload(type="income", amount=150000.0, description="Salary"),
        headers=auth_headers,
    )
    assert res.status_code == 201
    assert res.json()["type"] == "income"
    assert res.json()["amount"] == 150000.0


async def test_create_transaction_usd(client, auth_headers):
    """Amount in USD gets converted to NGN base_amount."""
    res = await client.post(
        "/api/v1/transactions",
        json=tx_payload(amount=100.0, currency="USD"),
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["currency"] == "USD"
    assert data["base_currency"] == "NGN"
    assert data["base_amount"] > 0


async def test_create_transaction_no_auth(client):
    res = await client.post("/api/v1/transactions", json=tx_payload())
    assert res.status_code == 401


async def test_create_transaction_invalid_type(client, auth_headers):
    res = await client.post(
        "/api/v1/transactions",
        json=tx_payload(type="transfer"),
        headers=auth_headers,
    )
    assert res.status_code == 422


async def test_create_transaction_missing_date(client, auth_headers):
    payload = tx_payload()
    del payload["transaction_date"]
    res = await client.post("/api/v1/transactions", json=payload, headers=auth_headers)
    assert res.status_code == 422


async def test_list_transactions_empty(client, auth_headers):
    res = await client.get("/api/v1/transactions", headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == []


async def test_list_transactions_returns_own_only(client, auth_headers, other_auth_headers):
    """User A's transactions must not appear in User B's list."""
    await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)
    await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)

    res_a = await client.get("/api/v1/transactions", headers=auth_headers)
    res_b = await client.get("/api/v1/transactions", headers=other_auth_headers)

    assert len(res_a.json()) == 2
    assert len(res_b.json()) == 0


async def test_list_transactions_filter_by_type(client, auth_headers):
    await client.post("/api/v1/transactions", json=tx_payload(type="expense"), headers=auth_headers)
    await client.post("/api/v1/transactions", json=tx_payload(type="income"), headers=auth_headers)

    expenses = await client.get("/api/v1/transactions?type=expense", headers=auth_headers)
    income   = await client.get("/api/v1/transactions?type=income",  headers=auth_headers)

    assert len(expenses.json()) == 1
    assert len(income.json()) == 1
    assert expenses.json()[0]["type"] == "expense"


async def test_list_transactions_pagination(client, auth_headers):
    for _ in range(5):
        await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)

    page1 = await client.get("/api/v1/transactions?limit=3&offset=0", headers=auth_headers)
    page2 = await client.get("/api/v1/transactions?limit=3&offset=3", headers=auth_headers)

    assert len(page1.json()) == 3
    assert len(page2.json()) == 2


async def test_get_transaction(client, auth_headers):
    created = (await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)).json()
    res = await client.get(f"/api/v1/transactions/{created['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == created["id"]


async def test_get_transaction_not_found(client, auth_headers):
    res = await client.get("/api/v1/transactions/nonexistent-id", headers=auth_headers)
    assert res.status_code == 404


async def test_get_transaction_other_user_forbidden(client, auth_headers, other_auth_headers):
    """User B cannot fetch User A's transaction."""
    created = (await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)).json()
    res = await client.get(f"/api/v1/transactions/{created['id']}", headers=other_auth_headers)
    assert res.status_code == 404


async def test_update_transaction(client, auth_headers):
    created = (await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)).json()
    res = await client.patch(
        f"/api/v1/transactions/{created['id']}",
        json={"amount": 9999.0, "description": "Updated"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["amount"] == 9999.0
    assert res.json()["description"] == "Updated"


async def test_update_transaction_partial(client, auth_headers):
    """PATCH only updates provided fields; others remain unchanged."""
    created = (await client.post("/api/v1/transactions", json=tx_payload(description="Original"), headers=auth_headers)).json()
    res = await client.patch(
        f"/api/v1/transactions/{created['id']}",
        json={"amount": 1234.0},
        headers=auth_headers,
    )
    assert res.json()["amount"] == 1234.0
    assert res.json()["description"] == "Original"


async def test_update_transaction_not_found(client, auth_headers):
    res = await client.patch("/api/v1/transactions/bad-id", json={"amount": 1.0}, headers=auth_headers)
    assert res.status_code == 404


async def test_delete_transaction(client, auth_headers):
    created = (await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)).json()
    del_res = await client.delete(f"/api/v1/transactions/{created['id']}", headers=auth_headers)
    assert del_res.status_code == 204

    get_res = await client.get(f"/api/v1/transactions/{created['id']}", headers=auth_headers)
    assert get_res.status_code == 404


async def test_delete_transaction_not_found(client, auth_headers):
    res = await client.delete("/api/v1/transactions/nonexistent", headers=auth_headers)
    assert res.status_code == 404


async def test_delete_other_user_transaction_forbidden(client, auth_headers, other_auth_headers):
    created = (await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)).json()
    res = await client.delete(f"/api/v1/transactions/{created['id']}", headers=other_auth_headers)
    assert res.status_code == 404
    # original should still exist
    still_there = await client.get(f"/api/v1/transactions/{created['id']}", headers=auth_headers)
    assert still_there.status_code == 200
