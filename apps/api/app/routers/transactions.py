from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from app.services.currency_service import currency_service

router = APIRouter()


@router.get("", response_model=list[TransactionResponse])
async def list_transactions(
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    type: str | None = None,
    category_id: str | None = None,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    filters = [Transaction.user_id == user.id]
    if type:         filters.append(Transaction.type == type)
    if category_id:  filters.append(Transaction.category_id == category_id)
    if from_date:    filters.append(Transaction.transaction_date >= from_date)
    if to_date:      filters.append(Transaction.transaction_date <= to_date)

    result = await db.execute(
        select(Transaction)
        .where(and_(*filters))
        .order_by(Transaction.transaction_date.desc())
        .limit(limit).offset(offset)
    )
    return result.scalars().all()


@router.post("", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    body: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rates = await currency_service.get_rates(user.base_currency)
    base_amount = currency_service.convert(body.amount, body.currency, user.base_currency, rates)

    transaction = Transaction(
        user_id=user.id,
        type=body.type,
        amount=body.amount,
        currency=body.currency,
        base_amount=base_amount,
        base_currency=user.base_currency,
        category_id=body.category_id,
        description=body.description,
        note=body.note,
        voice_input=body.voice_input,
        transaction_date=body.transaction_date,
    )
    db.add(transaction)
    await db.flush()
    return transaction


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id)
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    body: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id)
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(transaction, field, value)
    return transaction


@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id)
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    await db.delete(transaction)
