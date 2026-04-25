from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.routers import auth, transactions, categories, budgets, goals, ai, currency, sync, reports


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
    allow_origins=settings.get_cors_origins(),
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


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
