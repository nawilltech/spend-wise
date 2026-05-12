"""
Seed a single super-admin user. Runs automatically on deployment (idempotent).

    make seed-admin
    # or
    cd apps/api && python -m scripts.seed_admin
"""
from __future__ import annotations
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import bcrypt
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.config import settings
from app.models.user import User, UserRole

ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL",    "admin@spendwise.app")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123456")
ADMIN_NAME     = os.getenv("ADMIN_NAME",     "SpendWise Admin")


async def seed() -> None:
    engine = create_async_engine(settings.async_database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        existing = await db.execute(select(User).where(User.email == ADMIN_EMAIL))
        if existing.scalar_one_or_none():
            print(f"[seed] Admin already exists: {ADMIN_EMAIL} — skipping.")
            await engine.dispose()
            return

        hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
        admin = User(
            email=ADMIN_EMAIL,
            name=ADMIN_NAME,
            hashed_password=hashed,
            base_currency="USD",
            role=UserRole.admin,
            email_verified=True,
        )
        db.add(admin)
        await db.commit()
        print(f"[seed] Admin created: {ADMIN_EMAIL}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
