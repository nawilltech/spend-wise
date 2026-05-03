from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_verified_user
from app.models.user import User
from app.schemas.analytics import TransactionAnalytics
from app.services.analysis_service import analysis_service, VALID_PERIODS

router = APIRouter()


@router.get("/analytics", response_model=TransactionAnalytics)
async def get_analytics(
    period: str = Query("monthly", description=f"One of: {', '.join(sorted(VALID_PERIODS))}"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    if period not in VALID_PERIODS:
        raise HTTPException(status_code=422, detail=f"period must be one of: {', '.join(sorted(VALID_PERIODS))}")
    return await analysis_service.get_user_analytics(db, user.id, user.base_currency, period)


@router.get("/summary")
async def get_summary(
    period: str = Query("monthly", pattern="^(daily|weekly|monthly|quarterly|annual)$"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    return await analysis_service.get_summary(db, user.id, user.base_currency, period)


@router.get("/trends")
async def get_trends(
    months: int = Query(6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    return await analysis_service.get_trends(db, user.id, user.base_currency, months)
