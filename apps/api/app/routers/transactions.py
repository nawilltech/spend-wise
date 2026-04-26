from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse, BulkTransactionResponse
from app.services.currency_service import currency_service

router = APIRouter()

# Reusable filter: exclude soft-deleted rows
_active = Transaction.deleted_at.is_(None)


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
    filters = [Transaction.user_id == user.id, _active]
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
    response: Response,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Idempotency: return the existing transaction if the key was already used
    if body.idempotency_key:
        result = await db.execute(
            select(Transaction).where(
                Transaction.user_id == user.id,
                Transaction.idempotency_key == body.idempotency_key,
                _active,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            response.status_code = 200
            return existing

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
        idempotency_key=body.idempotency_key,
        transaction_date=body.transaction_date,
    )
    db.add(transaction)
    await db.flush()
    return transaction


@router.post("/bulk", response_model=BulkTransactionResponse, status_code=201)
async def bulk_create_transactions(
    body: list[TransactionCreate],
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not body:
        raise HTTPException(status_code=422, detail="Provide at least one transaction")
    if len(body) > 500:
        raise HTTPException(status_code=422, detail="Maximum 500 transactions per request")

    # One rate fetch covers every currency in the batch
    rates = await currency_service.get_rates(user.base_currency)

    # Resolve all idempotency keys in a single query
    keys = [item.idempotency_key for item in body if item.idempotency_key]
    existing_by_key: dict[str, Transaction] = {}
    if keys:
        result = await db.execute(
            select(Transaction).where(
                Transaction.user_id == user.id,
                Transaction.idempotency_key.in_(keys),
                _active,
            )
        )
        existing_by_key = {tx.idempotency_key: tx for tx in result.scalars().all()}

    created: list[Transaction] = []
    skipped: list[Transaction] = []

    for item in body:
        if item.idempotency_key and item.idempotency_key in existing_by_key:
            skipped.append(existing_by_key[item.idempotency_key])
            continue

        tx = Transaction(
            user_id=user.id,
            type=item.type,
            amount=item.amount,
            currency=item.currency,
            base_amount=currency_service.convert(item.amount, item.currency, user.base_currency, rates),
            base_currency=user.base_currency,
            category_id=item.category_id,
            description=item.description,
            note=item.note,
            voice_input=item.voice_input,
            idempotency_key=item.idempotency_key,
            transaction_date=item.transaction_date,
        )
        db.add(tx)
        created.append(tx)

    if created:
        await db.flush()

    return BulkTransactionResponse(
        created=created,
        skipped=skipped,
        created_count=len(created),
        skipped_count=len(skipped),
    )


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == user.id,
            _active,
        )
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
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == user.id,
            _active,
        )
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
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == user.id,
            _active,
        )
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    transaction.deleted_at = datetime.now(timezone.utc)
