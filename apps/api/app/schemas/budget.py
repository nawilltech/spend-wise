from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel
from app.models.budget import BudgetPeriod, BudgetType
from app.models.category import CategoryType, FrequencyType


class BudgetCreate(BaseModel):
    category_id: str
    amount: float
    currency: str
    period: BudgetPeriod = BudgetPeriod.monthly
    type: BudgetType = BudgetType.expense
    description: str | None = None


class BudgetUpdate(BaseModel):
    amount: float | None = None
    currency: str | None = None
    period: BudgetPeriod | None = None
    type: BudgetType | None = None
    description: str | None = None
    is_active: bool | None = None


class CategoryInBudget(BaseModel):
    id: str
    name: str
    type: CategoryType
    frequency: FrequencyType | None
    icon: str
    color: str

    model_config = {"from_attributes": True}


class UserInBudget(BaseModel):
    id: str
    name: str

    model_config = {"from_attributes": True}


class BudgetResponse(BaseModel):
    id: str
    user_id: str
    category_id: str
    amount: float
    currency: str
    period: BudgetPeriod
    type: BudgetType
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    user: UserInBudget
    category: CategoryInBudget

    model_config = {"from_attributes": True}
