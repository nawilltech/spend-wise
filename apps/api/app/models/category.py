from __future__ import annotations
import uuid
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class CategoryType(str, enum.Enum):
    income  = "income"
    expense = "expense"
    both    = "both"


class FrequencyType(str, enum.Enum):
    daily     = "daily"
    weekly    = "weekly"
    monthly   = "monthly"
    quarterly = "quarterly"
    annual    = "annual"


class Category(Base):
    __tablename__ = "categories"

    id:         Mapped[str]               = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id:    Mapped[str]               = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name:       Mapped[str]               = mapped_column(String(100), nullable=False)
    icon:       Mapped[str]               = mapped_column(String(10), default="📦")
    color:      Mapped[str]               = mapped_column(String(7), default="#94A3B8")
    type:       Mapped[CategoryType]      = mapped_column(SAEnum(CategoryType), default=CategoryType.expense)
    frequency:  Mapped[Optional[FrequencyType]] = mapped_column(SAEnum(FrequencyType), nullable=True)
    is_default: Mapped[bool]              = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime]          = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime]          = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user         = relationship("User",        back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    budgets      = relationship("Budget",      back_populates="category")
