import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", GMAIL_ADDRESS)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def _send_email(to_email: str, subject: str, html_body: str) -> None:
    """
    Sends a single HTML email via Gmail SMTP using an App Password.
    Failure here should not silently corrupt the calling flow —
    callers decide whether to raise or just log (this re-raises so
    that decision stays with them, matching the previous Resend
    behavior of raising on API failure).
    """
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = FROM_EMAIL
    message["To"] = to_email
    message.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.sendmail(FROM_EMAIL, to_email, message.as_string())


def send_verification_email(to_email: str, full_name: str, token: str) -> None:
    """
    Sends the account verification link to a newly registered user.
    """
    verify_link = f"{FRONTEND_URL}/verify-email?token={token}"
    _send_email(
        to_email=to_email,
        subject="Verify your DSS account",
        html_body=f"""
            <p>Hi {full_name},</p>
            <p>Please confirm your email to activate your account:</p>
            <p><a href="{verify_link}">Verify Email</a></p>
            <p>This link expires in 24 hours.</p>
        """,
    )


def send_password_reset_email(to_email: str, full_name: str, token: str) -> None:
    """
    Sends a password-reset link to a user who requested one.
    """
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    _send_email(
        to_email=to_email,
        subject="Reset your DSS password",
        html_body=f"""
            <p>Hi {full_name},</p>
            <p>We received a request to reset your password. Click below to choose a new one:</p>
            <p><a href="{reset_link}">Reset Password</a></p>
            <p>This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
        """,
    )