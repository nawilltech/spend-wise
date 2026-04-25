from __future__ import annotations
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.transaction import Transaction, TransactionType
from app.models.category import Category


class AnalysisService:
    async def get_monthly_summary(self, db: AsyncSession, user_id: str, base_currency: str) -> dict:
        now = datetime.now(tz=timezone.utc)
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        result = await db.execute(
            select(Transaction)
            .where(Transaction.user_id == user_id, Transaction.transaction_date >= start)
        )
        transactions = result.scalars().all()

        total_income  = sum(t.base_amount for t in transactions if t.type == TransactionType.income)
        total_expense = sum(t.base_amount for t in transactions if t.type == TransactionType.expense)
        savings_rate  = ((total_income - total_expense) / total_income * 100) if total_income > 0 else 0

        by_category: dict[str, float] = {}
        for t in transactions:
            if t.type == TransactionType.expense:
                by_category[t.category_id or "uncategorised"] = \
                    by_category.get(t.category_id or "uncategorised", 0) + t.base_amount

        return {
            "period": "monthly",
            "start_date": start.isoformat(),
            "total_income": total_income,
            "total_expense": total_expense,
            "net_savings": total_income - total_expense,
            "savings_rate": round(savings_rate, 1),
            "currency": base_currency,
            "by_category": [{"category_id": k, "amount": v} for k, v in by_category.items()],
        }

    async def get_summary(self, db: AsyncSession, user_id: str, base_currency: str, period: str) -> dict:
        return await self.get_monthly_summary(db, user_id, base_currency)

    async def get_trends(self, db: AsyncSession, user_id: str, base_currency: str, months: int) -> list[dict]:
        trends = []
        now = datetime.now(tz=timezone.utc)
        for i in range(months):
            month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            month_end   = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)

            result = await db.execute(
                select(Transaction).where(
                    Transaction.user_id == user_id,
                    Transaction.transaction_date >= month_start,
                    Transaction.transaction_date <= month_end,
                )
            )
            transactions = result.scalars().all()
            income  = sum(t.base_amount for t in transactions if t.type == TransactionType.income)
            expense = sum(t.base_amount for t in transactions if t.type == TransactionType.expense)

            trends.append({
                "month": month_start.strftime("%Y-%m"),
                "income": income,
                "expense": expense,
                "savings": income - expense,
            })

        return list(reversed(trends))


analysis_service = AnalysisService()
