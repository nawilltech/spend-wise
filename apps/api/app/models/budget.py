import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Numeric, Boolean, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class BudgetPeriod(str, enum.Enum):
    daily     = "daily"
    weekly    = "weekly"
    monthly   = "monthly"
    quarterly = "quarterly"
    annual    = "annual"


class Budget(Base):
    __tablename__ = "budgets"

    id:          Mapped[str]          = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id:     Mapped[str]          = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[str]          = mapped_column(ForeignKey("categories.id"), index=True)
    amount:      Mapped[float]        = mapped_column(Numeric(14, 2), nullable=False)
    currency:    Mapped[str]          = mapped_column(String(3), nullable=False)
    period:      Mapped[BudgetPeriod] = mapped_column(SAEnum(BudgetPeriod), default=BudgetPeriod.monthly)
    is_active:   Mapped[bool]         = mapped_column(Boolean, default=True)
    created_at:  Mapped[datetime]     = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:  Mapped[datetime]     = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user     = relationship("User",     back_populates="budgets")
    category = relationship("Category", back_populates="budgets")
