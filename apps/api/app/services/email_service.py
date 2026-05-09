from __future__ import annotations
import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

log = logging.getLogger("uvicorn")


def _send_sync(to_email: str, subject: str, body: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg.attach(MIMEText(body, "plain"))
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from, [to_email], msg.as_string())


async def _send(to_email: str, subject: str, body: str) -> None:
    if not settings.smtp_host:
        log.info(f"[DEV] Email to {to_email} | {subject}\n{body}")
        return
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _send_sync, to_email, subject, body)


async def send_otp_email(to_email: str, otp: str, name: str) -> None:
    await _send(
        to_email,
        "SpendWise — Your Password Reset Code",
        (
            f"Hi {name},\n\n"
            f"Your one-time code to reset your SpendWise password is:\n\n"
            f"    {otp}\n\n"
            f"This code expires in 15 minutes. If you didn't request a reset, "
            f"you can safely ignore this email.\n\n"
            f"— The SpendWise Team"
        ),
    )


async def send_verification_email(to_email: str, token: str, name: str) -> None:
    link = f"{settings.api_base_url}/api/v1/auth/verify-email?token={token}"
    await _send(
        to_email,
        "SpendWise — Verify Your Email",
        (
            f"Hi {name},\n\n"
            f"Welcome to SpendWise! Please verify your email address by clicking the link below:\n\n"
            f"    {link}\n\n"
            f"This link expires in 24 hours. If you didn't create an account, "
            f"you can safely ignore this email.\n\n"
            f"— The SpendWise Team"
        ),
    )
