"""Tests for POST /transactions/bulk."""
import uuid
from tests.conftest import tx_payload


def bulk(*overrides_list):
    """Build a list of transaction payloads."""
    return [tx_payload(**o) for o in overrides_list]


# ── Basic behaviour ───────────────────────────────────────────────────────────

async def test_bulk_requires_auth(client):
    res = await client.post("/api/v1/transactions/bulk", json=bulk())
    assert res.status_code == 401


async def test_bulk_create_multiple(client, auth_headers):
    res = await client.post(
        "/api/v1/transactions/bulk",
        json=bulk(
            {"type": "expense", "amount": 1000.0},
            {"type": "income",  "amount": 5000.0},
            {"type": "expense", "amount": 2500.0},
        ),
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["created_count"] == 3
    assert data["skipped_count"] == 0
    assert len(data["created"]) == 3
    assert len(data["skipped"]) == 0


async def test_bulk_rows_appear_in_list(client, auth_headers):
    await client.post(
        "/api/v1/transactions/bulk",
        json=bulk({}, {}, {}),
        headers=auth_headers,
    )
    listing = await client.get("/api/v1/transactions", headers=auth_headers)
    assert len(listing.json()) == 3


async def test_bulk_single_item(client, auth_headers):
    res = await client.post("/api/v1/transactions/bulk", json=bulk({}), headers=auth_headers)
    assert res.status_code == 201
    assert res.json()["created_count"] == 1


async def test_bulk_empty_list_rejected(client, auth_headers):
    res = await client.post("/api/v1/transactions/bulk", json=[], headers=auth_headers)
    assert res.status_code == 422


async def test_bulk_over_limit_rejected(client, auth_headers):
    res = await client.post(
        "/api/v1/transactions/bulk",
        json=bulk(*[{} for _ in range(501)]),
        headers=auth_headers,
    )
    assert res.status_code == 422


# ── Idempotency ───────────────────────────────────────────────────────────────

async def test_bulk_skips_duplicate_idempotency_keys(client, auth_headers):
    key = str(uuid.uuid4())

    # First call — creates the transaction
    res1 = await client.post(
        "/api/v1/transactions/bulk",
        json=bulk({"idempotency_key": key, "amount": 1000.0}),
        headers=auth_headers,
    )
    assert res1.json()["created_count"] == 1
    original_id = res1.json()["created"][0]["id"]

    # Second call with same key — skips it
    res2 = await client.post(
        "/api/v1/transactions/bulk",
        json=bulk({"idempotency_key": key, "amount": 1000.0}),
        headers=auth_headers,
    )
    assert res2.json()["created_count"] == 0
    assert res2.json()["skipped_count"] == 1
    assert res2.json()["skipped"][0]["id"] == original_id


async def test_bulk_mixed_new_and_skipped(client, auth_headers):
    key = str(uuid.uuid4())

    await client.post(
        "/api/v1/transactions/bulk",
        json=bulk({"idempotency_key": key}),
        headers=auth_headers,
    )

    res = await client.post(
        "/api/v1/transactions/bulk",
        json=bulk(
            {"idempotency_key": key},           # duplicate → skipped
            {"amount": 9999.0},                 # new, no key → created
            {"idempotency_key": str(uuid.uuid4())},  # new key → created
        ),
        headers=auth_headers,
    )
    assert res.json()["created_count"] == 2
    assert res.json()["skipped_count"] == 1


async def test_bulk_all_skipped(client, auth_headers):
    key_a, key_b = str(uuid.uuid4()), str(uuid.uuid4())
    await client.post(
        "/api/v1/transactions/bulk",
        json=bulk({"idempotency_key": key_a}, {"idempotency_key": key_b}),
        headers=auth_headers,
    )

    res = await client.post(
        "/api/v1/transactions/bulk",
        json=bulk({"idempotency_key": key_a}, {"idempotency_key": key_b}),
        headers=auth_headers,
    )
    assert res.json()["created_count"] == 0
    assert res.json()["skipped_count"] == 2
    # No new rows
    listing = await client.get("/api/v1/transactions", headers=auth_headers)
    assert len(listing.json()) == 2


# ── Data integrity ────────────────────────────────────────────────────────────

async def test_bulk_currency_conversion(client, auth_headers):
    """Each item in the batch gets its base_amount converted."""
    res = await client.post(
        "/api/v1/transactions/bulk",
        json=bulk(
            {"amount": 100.0, "currency": "USD"},
            {"amount": 5000.0, "currency": "NGN"},
        ),
        headers=auth_headers,
    )
    created = res.json()["created"]
    usd_tx = next(t for t in created if t["currency"] == "USD")
    ngn_tx = next(t for t in created if t["currency"] == "NGN")

    assert usd_tx["base_amount"] > usd_tx["amount"]   # USD → NGN conversion inflates value
    assert ngn_tx["base_amount"] == ngn_tx["amount"]  # NGN → NGN is 1:1


async def test_bulk_is_atomic(client, auth_headers):
    """An invalid item in the batch causes the whole request to fail (422 from Pydantic)."""
    res = await client.post(
        "/api/v1/transactions/bulk",
        json=[
            tx_payload(),
            {"type": "INVALID", "amount": 100.0, "currency": "NGN"},  # bad type
        ],
        headers=auth_headers,
    )
    assert res.status_code == 422
    # Nothing was persisted
    listing = await client.get("/api/v1/transactions", headers=auth_headers)
    assert listing.json() == []


async def test_bulk_users_isolated(client, auth_headers, other_auth_headers):
    await client.post("/api/v1/transactions/bulk", json=bulk({}, {}), headers=auth_headers)

    res_b = await client.get("/api/v1/transactions", headers=other_auth_headers)
    assert res_b.json() == []
