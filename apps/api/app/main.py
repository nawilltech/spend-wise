from __future__ import annotations
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
import redis.asyncio as aioredis

from app.config import settings
from app.database import engine, Base
from app.routers import auth, transactions, categories, budgets, goals, ai, currency, sync, reports, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        import logging
        logging.getLogger("uvicorn").warning(f"DB unavailable at startup (run docker-up first): {e}")
    yield


app = FastAPI(
    title="SpendWise API",
    version="0.1.0",
    description="Personal finance advisor — track, analyse, and grow.",
    docs_url="/docs" if not settings.is_production else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"

app.include_router(auth.router,         prefix=f"{PREFIX}/auth",         tags=["auth"])
app.include_router(transactions.router, prefix=f"{PREFIX}/transactions",  tags=["transactions"])
app.include_router(categories.router,   prefix=f"{PREFIX}/categories",    tags=["categories"])
app.include_router(budgets.router,      prefix=f"{PREFIX}/budgets",       tags=["budgets"])
app.include_router(goals.router,        prefix=f"{PREFIX}/goals",         tags=["goals"])
app.include_router(ai.router,           prefix=f"{PREFIX}/ai",            tags=["ai"])
app.include_router(currency.router,     prefix=f"{PREFIX}/currency",      tags=["currency"])
app.include_router(sync.router,         prefix=f"{PREFIX}/sync",          tags=["sync"])
app.include_router(reports.router,      prefix=f"{PREFIX}/reports",       tags=["reports"])
app.include_router(admin.router,        prefix=f"{PREFIX}/admin",          tags=["admin"])


@app.get("/health")
async def health():
    checks: dict[str, dict] = {}

    # Database
    t = time.monotonic()
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = {"status": "ok", "latency_ms": round((time.monotonic() - t) * 1000, 2)}
    except Exception as e:
        checks["database"] = {"status": "error", "detail": str(e)}

    # Redis
    t = time.monotonic()
    try:
        r = aioredis.from_url(settings.redis_url, decode_responses=True)
        await r.ping()
        await r.aclose()
        checks["redis"] = {"status": "ok", "latency_ms": round((time.monotonic() - t) * 1000, 2)}
    except Exception as e:
        checks["redis"] = {"status": "error", "detail": str(e)}

    overall = "ok" if all(c["status"] == "ok" for c in checks.values()) else "degraded"
    return {"status": overall, "version": "0.1.0", "checks": checks}
