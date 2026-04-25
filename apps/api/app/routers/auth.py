from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserResponse, RefreshRequest, TokenResponse
from app.services.auth_service import auth_service
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await auth_service.get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await auth_service.register(db, body)


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await auth_service.login(db, body.email, body.password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return result


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    tokens = await auth_service.refresh_tokens(db, body.refresh_token)
    if not tokens:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return tokens


@router.post("/logout", status_code=204)
async def logout(user: User = Depends(get_current_user)):
    pass  # JWT is stateless; client drops the token


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user
