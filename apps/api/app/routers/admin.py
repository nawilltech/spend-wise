from __future__ import annotations
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.dependencies import get_admin_user
from app.models.user import User
from app.models.transaction import Transaction, TransactionType
from app.schemas.analytics import AdminUserSummary, AdminUserUpdate, AdminTransactionItem, AdminAnalytics
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
                email_verified=user.email_verified,
                created_at=user.created_at,
                transaction_count=count or 0,
                total_income=float(total_income or 0),
                total_expense=float(total_expense or 0),
            )
        )
    return summaries


@router.patch("/users/{user_id}/verify-email", response_model=AdminUserSummary)
async def verify_user_email(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.email_verified = True
    await db.commit()
    await db.refresh(user)

    tx_result = await db.execute(
        select(
            func.count(Transaction.id),
            func.coalesce(func.sum(Transaction.base_amount).filter(Transaction.type == TransactionType.income), 0),
            func.coalesce(func.sum(Transaction.base_amount).filter(Transaction.type == TransactionType.expense), 0),
        ).where(Transaction.user_id == user.id, Transaction.deleted_at.is_(None))
    )
    count, total_income, total_expense = tx_result.one()
    return AdminUserSummary(
        id=user.id,
        email=user.email,
        name=user.name,
        base_currency=user.base_currency,
        location=user.location,
        risk_tolerance=user.risk_tolerance,
        role=user.role,
        email_verified=user.email_verified,
        created_at=user.created_at,
        transaction_count=count or 0,
        total_income=float(total_income or 0),
        total_expense=float(total_expense or 0),
    )


@router.patch("/users/{user_id}", response_model=AdminUserSummary)
async def update_user(
    user_id: str,
    body: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    tx_result = await db.execute(
        select(
            func.count(Transaction.id),
            func.coalesce(func.sum(Transaction.base_amount).filter(Transaction.type == TransactionType.income), 0),
            func.coalesce(func.sum(Transaction.base_amount).filter(Transaction.type == TransactionType.expense), 0),
        ).where(Transaction.user_id == user.id, Transaction.deleted_at.is_(None))
    )
    count, total_income, total_expense = tx_result.one()
    return AdminUserSummary(
        id=user.id, email=user.email, name=user.name, base_currency=user.base_currency,
        location=user.location, risk_tolerance=user.risk_tolerance, role=user.role,
        email_verified=user.email_verified, created_at=user.created_at,
        transaction_count=count or 0, total_income=float(total_income or 0),
        total_expense=float(total_expense or 0),
    )


@router.get("/transactions", response_model=list[AdminTransactionItem])
async def list_all_transactions(
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(
        select(Transaction, User.email, User.name)
        .join(User, Transaction.user_id == User.id)
        .where(Transaction.deleted_at.is_(None))
        .order_by(Transaction.transaction_date.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.all()
    return [
        AdminTransactionItem(
            id=tx.id, user_id=tx.user_id, user_email=email, user_name=name,
            type=tx.type, amount=float(tx.amount), currency=tx.currency,
            base_amount=float(tx.base_amount), base_currency=tx.base_currency,
            description=tx.description, transaction_date=tx.transaction_date,
            created_at=tx.created_at,
        )
        for tx, email, name in rows
    ]


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
