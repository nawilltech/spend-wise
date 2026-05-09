from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.auth import (
    RegisterRequest, LoginRequest, AuthResponse, UserResponse,
    RefreshRequest, TokenResponse,
    ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest,
    UserUpdate,
)
from app.services.auth_service import auth_service, LoginError
from app.models.user import User

router = APIRouter()

_VERIFIED_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpendWise — Email Verified</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .card{background:#1e293b;border-radius:16px;padding:48px 40px;max-width:420px;text-align:center;box-shadow:0 25px 50px rgba(0,0,0,.3)}
    .icon{font-size:56px;margin-bottom:16px}.h1{font-size:24px;font-weight:700;margin:0 0 12px}
    p{color:#94a3b8;margin:0 0 28px;line-height:1.6}
    a{display:inline-block;background:#6366f1;color:#fff;padding:12px 32px;border-radius:10px;text-decoration:none;font-weight:600}
  </style>
</head>
<body><div class="card">
  <div class="icon">✅</div>
  <p class="h1" style="font-size:24px;font-weight:700;margin:0 0 12px">Email Verified!</p>
  <p>Your SpendWise account is now fully active.<br>You can close this tab and log back in.</p>
  <a href="javascript:window.close()">Close Tab</a>
</div></body></html>"""

_INVALID_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpendWise — Invalid Link</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .card{background:#1e293b;border-radius:16px;padding:48px 40px;max-width:420px;text-align:center;box-shadow:0 25px 50px rgba(0,0,0,.3)}
    .icon{font-size:56px;margin-bottom:16px}
    p{color:#94a3b8;margin:0 0 28px;line-height:1.6}
  </style>
</head>
<body><div class="card">
  <div class="icon">❌</div>
  <p style="font-size:24px;font-weight:700;margin:0 0 12px;color:#e2e8f0">Invalid Link</p>
  <p>This verification link has expired or already been used.<br>Please register again or contact support.</p>
</div></body></html>"""


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await auth_service.get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await auth_service.register(db, body)


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await auth_service.login(db, body.email, body.password)
    if isinstance(result, LoginError):
        if result.locked:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Account locked due to too many failed attempts. Try again in 10 minutes.",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Invalid email or password",
                "attempts": result.attempts,
                "max_attempts": result.max_attempts,
            },
        )
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


@router.patch("/me", response_model=UserResponse)
async def update_me(body: UserUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await auth_service.update_profile(db, user, body)


@router.get("/verify-email", response_class=HTMLResponse)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    ok = await auth_service.verify_email(db, token)
    if ok:
        return HTMLResponse(_VERIFIED_HTML)
    return HTMLResponse(_INVALID_HTML, status_code=400)


@router.post("/resend-verification", status_code=200)
async def resend_verification(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.email_verified:
        return {"message": "Email already verified."}
    await auth_service.resend_verification(db, user)
    return {"message": "Verification email sent."}


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    session = await auth_service.forgot_password(db, body.email)
    return ForgotPasswordResponse(
        session=session,
        message="If that email is registered, a reset code has been sent.",
    )


@router.post("/reset-password", status_code=200)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    ok = await auth_service.reset_password(db, body.session, body.otp, body.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired code.")
    return {"message": "Password updated successfully."}
