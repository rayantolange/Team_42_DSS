import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "DSS <onboarding@resend.dev>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def send_verification_email(to_email: str, full_name: str, token: str) -> None:
    """
    Sends the account verification link to a newly registered user.
    Failure here should not silently corrupt the registration flow —
    callers decide whether to raise or just log.
    """
    verify_link = f"{FRONTEND_URL}/verify-email?token={token}"
    resend.Emails.send({
        "from": FROM_EMAIL,
        "to": to_email,
        "subject": "Verify your DSS account",
        "html": f"""
            <p>Hi {full_name},</p>
            <p>Please confirm your email to activate your account:</p>
            <p><a href="{verify_link}">Verify Email</a></p>
            <p>This link expires in 24 hours.</p>
        """,
    })


def send_password_reset_email(to_email: str, full_name: str, token: str) -> None:
    """
    Sends a password-reset link to a user who requested one.
    Failure here should not silently corrupt the request flow —
    callers decide whether to raise or just log.
    """
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    resend.Emails.send({
        "from": FROM_EMAIL,
        "to": to_email,
        "subject": "Reset your DSS password",
        "html": f"""
            <p>Hi {full_name},</p>
            <p>We received a request to reset your password. Click below to choose a new one:</p>
            <p><a href="{reset_link}">Reset Password</a></p>
            <p>This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
        """,
    })