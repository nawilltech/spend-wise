from __future__ import annotations
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category, CategoryType

_DEFAULTS = [
    {"name": "Food & Groceries", "icon": "🍔", "color": "#F97316", "type": CategoryType.expense},
    {"name": "Transport",        "icon": "🚗", "color": "#3B82F6", "type": CategoryType.expense},
    {"name": "Airtime & Data",   "icon": "📱", "color": "#8B5CF6", "type": CategoryType.expense},
    {"name": "Rent & Housing",   "icon": "🏠", "color": "#EC4899", "type": CategoryType.expense},
    {"name": "Utilities",        "icon": "💡", "color": "#EAB308", "type": CategoryType.expense},
    {"name": "Clothing",         "icon": "👕", "color": "#06B6D4", "type": CategoryType.expense},
    {"name": "Health",           "icon": "🏥", "color": "#10B981", "type": CategoryType.expense},
    {"name": "Entertainment",    "icon": "🎉", "color": "#F43F5E", "type": CategoryType.expense},
    {"name": "Education",        "icon": "📚", "color": "#6366F1", "type": CategoryType.expense},
    {"name": "Salary",           "icon": "💼", "color": "#22C55E", "type": CategoryType.income},
    {"name": "Business Income",  "icon": "💰", "color": "#84CC16", "type": CategoryType.income},
    {"name": "Gift / Other",     "icon": "🎁", "color": "#94A3B8", "type": CategoryType.both},
]


async def seed_default_categories(db: AsyncSession, user_id: str) -> None:
    for cat in _DEFAULTS:
        db.add(Category(user_id=user_id, is_default=True, **cat))
    await db.flush()
