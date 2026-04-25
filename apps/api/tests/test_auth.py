import pytest


@pytest.mark.asyncio
async def test_register(client):
    response = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "securepassword123",
        "name": "Test User",
        "base_currency": "NGN",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == "test@example.com"
    assert "access_token" in data["tokens"]


@pytest.mark.asyncio
async def test_login(client):
    await client.post("/api/v1/auth/register", json={
        "email": "login@example.com",
        "password": "pass1234",
        "name": "Login User",
    })
    response = await client.post("/api/v1/auth/login", json={
        "email": "login@example.com",
        "password": "pass1234",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()["tokens"]


@pytest.mark.asyncio
async def test_me(client):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "me@example.com",
        "password": "pass1234",
        "name": "Me User",
    })
    token = reg.json()["tokens"]["access_token"]
    response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"
