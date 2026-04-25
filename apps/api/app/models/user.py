import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class RiskTolerance(str, enum.Enum):
    low    = "low"
    medium = "medium"
    high   = "high"


class User(Base):
    __tablename__ = "users"

    id:             Mapped[str]          = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email:          Mapped[str]          = mapped_column(String(255), unique=True, index=True, nullable=False)
    name:           Mapped[str]          = mapped_column(String(255), nullable=False)
    hashed_password:Mapped[str]          = mapped_column(String, nullable=False)
    base_currency:  Mapped[str]          = mapped_column(String(3), default="NGN")
    location:       Mapped[str]          = mapped_column(String(255), default="")
    risk_tolerance: Mapped[RiskTolerance]= mapped_column(SAEnum(RiskTolerance), default=RiskTolerance.medium)
    created_at:     Mapped[datetime]     = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:     Mapped[datetime]     = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    categories   = relationship("Category",    back_populates="user", cascade="all, delete-orphan")
    budgets      = relationship("Budget",      back_populates="user", cascade="all, delete-orphan")
    goals        = relationship("Goal",        back_populates="user", cascade="all, delete-orphan")
