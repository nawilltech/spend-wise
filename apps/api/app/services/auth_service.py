from __future__ import annotations
import secrets
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
import bcrypt
import redis.asyncio as aioredis
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.user import User
from app.schemas.auth import RegisterRequest, AuthResponse, UserResponse, TokenResponse, UserUpdate
from app.services.email_service import send_otp_email, send_verification_email
from app.services.category_seeder import seed_default_categories

ALGORITHM = "HS256"
OTP_TTL = 900           # 15 minutes — password reset OTP
VERIFY_TTL = 86_400     # 24 hours  — email verification token
LOGIN_LOCK_WINDOW = 600  # 10 minutes
LOGIN_MAX_ATTEMPTS = 5


@dataclass
class LoginError:
    locked: bool = False
    attempts: int = 0
    max_attempts: int = field(default=LOGIN_MAX_ATTEMPTS)


class AuthService:
    def __init__(self):
        self._redis: aioredis.Redis | None = None

    async def _get_redis(self) -> aioredis.Redis:
        if not self._redis:
            self._redis = aioredis.from_url(settings.redis_url, decode_responses=True)
        return self._redis

    # ── password helpers ──────────────────────────────────────────────────────

    def _hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def _verify_password(self, plain: str, hashed: str) -> bool:
        return bcrypt.checkpw(plain.encode(), hashed.encode())

    # ── JWT helpers ───────────────────────────────────────────────────────────

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

    # ── DB helpers ────────────────────────────────────────────────────────────

    async def get_user_by_email(self, db: AsyncSession, email: str) -> User | None:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, db: AsyncSession, user_id: str) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    # ── login lockout (Redis only) ────────────────────────────────────────────

    async def is_account_locked(self, email: str) -> bool:
        redis = await self._get_redis()
        return bool(await redis.exists(f"account_locked:{email}"))

    async def record_failed_login(self, email: str) -> int:
        redis = await self._get_redis()
        attempts_key = f"login_attempts:{email}"
        count = await redis.incr(attempts_key)
        await redis.expire(attempts_key, LOGIN_LOCK_WINDOW)  # sliding window
        if count >= LOGIN_MAX_ATTEMPTS:
            await redis.setex(f"account_locked:{email}", LOGIN_LOCK_WINDOW, "1")
        return count

    async def clear_login_attempts(self, email: str) -> None:
        redis = await self._get_redis()
        await redis.delete(f"login_attempts:{email}", f"account_locked:{email}")

    # ── auth flows ────────────────────────────────────────────────────────────

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
        await seed_default_categories(db, user.id)

        token = secrets.token_urlsafe(32)
        redis = await self._get_redis()
        await redis.setex(f"email_verify:{token}", VERIFY_TTL, user.id)
        await send_verification_email(user.email, token, user.name)

        tokens = self._make_tokens(user.id)
        return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)

    async def login(self, db: AsyncSession, email: str, password: str) -> AuthResponse | LoginError:
        if await self.is_account_locked(email):
            return LoginError(locked=True)

        user = await self.get_user_by_email(db, email)
        if not user or not self._verify_password(password, user.hashed_password):
            attempts = await self.record_failed_login(email)
            return LoginError(attempts=attempts)

        await self.clear_login_attempts(email)
        user.last_login = datetime.now(tz=timezone.utc)
        await db.flush()
        tokens = self._make_tokens(user.id)
        return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)

    async def verify_email(self, db: AsyncSession, token: str) -> bool:
        redis = await self._get_redis()
        user_id = await redis.get(f"email_verify:{token}")
        if not user_id:
            return False

        user = await self.get_user_by_id(db, user_id)
        if not user:
            return False

        await redis.delete(f"email_verify:{token}")
        user.email_verified = True
        await db.flush()
        return True

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

    async def resend_verification(self, db: AsyncSession, user: User) -> None:
        token = secrets.token_urlsafe(32)
        redis = await self._get_redis()
        await redis.setex(f"email_verify:{token}", VERIFY_TTL, user.id)
        await send_verification_email(user.email, token, user.name)

    async def forgot_password(self, db: AsyncSession, email: str) -> str:
        """Generate a session token (the Redis key) and a 6-digit OTP (the Redis value).
        Session token is always returned — fake entry for unknown emails prevents enumeration."""
        session = secrets.token_urlsafe(32)
        user = await self.get_user_by_email(db, email)
        if not user:
            return session  # no Redis entry written → reset silently fails

        otp = f"{secrets.randbelow(1_000_000):06d}"
        redis = await self._get_redis()
        # Key = session token; value = user_id|otp — session IS the lookup key, not a value field
        await redis.setex(f"pwd_reset:{session}", OTP_TTL, f"{user.id}|{otp}")
        await send_otp_email(user.email, otp, user.name)
        return session

    async def reset_password(
        self, db: AsyncSession, session: str, otp: str, new_password: str
    ) -> bool:
        """Look up the session in Redis, verify OTP, update password. Single-use — key deleted on success."""
        redis = await self._get_redis()
        stored = await redis.get(f"pwd_reset:{session}")
        if not stored:
            return False

        user_id, stored_otp = stored.split("|", 1)
        if stored_otp != otp:
            return False

        user = await self.get_user_by_id(db, user_id)
        if not user:
            return False

        await redis.delete(f"pwd_reset:{session}")
        now = datetime.now(tz=timezone.utc)
        user.hashed_password = self._hash_password(new_password)
        user.updated_at = now
        await db.flush()
        return True

    async def update_profile(self, db: AsyncSession, user: User, data: UserUpdate) -> UserResponse:
        if data.name is not None:
            user.name = data.name
        if data.base_currency is not None:
            user.base_currency = data.base_currency
        if data.location is not None:
            user.location = data.location
        if data.risk_tolerance is not None:
            user.risk_tolerance = data.risk_tolerance
        user.updated_at = datetime.now(tz=timezone.utc)
        await db.flush()
        return UserResponse.model_validate(user)


auth_service = AuthService()
