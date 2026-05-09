from __future__ import annotations
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import bcrypt
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.services.auth_service import auth_service

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session
        await session.commit()


app.dependency_overrides[get_db] = override_get_db


# ── DB lifecycle ──────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(autouse=True)
async def clean_db(setup_db):
    """Wipe all rows after each test so tests don't bleed into each other."""
    yield
    async with TestSessionLocal() as session:
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(table.delete())
        await session.commit()


# ── HTTP client ───────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


# ── Currency service mock (avoids Redis + HTTP calls in every test) ───────────

@pytest.fixture(autouse=True)
def mock_currency():
    fake_rates = {"NGN": 1.0, "USD": 1550.0, "GBP": 1950.0, "EUR": 1680.0, "CAD": 1140.0}

    with patch(
        "app.routers.transactions.currency_service.get_rates",
        new_callable=AsyncMock,
        return_value=fake_rates,
    ):
        with patch(
            "app.routers.transactions.currency_service.convert",
            new_callable=MagicMock,
            side_effect=lambda amount, from_c, to_c, rates: round(
                amount * rates.get(from_c, 1.0) / rates.get(to_c, 1.0), 2
            ),
        ):
            yield


# ── Auth helpers ──────────────────────────────────────────────────────────────

SAMPLE_USER = {
    "email": "testuser@example.com",
    "password": "testpassword123",
    "name": "Test User",
    "base_currency": "NGN",
}

SAMPLE_USER_2 = {
    "email": "other@example.com",
    "password": "otherpassword123",
    "name": "Other User",
    "base_currency": "USD",
}


@pytest_asyncio.fixture
async def registered_user(client):
    """Register SAMPLE_USER and return the full auth response JSON."""
    res = await client.post("/api/v1/auth/register", json=SAMPLE_USER)
    assert res.status_code == 201, res.text
    return res.json()


@pytest_asyncio.fixture
async def auth_headers(registered_user):
    """Authorization headers for SAMPLE_USER."""
    token = registered_user["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def other_auth_headers(client):
    """Authorization headers for a second, separate user."""
    res = await client.post("/api/v1/auth/register", json=SAMPLE_USER_2)
    assert res.status_code == 201, res.text
    token = res.json()["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


ADMIN_USER = {
    "email": "admin@spendwise.app",
    "password": "Admin@123456",
    "name": "Admin",
}


@pytest_asyncio.fixture
async def admin_auth_headers(client):
    """Create an admin user directly in the DB and return its auth headers."""
    async with TestSessionLocal() as session:
        hashed = bcrypt.hashpw(ADMIN_USER["password"].encode(), bcrypt.gensalt()).decode()
        admin = User(
            email=ADMIN_USER["email"],
            name=ADMIN_USER["name"],
            hashed_password=hashed,
            base_currency="USD",
            role=UserRole.admin,
        )
        session.add(admin)
        await session.commit()

    res = await client.post(
        "/api/v1/auth/login",
        json={"email": ADMIN_USER["email"], "password": ADMIN_USER["password"]},
    )
    assert res.status_code == 200, res.text
    token = res.json()["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ── Payload factories ─────────────────────────────────────────────────────────

def tx_payload(**overrides) -> dict:
    return {
        "type": "expense",
        "amount": 5000.0,
        "currency": "NGN",
        "description": "Test expense",
        "transaction_date": datetime.now(timezone.utc).isoformat(),
        **overrides,
    }


def category_payload(**overrides) -> dict:
    return {
        "name": "Food",
        "icon": "🍔",
        "color": "#FF5733",
        "type": "expense",
        **overrides,
    }


def budget_payload(category_id: str, **overrides) -> dict:
    return {
        "category_id": category_id,
        "amount": 50000.0,
        "currency": "NGN",
        "period": "monthly",
        **overrides,
    }


def goal_payload(**overrides) -> dict:
    return {
        "name": "Emergency Fund",
        "target_amount": 500000.0,
        "currency": "NGN",
        "type": "emergency",
        **overrides,
    }
