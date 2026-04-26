"""Tests for soft delete and idempotency key behaviour on transactions."""
import uuid
from tests.conftest import tx_payload


# ── Soft delete ───────────────────────────────────────────────────────────────

async def test_delete_hides_from_list(client, auth_headers):
    created = (await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)).json()
    await client.delete(f"/api/v1/transactions/{created['id']}", headers=auth_headers)

    listing = await client.get("/api/v1/transactions", headers=auth_headers)
    ids = [t["id"] for t in listing.json()]
    assert created["id"] not in ids


async def test_delete_hides_from_get(client, auth_headers):
    created = (await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)).json()
    await client.delete(f"/api/v1/transactions/{created['id']}", headers=auth_headers)

    res = await client.get(f"/api/v1/transactions/{created['id']}", headers=auth_headers)
    assert res.status_code == 404


async def test_delete_hides_from_patch(client, auth_headers):
    created = (await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)).json()
    await client.delete(f"/api/v1/transactions/{created['id']}", headers=auth_headers)

    res = await client.patch(
        f"/api/v1/transactions/{created['id']}",
        json={"amount": 1.0},
        headers=auth_headers,
    )
    assert res.status_code == 404


async def test_deleted_transaction_excluded_from_analytics(client, auth_headers):
    created = (
        await client.post("/api/v1/transactions", json=tx_payload(type="income", amount=50000.0), headers=auth_headers)
    ).json()

    before = (await client.get("/api/v1/reports/analytics", headers=auth_headers)).json()
    assert before["total_income"] == 50000.0

    await client.delete(f"/api/v1/transactions/{created['id']}", headers=auth_headers)

    after = (await client.get("/api/v1/reports/analytics", headers=auth_headers)).json()
    assert after["total_income"] == 0.0


async def test_deleted_transaction_response_has_deleted_at(client, auth_headers):
    """deleted_at is null on a live transaction."""
    created = (await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)).json()
    assert created["deleted_at"] is None


# ── Idempotency key ───────────────────────────────────────────────────────────

async def test_idempotency_key_deduplicates(client, auth_headers):
    key = str(uuid.uuid4())
    first  = await client.post("/api/v1/transactions", json=tx_payload(idempotency_key=key), headers=auth_headers)
    second = await client.post("/api/v1/transactions", json=tx_payload(idempotency_key=key), headers=auth_headers)

    assert first.status_code == 201
    assert second.status_code == 200                     # replay returns 200
    assert first.json()["id"] == second.json()["id"]    # same transaction returned


async def test_idempotency_key_only_one_row_created(client, auth_headers):
    key = str(uuid.uuid4())
    for _ in range(3):
        await client.post("/api/v1/transactions", json=tx_payload(idempotency_key=key), headers=auth_headers)

    listing = await client.get("/api/v1/transactions", headers=auth_headers)
    assert len(listing.json()) == 1


async def test_no_idempotency_key_allows_duplicates(client, auth_headers):
    """Without a key, every POST creates a new row."""
    await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)
    await client.post("/api/v1/transactions", json=tx_payload(), headers=auth_headers)

    listing = await client.get("/api/v1/transactions", headers=auth_headers)
    assert len(listing.json()) == 2


async def test_idempotency_key_is_user_scoped(client, auth_headers, other_auth_headers):
    """The same key used by two different users creates two separate transactions."""
    key = str(uuid.uuid4())
    res_a = await client.post("/api/v1/transactions", json=tx_payload(idempotency_key=key), headers=auth_headers)
    res_b = await client.post("/api/v1/transactions", json=tx_payload(idempotency_key=key), headers=other_auth_headers)

    assert res_a.status_code == 201
    assert res_b.status_code == 201
    assert res_a.json()["id"] != res_b.json()["id"]


async def test_idempotency_key_returned_in_response(client, auth_headers):
    key = str(uuid.uuid4())
    res = await client.post("/api/v1/transactions", json=tx_payload(idempotency_key=key), headers=auth_headers)
    assert res.json()["idempotency_key"] == key
