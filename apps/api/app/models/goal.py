import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Numeric, Boolean, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class GoalType(str, enum.Enum):
    savings    = "savings"
    debt       = "debt"
    emergency  = "emergency"
    investment = "investment"
    custom     = "custom"


class Goal(Base):
    __tablename__ = "goals"

    id:             Mapped[str]      = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id:        Mapped[str]      = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name:           Mapped[str]      = mapped_column(String(255), nullable=False)
    target_amount:  Mapped[float]    = mapped_column(Numeric(14, 2), nullable=False)
    current_amount: Mapped[float]    = mapped_column(Numeric(14, 2), default=0)
    currency:       Mapped[str]      = mapped_column(String(3), nullable=False)
    deadline:       Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    type:           Mapped[GoalType] = mapped_column(SAEnum(GoalType), default=GoalType.savings)
    is_completed:   Mapped[bool]     = mapped_column(Boolean, default=False)
    created_at:     Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:     Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="goals")
