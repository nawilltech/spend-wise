from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.dependencies import get_verified_user
from app.models.user import User
from app.models.budget import Budget
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse

router = APIRouter()

_with_relations = (selectinload(Budget.user), selectinload(Budget.category))


async def _get_budget(db: AsyncSession, budget_id: str, user_id: str) -> Budget:
    result = await db.execute(
        select(Budget)
        .where(Budget.id == budget_id, Budget.user_id == user_id)
        .options(*_with_relations)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget


@router.get("", response_model=list[BudgetResponse])
async def list_budgets(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    result = await db.execute(
        select(Budget)
        .where(Budget.user_id == user.id, Budget.is_active == True)
        .options(*_with_relations)
        .order_by(Budget.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=BudgetResponse, status_code=201)
async def create_budget(
    body: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    budget = Budget(user_id=user.id, **body.model_dump())
    db.add(budget)
    await db.flush()
    return await _get_budget(db, budget.id, user.id)


@router.patch("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: str,
    body: BudgetUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    budget = await _get_budget(db, budget_id, user.id)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(budget, field, value)
    await db.flush()
    return await _get_budget(db, budget.id, user.id)


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(
    budget_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_verified_user),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    await db.delete(budget)
