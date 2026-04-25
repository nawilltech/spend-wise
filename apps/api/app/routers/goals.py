from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.goal import Goal, GoalType

router = APIRouter()


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    currency: str
    type: GoalType = GoalType.savings
    deadline: datetime | None = None


class GoalProgressUpdate(BaseModel):
    current_amount: float


class GoalResponse(BaseModel):
    id: str; user_id: str; name: str; target_amount: float
    current_amount: float; currency: str; deadline: datetime | None
    type: GoalType; is_completed: bool
    model_config = {"from_attributes": True}


@router.get("", response_model=list[GoalResponse])
async def list_goals(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Goal).where(Goal.user_id == user.id))
    return result.scalars().all()


@router.post("", response_model=GoalResponse, status_code=201)
async def create_goal(body: GoalCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    goal = Goal(user_id=user.id, **body.model_dump())
    db.add(goal)
    await db.flush()
    return goal


@router.patch("/{goal_id}/progress", response_model=GoalResponse)
async def update_goal_progress(goal_id: str, body: GoalProgressUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.current_amount = body.current_amount
    goal.is_completed = goal.current_amount >= goal.target_amount
    return goal


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(goal_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await db.delete(goal)
