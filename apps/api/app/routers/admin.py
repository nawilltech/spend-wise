from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.dependencies import get_admin_user
from app.models.user import User
from app.models.transaction import Transaction, TransactionType
from app.schemas.analytics import AdminUserSummary, AdminAnalytics
from app.services.analysis_service import analysis_service, VALID_PERIODS

router = APIRouter()


@router.get("/users", response_model=list[AdminUserSummary])
async def list_all_users(
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()).limit(limit).offset(offset))
    users = result.scalars().all()

    summaries = []
    for user in users:
        tx_result = await db.execute(
            select(
                func.count(Transaction.id),
                func.coalesce(func.sum(Transaction.base_amount).filter(Transaction.type == TransactionType.income), 0),
                func.coalesce(func.sum(Transaction.base_amount).filter(Transaction.type == TransactionType.expense), 0),
            ).where(Transaction.user_id == user.id, Transaction.deleted_at.is_(None))
        )
        count, total_income, total_expense = tx_result.one()
        summaries.append(
            AdminUserSummary(
                id=user.id,
                email=user.email,
                name=user.name,
                base_currency=user.base_currency,
                location=user.location,
                risk_tolerance=user.risk_tolerance,
                role=user.role,
                created_at=user.created_at,
                transaction_count=count or 0,
                total_income=float(total_income or 0),
                total_expense=float(total_expense or 0),
            )
        )
    return summaries


@router.get("/analytics", response_model=AdminAnalytics)
async def get_platform_analytics(
    period: str = Query("monthly", description=f"One of: {', '.join(sorted(VALID_PERIODS))}"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    from fastapi import HTTPException
    if period not in VALID_PERIODS:
        raise HTTPException(status_code=422, detail=f"period must be one of: {', '.join(sorted(VALID_PERIODS))}")
    return await analysis_service.get_admin_analytics(db, period)
