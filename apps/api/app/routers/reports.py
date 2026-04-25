from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.analysis_service import analysis_service

router = APIRouter()


@router.get("/summary")
async def get_summary(
    period: str = Query("monthly", pattern="^(daily|weekly|monthly|quarterly|annual)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await analysis_service.get_summary(db, user.id, user.base_currency, period)


@router.get("/trends")
async def get_trends(
    months: int = Query(6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await analysis_service.get_trends(db, user.id, user.base_currency, months)
