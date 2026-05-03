from __future__ import annotations
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from app.models.transaction import TransactionType


class TransactionCreate(BaseModel):
    type: TransactionType
    amount: float
    currency: str
    category_id: str | None = None
    budget_id: str | None = None
    description: str = ""
    note: str | None = None
    voice_input: str | None = None
    idempotency_key: str | None = None
    transaction_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TransactionUpdate(BaseModel):
    amount: float | None = None
    currency: str | None = None
    category_id: str | None = None
    budget_id: str | None = None
    description: str | None = None
    note: str | None = None
    transaction_date: datetime | None = None


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    type: TransactionType
    amount: float
    currency: str
    base_amount: float
    base_currency: str
    category_id: str | None
    budget_id: str | None
    description: str
    note: str | None
    idempotency_key: str | None
    transaction_date: datetime
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BulkTransactionResponse(BaseModel):
    created: list[TransactionResponse]
    skipped: list[TransactionResponse]   # returned as-is due to matching idempotency key
    created_count: int
    skipped_count: int
