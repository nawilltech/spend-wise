from __future__ import annotations
from datetime import datetime, timezone, timedelta
from collections import defaultdict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.transaction import Transaction, TransactionType
from app.models.category import Category
from app.schemas.analytics import (
    TransactionAnalytics,
    AdminAnalytics,
    CategoryBreakdown,
    DailyDataPoint,
)

VALID_PERIODS = {"daily", "weekly", "monthly", "quarterly", "annual"}


def _period_range(period: str) -> tuple[datetime, datetime]:
    now = datetime.now(tz=timezone.utc)
    if period == "daily":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "weekly":
        start = (now - timedelta(days=now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
    elif period == "monthly":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "quarterly":
        q_month = ((now.month - 1) // 3) * 3 + 1
        start = now.replace(month=q_month, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "annual":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        raise ValueError(f"Invalid period '{period}'. Use: {', '.join(VALID_PERIODS)}")
    return start, now


def _chart_label(dt: datetime, period: str) -> str:
    if period == "daily":
        return dt.strftime("%H:00")
    elif period == "weekly":
        return dt.strftime("%a")          # Mon, Tue …
    elif period == "monthly":
        return dt.strftime("%d")          # 01 … 31
    elif period == "quarterly":
        # ISO week number
        return f"W{dt.strftime('%W')}"
    else:                                 # annual
        return dt.strftime("%b")          # Jan … Dec


def _bucket_key(dt: datetime, period: str) -> str:
    if period == "daily":
        return dt.strftime("%Y-%m-%dT%H")
    elif period == "weekly":
        return dt.strftime("%Y-%m-%d")
    elif period == "monthly":
        return dt.strftime("%Y-%m-%d")
    elif period == "quarterly":
        return dt.strftime("%Y-W%W")
    else:
        return dt.strftime("%Y-%m")


def _build_chart_data(
    transactions: list[Transaction], period: str, start: datetime, end: datetime
) -> list[DailyDataPoint]:
    buckets: dict[str, dict] = defaultdict(lambda: {"income": 0.0, "expense": 0.0, "label": ""})

    for t in transactions:
        dt = t.transaction_date
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        key = _bucket_key(dt, period)
        buckets[key]["label"] = _chart_label(dt, period)
        if t.type == TransactionType.income:
            buckets[key]["income"] += float(t.base_amount)
        else:
            buckets[key]["expense"] += float(t.base_amount)

    return [
        DailyDataPoint(
            label=v["label"] or k,
            income=round(v["income"], 2),
            expense=round(v["expense"], 2),
            net=round(v["income"] - v["expense"], 2),
        )
        for k, v in sorted(buckets.items())
    ]


async def _fetch_categories(db: AsyncSession, ids: set[str]) -> dict[str, str]:
    if not ids:
        return {}
    result = await db.execute(select(Category).where(Category.id.in_(ids)))
    return {c.id: c.name for c in result.scalars().all()}


def _compute_analytics(
    transactions: list[Transaction],
    period: str,
    start: datetime,
    end: datetime,
    currency: str,
    category_names: dict[str, str],
) -> dict:
    incomes  = [t for t in transactions if t.type == TransactionType.income]
    expenses = [t for t in transactions if t.type == TransactionType.expense]

    total_income  = sum(float(t.base_amount) for t in incomes)
    total_expense = sum(float(t.base_amount) for t in expenses)
    savings_rate  = ((total_income - total_expense) / total_income * 100) if total_income > 0 else 0.0

    # Category breakdown (expenses only)
    cat_totals: dict[str | None, dict] = defaultdict(lambda: {"amount": 0.0, "count": 0})
    for t in expenses:
        key = t.category_id
        cat_totals[key]["amount"] += float(t.base_amount)
        cat_totals[key]["count"]  += 1

    breakdown = [
        CategoryBreakdown(
            category_id=k,
            category_name=category_names.get(k) if k else None,
            amount=round(v["amount"], 2),
            count=v["count"],
            percentage=round(v["amount"] / total_expense * 100, 1) if total_expense > 0 else 0.0,
        )
        for k, v in sorted(cat_totals.items(), key=lambda x: x[1]["amount"], reverse=True)
    ]

    chart_data = _build_chart_data(transactions, period, start, end)

    return dict(
        period=period,
        start_date=start,
        end_date=end,
        currency=currency,
        total_volume=round(total_income + total_expense, 2),
        entry_count=len(transactions),
        income_count=len(incomes),
        expense_count=len(expenses),
        total_income=round(total_income, 2),
        highest_income=round(max((float(t.base_amount) for t in incomes), default=0), 2) or None,
        lowest_income=round(min((float(t.base_amount) for t in incomes), default=0), 2) or None,
        average_income=round(total_income / len(incomes), 2) if incomes else None,
        total_expense=round(total_expense, 2),
        highest_expense=round(max((float(t.base_amount) for t in expenses), default=0), 2) or None,
        lowest_expense=round(min((float(t.base_amount) for t in expenses), default=0), 2) or None,
        average_expense=round(total_expense / len(expenses), 2) if expenses else None,
        net_savings=round(total_income - total_expense, 2),
        savings_rate=round(savings_rate, 1),
        category_breakdown=breakdown,
        chart_data=chart_data,
    )


class AnalysisService:
    async def get_user_analytics(
        self,
        db: AsyncSession,
        user_id: str,
        base_currency: str,
        period: str = "monthly",
    ) -> TransactionAnalytics:
        start, end = _period_range(period)

        result = await db.execute(
            select(Transaction).where(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= start,
                Transaction.transaction_date <= end,
                Transaction.deleted_at.is_(None),
            )
        )
        transactions = result.scalars().all()

        cat_ids = {t.category_id for t in transactions if t.category_id}
        category_names = await _fetch_categories(db, cat_ids)

        data = _compute_analytics(transactions, period, start, end, base_currency, category_names)
        return TransactionAnalytics(**data)

    async def get_admin_analytics(
        self,
        db: AsyncSession,
        period: str = "monthly",
    ) -> AdminAnalytics:
        start, end = _period_range(period)

        result = await db.execute(
            select(Transaction).where(
                Transaction.transaction_date >= start,
                Transaction.transaction_date <= end,
                Transaction.deleted_at.is_(None),
            )
        )
        transactions = result.scalars().all()

        from app.models.user import User
        user_count_result = await db.execute(select(User))
        user_count = len(user_count_result.scalars().all())

        active_users = len({t.user_id for t in transactions})

        cat_ids = {t.category_id for t in transactions if t.category_id}
        category_names = await _fetch_categories(db, cat_ids)

        data = _compute_analytics(transactions, period, start, end, "USD", category_names)
        return AdminAnalytics(**data, user_count=user_count, active_users=active_users)

    # Legacy helpers kept for existing callers (reports router, etc.)
    async def get_monthly_summary(self, db: AsyncSession, user_id: str, base_currency: str) -> dict:
        analytics = await self.get_user_analytics(db, user_id, base_currency, "monthly")
        return {
            "period": "monthly",
            "start_date": analytics.start_date.isoformat(),
            "total_income": analytics.total_income,
            "total_expense": analytics.total_expense,
            "net_savings": analytics.net_savings,
            "savings_rate": analytics.savings_rate,
            "currency": analytics.currency,
            "by_category": [
                {"category_id": c.category_id, "amount": c.amount}
                for c in analytics.category_breakdown
            ],
        }

    async def get_summary(self, db: AsyncSession, user_id: str, base_currency: str, period: str) -> dict:
        return await self.get_monthly_summary(db, user_id, base_currency)

    async def get_trends(self, db: AsyncSession, user_id: str, base_currency: str, months: int) -> list[dict]:
        trends = []
        now = datetime.now(tz=timezone.utc)
        for i in range(months):
            month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)

            result = await db.execute(
                select(Transaction).where(
                    Transaction.user_id == user_id,
                    Transaction.transaction_date >= month_start,
                    Transaction.transaction_date <= month_end,
                    Transaction.deleted_at.is_(None),
                )
            )
            txs = result.scalars().all()
            income  = sum(float(t.base_amount) for t in txs if t.type == TransactionType.income)
            expense = sum(float(t.base_amount) for t in txs if t.type == TransactionType.expense)
            trends.append({
                "month": month_start.strftime("%Y-%m"),
                "income": income,
                "expense": expense,
                "savings": income - expense,
            })

        return list(reversed(trends))


analysis_service = AnalysisService()
