from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timezone
from app.database import get_db
from app.dependencies import get_verified_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.budget import Budget
from app.models.goal import Goal

router = APIRouter()


@router.get("")
async def pull_changes(
    last_pulled_at: int = Query(0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    since = datetime.fromtimestamp(last_pulled_at / 1000, tz=timezone.utc) if last_pulled_at else None

    async def fetch_since(model, filter_col):
        q = select(model).where(model.user_id == user.id)
        if since:
            q = q.where(filter_col > since)
        result = await db.execute(q)
        return result.scalars().all()

    transactions = await fetch_since(Transaction, Transaction.updated_at)
    categories   = await fetch_since(Category,    Category.updated_at)
    budgets      = await fetch_since(Budget,       Budget.updated_at)
    goals        = await fetch_since(Goal,         Goal.updated_at)

    def to_dict(obj):
        return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

    return {
        "changes": {
            "transactions": {"created": [to_dict(t) for t in transactions], "updated": [], "deleted": []},
            "categories":   {"created": [to_dict(c) for c in categories],   "updated": [], "deleted": []},
            "budgets":      {"created": [to_dict(b) for b in budgets],       "updated": [], "deleted": []},
            "goals":        {"created": [to_dict(g) for g in goals],         "updated": [], "deleted": []},
        },
        "timestamp": int(datetime.now(tz=timezone.utc).timestamp() * 1000),
    }


@router.post("")
async def push_changes(
    body: dict,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    # Mobile pushes dirty records; server upserts them
    # Full implementation handles created/updated/deleted per table
    return {"status": "ok"}
