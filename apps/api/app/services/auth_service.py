from __future__ import annotations
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.user import User
from app.schemas.auth import RegisterRequest, AuthResponse, UserResponse, TokenResponse

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


class AuthService:
    def _hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def _verify_password(self, plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)

    def _create_token(self, data: dict, expires_delta: timedelta) -> str:
        payload = {**data, "exp": datetime.now(tz=timezone.utc) + expires_delta}
        return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)

    def _make_tokens(self, user_id: str) -> TokenResponse:
        return TokenResponse(
            access_token=self._create_token(
                {"sub": user_id, "type": "access"},
                timedelta(minutes=settings.access_token_expire_minutes),
            ),
            refresh_token=self._create_token(
                {"sub": user_id, "type": "refresh"},
                timedelta(days=settings.refresh_token_expire_days),
            ),
        )

    async def get_user_by_email(self, db: AsyncSession, email: str) -> User | None:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, db: AsyncSession, user_id: str) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def register(self, db: AsyncSession, data: RegisterRequest) -> AuthResponse:
        user = User(
            email=data.email,
            name=data.name,
            hashed_password=self._hash_password(data.password),
            base_currency=data.base_currency,
            location=data.location,
        )
        db.add(user)
        await db.flush()
        tokens = self._make_tokens(user.id)
        return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)

    async def login(self, db: AsyncSession, email: str, password: str) -> AuthResponse | None:
        user = await self.get_user_by_email(db, email)
        if not user or not self._verify_password(password, user.hashed_password):
            return None
        tokens = self._make_tokens(user.id)
        return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)

    async def get_user_from_token(self, db: AsyncSession, token: str) -> User | None:
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if not user_id:
                return None
        except JWTError:
            return None
        return await self.get_user_by_id(db, user_id)

    async def refresh_tokens(self, db: AsyncSession, refresh_token: str) -> TokenResponse | None:
        try:
            payload = jwt.decode(refresh_token, settings.secret_key, algorithms=[ALGORITHM])
            if payload.get("type") != "refresh":
                return None
            user_id = payload.get("sub")
        except JWTError:
            return None
        user = await self.get_user_by_id(db, user_id)
        if not user:
            return None
        return self._make_tokens(user.id)


auth_service = AuthService()
