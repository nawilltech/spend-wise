from datetime import datetime
from pydantic import BaseModel
from app.models.transaction import TransactionType


class TransactionCreate(BaseModel):
    type: TransactionType
    amount: float
    currency: str
    category_id: str | None = None
    description: str = ""
    note: str | None = None
    voice_input: str | None = None
    transaction_date: datetime


class TransactionUpdate(BaseModel):
    amount: float | None = None
    currency: str | None = None
    category_id: str | None = None
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
    description: str
    note: str | None
    transaction_date: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
