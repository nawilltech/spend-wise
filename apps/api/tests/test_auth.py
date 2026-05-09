from tests.conftest import SAMPLE_USER


async def test_register_success(client):
    res = await client.post("/api/v1/auth/register", json=SAMPLE_USER)
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["email"] == SAMPLE_USER["email"]
    assert data["user"]["name"] == SAMPLE_USER["name"]
    assert data["user"]["base_currency"] == "NGN"
    assert "access_token" in data["tokens"]
    assert "refresh_token" in data["tokens"]
    assert "hashed_password" not in data["user"]


async def test_register_duplicate_email(client):
    await client.post("/api/v1/auth/register", json=SAMPLE_USER)
    res = await client.post("/api/v1/auth/register", json=SAMPLE_USER)
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"].lower()


async def test_register_invalid_email(client):
    res = await client.post("/api/v1/auth/register", json={**SAMPLE_USER, "email": "not-an-email"})
    assert res.status_code == 422


async def test_register_missing_fields(client):
    res = await client.post("/api/v1/auth/register", json={"email": "x@x.com"})
    assert res.status_code == 422


async def test_login_success(client):
    await client.post("/api/v1/auth/register", json=SAMPLE_USER)
    res = await client.post("/api/v1/auth/login", json={
        "email": SAMPLE_USER["email"],
        "password": SAMPLE_USER["password"],
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data["tokens"]
    assert data["user"]["email"] == SAMPLE_USER["email"]


async def test_login_wrong_password(client):
    await client.post("/api/v1/auth/register", json=SAMPLE_USER)
    res = await client.post("/api/v1/auth/login", json={
        "email": SAMPLE_USER["email"],
        "password": "wrongpassword",
    })
    assert res.status_code == 401


async def test_login_unknown_email(client):
    res = await client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com",
        "password": "anything",
    })
    assert res.status_code == 401


async def test_me_returns_current_user(client, auth_headers, registered_user):
    res = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == registered_user["user"]["email"]


async def test_me_no_token(client):
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401


async def test_me_invalid_token(client):
    res = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer bogus.token.here"})
    assert res.status_code == 401


async def test_refresh_token(client, registered_user):
    refresh_token = registered_user["tokens"]["refresh_token"]
    res = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert res.status_code == 200
    assert "access_token" in res.json()


async def test_refresh_invalid_token(client):
    res = await client.post("/api/v1/auth/refresh", json={"refresh_token": "not.a.token"})
    assert res.status_code == 401


async def test_logout(client, auth_headers):
    res = await client.post("/api/v1/auth/logout", headers=auth_headers)
    assert res.status_code == 204
