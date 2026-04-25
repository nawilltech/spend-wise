from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.category import Category, CategoryType

router = APIRouter()


class CategoryCreate(BaseModel):
    name: str
    icon: str = "📦"
    color: str = "#94A3B8"
    type: CategoryType = CategoryType.expense
    frequency: str | None = None


class CategoryResponse(BaseModel):
    id: str; user_id: str; name: str; icon: str; color: str
    type: CategoryType; frequency: str | None; is_default: bool
    model_config = {"from_attributes": True}


@router.get("", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Category).where(Category.user_id == user.id))
    return result.scalars().all()


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(body: CategoryCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    category = Category(user_id=user.id, **body.model_dump())
    db.add(category)
    await db.flush()
    return category


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, body: CategoryCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Category).where(Category.id == category_id, Category.user_id == user.id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(category, field, value)
    return category


@router.delete("/{category_id}", status_code=204)
async def delete_category(category_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Category).where(Category.id == category_id, Category.user_id == user.id, Category.is_default == False))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found or is a default category")
    await db.delete(category)
