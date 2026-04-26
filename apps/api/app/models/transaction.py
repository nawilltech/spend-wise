from __future__ import annotations
import uuid
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Numeric, ForeignKey, DateTime, Enum as SAEnum, Text, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class TransactionType(str, enum.Enum):
    income  = "income"
    expense = "expense"


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        Index("ix_transactions_user_date", "user_id", "transaction_date"),
        Index("ix_transactions_user_category", "user_id", "category_id"),
        # NULL idempotency_key values are excluded from this constraint (PostgreSQL treats NULL != NULL)
        UniqueConstraint("user_id", "idempotency_key", name="uq_transactions_user_idempotency"),
    )

    id:               Mapped[str]             = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id:          Mapped[str]             = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type:             Mapped[TransactionType] = mapped_column(SAEnum(TransactionType), nullable=False)
    amount:           Mapped[float]           = mapped_column(Numeric(14, 2), nullable=False)
    currency:         Mapped[str]             = mapped_column(String(3), nullable=False)
    base_amount:      Mapped[float]           = mapped_column(Numeric(14, 2), nullable=False)
    base_currency:    Mapped[str]             = mapped_column(String(3), nullable=False)
    category_id:      Mapped[str]             = mapped_column(ForeignKey("categories.id"), nullable=True)
    description:      Mapped[str]             = mapped_column(String(500), default="")
    note:             Mapped[Optional[str]]   = mapped_column(Text, nullable=True)
    voice_input:      Mapped[Optional[str]]   = mapped_column(Text, nullable=True)
    idempotency_key:  Mapped[Optional[str]]   = mapped_column(String(64), nullable=True)
    transaction_date: Mapped[datetime]        = mapped_column(DateTime(timezone=True), nullable=False)
    deleted_at:       Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at:       Mapped[datetime]        = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:       Mapped[datetime]        = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user     = relationship("User",     back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
