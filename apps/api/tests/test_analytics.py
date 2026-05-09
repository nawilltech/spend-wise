"""Tests for GET /transactions/analytics and GET /admin/* endpoints."""
from tests.conftest import tx_payload


# ── /transactions/analytics ───────────────────────────────────────────────────

async def test_analytics_requires_auth(client):
    res = await client.get("/api/v1/reports/analytics")
    assert res.status_code == 401


async def test_analytics_empty(client, auth_headers):
    res = await client.get("/api/v1/reports/analytics", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_income"] == 0
    assert data["total_expense"] == 0
    assert data["total_volume"] == 0
    assert data["entry_count"] == 0
    assert data["net_savings"] == 0
    assert data["savings_rate"] == 0
    assert data["category_breakdown"] == []
    assert data["period"] == "monthly"


async def test_analytics_with_transactions(client, auth_headers):
    await client.post("/api/v1/transactions", json=tx_payload(type="income",  amount=100000.0), headers=auth_headers)
    await client.post("/api/v1/transactions", json=tx_payload(type="expense", amount=30000.0),  headers=auth_headers)
    await client.post("/api/v1/transactions", json=tx_payload(type="expense", amount=20000.0),  headers=auth_headers)

    res = await client.get("/api/v1/reports/analytics", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()

    assert data["income_count"] == 1
    assert data["expense_count"] == 2
    assert data["entry_count"] == 3
    assert data["total_income"] == 100000.0
    assert data["total_expense"] == 50000.0
    assert data["total_volume"] == 150000.0
    assert data["net_savings"] == 50000.0
    assert data["savings_rate"] == 50.0
    assert data["highest_income"] == 100000.0
    assert data["lowest_income"] == 100000.0
    assert data["highest_expense"] == 30000.0
    assert data["lowest_expense"] == 20000.0


async def test_analytics_period_weekly(client, auth_headers):
    await client.post("/api/v1/transactions", json=tx_payload(type="income", amount=50000.0), headers=auth_headers)
    res = await client.get("/api/v1/reports/analytics?period=weekly", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["period"] == "weekly"
    assert res.json()["total_income"] == 50000.0


async def test_analytics_all_valid_periods(client, auth_headers):
    for period in ["daily", "weekly", "monthly", "quarterly", "annual"]:
        res = await client.get(f"/api/v1/reports/analytics?period={period}", headers=auth_headers)
        assert res.status_code == 200, f"Failed for period={period}"
        assert res.json()["period"] == period


async def test_analytics_invalid_period(client, auth_headers):
    res = await client.get("/api/v1/reports/analytics?period=biannual", headers=auth_headers)
    assert res.status_code == 422


async def test_analytics_user_sees_own_only(client, auth_headers, other_auth_headers):
    """User A's analytics should not include User B's transactions."""
    await client.post("/api/v1/transactions", json=tx_payload(type="income", amount=999999.0), headers=other_auth_headers)

    res = await client.get("/api/v1/reports/analytics", headers=auth_headers)
    assert res.json()["total_income"] == 0


async def test_analytics_chart_data_present(client, auth_headers):
    await client.post("/api/v1/transactions", json=tx_payload(type="expense", amount=5000.0), headers=auth_headers)
    res = await client.get("/api/v1/reports/analytics", headers=auth_headers)
    data = res.json()
    assert isinstance(data["chart_data"], list)
    assert len(data["chart_data"]) >= 1
    point = data["chart_data"][0]
    assert "label" in point
    assert "income" in point
    assert "expense" in point
    assert "net" in point


async def test_analytics_savings_rate_zero_income(client, auth_headers):
    """Savings rate should be 0 when there is no income (avoid division by zero)."""
    await client.post("/api/v1/transactions", json=tx_payload(type="expense", amount=5000.0), headers=auth_headers)
    res = await client.get("/api/v1/reports/analytics", headers=auth_headers)
    assert res.json()["savings_rate"] == 0.0


# ── /admin/users ──────────────────────────────────────────────────────────────

async def test_admin_users_requires_auth(client):
    res = await client.get("/api/v1/admin/users")
    assert res.status_code == 401


async def test_admin_users_requires_admin_role(client, auth_headers):
    res = await client.get("/api/v1/admin/users", headers=auth_headers)
    assert res.status_code == 403


async def test_admin_users_list(client, admin_auth_headers, auth_headers):
    # auth_headers creates a regular user; admin sees them all
    res = await client.get("/api/v1/admin/users", headers=admin_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 2           # admin + regular user
    emails = {u["email"] for u in data}
    assert "admin@spendwise.app" in emails
    # each entry has the expected keys
    entry = data[0]
    for key in ("id", "email", "name", "role", "transaction_count", "total_income", "total_expense"):
        assert key in entry, f"missing key: {key}"


async def test_admin_users_transaction_stats(client, admin_auth_headers, auth_headers):
    await client.post("/api/v1/transactions", json=tx_payload(type="income",  amount=50000.0), headers=auth_headers)
    await client.post("/api/v1/transactions", json=tx_payload(type="expense", amount=20000.0), headers=auth_headers)

    res = await client.get("/api/v1/admin/users", headers=admin_auth_headers)
    users = res.json()
    regular = next((u for u in users if u["email"] == "testuser@example.com"), None)
    assert regular is not None
    assert regular["transaction_count"] == 2
    assert regular["total_income"] == 50000.0
    assert regular["total_expense"] == 20000.0


# ── /admin/analytics ──────────────────────────────────────────────────────────

async def test_admin_analytics_requires_admin(client, auth_headers):
    res = await client.get("/api/v1/admin/analytics", headers=auth_headers)
    assert res.status_code == 403


async def test_admin_analytics_empty(client, admin_auth_headers):
    res = await client.get("/api/v1/admin/analytics", headers=admin_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "user_count" in data
    assert "active_users" in data
    assert data["active_users"] == 0


async def test_admin_analytics_aggregates_all_users(client, admin_auth_headers, auth_headers, other_auth_headers):
    await client.post("/api/v1/transactions", json=tx_payload(type="income", amount=100000.0), headers=auth_headers)
    await client.post("/api/v1/transactions", json=tx_payload(type="income", amount=100000.0), headers=other_auth_headers)

    res = await client.get("/api/v1/admin/analytics", headers=admin_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["active_users"] == 2
    assert data["income_count"] == 2
    assert data["total_income"] > 0


async def test_admin_analytics_period_filter(client, admin_auth_headers):
    for period in ["daily", "weekly", "monthly", "quarterly", "annual"]:
        res = await client.get(f"/api/v1/admin/analytics?period={period}", headers=admin_auth_headers)
        assert res.status_code == 200, f"Failed for period={period}"
        assert res.json()["period"] == period
