from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel


class CategoryBreakdown(BaseModel):
    category_id: str | None
    category_name: str | None
    amount: float
    count: int
    percentage: float


class BudgetBreakdown(BaseModel):
    budget_id: str
    amount: float
    count: int


class DailyDataPoint(BaseModel):
    label: str        # "2024-01-15", "Mon", "Jan", etc.
    income: float
    expense: float
    net: float


class TransactionAnalytics(BaseModel):
    period: str
    start_date: datetime
    end_date: datetime
    currency: str

    total_volume: float       # total_income + total_expense
    entry_count: int
    income_count: int
    expense_count: int

    total_income: float
    highest_income: float | None
    lowest_income: float | None
    average_income: float | None

    total_expense: float
    highest_expense: float | None
    lowest_expense: float | None
    average_expense: float | None

    net_savings: float
    savings_rate: float       # percentage (0–100)

    category_breakdown: list[CategoryBreakdown]
    budget_breakdown: list[BudgetBreakdown]
    chart_data: list[DailyDataPoint]


class AdminUserSummary(BaseModel):
    id: str
    email: str
    name: str
    base_currency: str
    location: str
    risk_tolerance: str
    role: str
    created_at: datetime
    transaction_count: int
    total_income: float
    total_expense: float

    model_config = {"from_attributes": True}


class AdminAnalytics(TransactionAnalytics):
    user_count: int
    active_users: int         # users with at least one transaction in period
