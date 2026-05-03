from pydantic import BaseModel, EmailStr, model_validator
from datetime import datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    base_currency: str = "NGN"
    location: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    base_currency: str
    location: str
    risk_tolerance: str
    role: str
    email_verified: bool
    last_login: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    session: str
    message: str


class ResetPasswordRequest(BaseModel):
    session: str
    otp: str
    new_password: str
    confirm_new_password: str

    @model_validator(mode='after')
    def passwords_must_match(self) -> 'ResetPasswordRequest':
        if self.new_password != self.confirm_new_password:
            raise ValueError('new_password and confirm_new_password do not match')
        return self
