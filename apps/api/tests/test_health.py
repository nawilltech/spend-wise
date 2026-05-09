async def test_health(client):
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


async def test_docs_available(client):
    res = await client.get("/docs")
    assert res.status_code == 200


async def test_openapi_schema(client):
    res = await client.get("/openapi.json")
    assert res.status_code == 200
    schema = res.json()
    assert schema["info"]["title"] == "SpendWise API"
    # verify all major route groups are present
    paths = schema["paths"]
    assert any("/auth" in p for p in paths)
    assert any("/transactions" in p for p in paths)
    assert any("/categories" in p for p in paths)
    assert any("/budgets" in p for p in paths)
    assert any("/goals" in p for p in paths)
