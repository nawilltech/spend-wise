from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.budget import Budget, BudgetPeriod

router = APIRouter()


class BudgetCreate(BaseModel):
    category_id: str
    amount: float
    currency: str
    period: BudgetPeriod = BudgetPeriod.monthly


class BudgetResponse(BaseModel):
    id: str; user_id: str; category_id: str; amount: float
    currency: str; period: BudgetPeriod; is_active: bool
    model_config = {"from_attributes": True}


@router.get("", response_model=list[BudgetResponse])
async def list_budgets(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Budget).where(Budget.user_id == user.id, Budget.is_active == True))
    return result.scalars().all()


@router.post("", response_model=BudgetResponse, status_code=201)
async def create_budget(body: BudgetCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    budget = Budget(user_id=user.id, **body.model_dump())
    db.add(budget)
    await db.flush()
    return budget


@router.patch("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: str, body: BudgetCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Budget).where(Budget.id == budget_id, Budget.user_id == user.id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(budget, field, value)
    return budget


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(budget_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Budget).where(Budget.id == budget_id, Budget.user_id == user.id))
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    await db.delete(budget)
