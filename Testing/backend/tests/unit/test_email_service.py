"""
Tests for email_service.py — smtplib.SMTP is mocked entirely, so these
tests never make a real network connection or depend on Gmail
actually accepting the configured account (which is currently blocked
for a brand-new account, per a known unrelated issue — irrelevant
here since no real SMTP connection is ever attempted).

What's verified:
- send_verification_email / send_password_reset_email build the
  message correctly: right recipient, right subject, right link
  (including the token) embedded in the HTML body
- the SMTP session is used correctly: connects to the right host/
  port, calls starttls(), logs in with the configured credentials,
  and sends via sendmail() with the right envelope from/to
- a failure during sending (e.g. login rejected) propagates to the
  caller rather than being silently swallowed
"""
import smtplib
import pytest
from app.services import email_service


@pytest.fixture()
def mock_smtp(mocker):
    """
    smtplib.SMTP is used as `with smtplib.SMTP(...) as server:` — a
    plain MagicMock (what mocker.patch returns by default) already
    supports the context-manager protocol, so
    mock_smtp_class.return_value.__enter__.return_value is the
    'server' object the code actually calls .starttls()/.login()/
    .sendmail() on.
    """
    mock_smtp_class = mocker.patch("app.services.email_service.smtplib.SMTP")
    mock_server = mock_smtp_class.return_value.__enter__.return_value
    return mock_smtp_class, mock_server


# -------------------------------------------------------
# SMTP SESSION USAGE
# -------------------------------------------------------

def test_send_verification_email_connects_to_correct_host_and_port(mock_smtp):
    mock_smtp_class, _ = mock_smtp

    email_service.send_verification_email("student@gmail.com", "Jane Doe", "sometoken123")

    mock_smtp_class.assert_called_once_with(email_service.SMTP_HOST, email_service.SMTP_PORT)


def test_send_verification_email_starts_tls_and_logs_in(mock_smtp):
    _, mock_server = mock_smtp

    email_service.send_verification_email("student@gmail.com", "Jane Doe", "sometoken123")

    mock_server.starttls.assert_called_once()
    mock_server.login.assert_called_once_with(
        email_service.GMAIL_ADDRESS, email_service.GMAIL_APP_PASSWORD
    )


def test_send_verification_email_sends_with_correct_envelope(mock_smtp):
    _, mock_server = mock_smtp

    email_service.send_verification_email("student@gmail.com", "Jane Doe", "sometoken123")

    mock_server.sendmail.assert_called_once()
    from_addr, to_addr, message_str = mock_server.sendmail.call_args[0]
    assert from_addr == email_service.FROM_EMAIL
    assert to_addr == "student@gmail.com"


# -------------------------------------------------------
# VERIFICATION EMAIL — content
# -------------------------------------------------------

def test_verification_email_contains_correct_link_and_token(mock_smtp):
    _, mock_server = mock_smtp

    email_service.send_verification_email("student@gmail.com", "Jane Doe", "abc123token")

    _, _, message_str = mock_server.sendmail.call_args[0]
    expected_link = f"{email_service.FRONTEND_URL}/verify-email?token=abc123token"
    assert expected_link in message_str


def test_verification_email_greets_recipient_by_name(mock_smtp):
    _, mock_server = mock_smtp

    email_service.send_verification_email("student@gmail.com", "Jane Doe", "abc123token")

    _, _, message_str = mock_server.sendmail.call_args[0]
    assert "Jane Doe" in message_str


def test_verification_email_has_correct_subject(mock_smtp):
    _, mock_server = mock_smtp

    email_service.send_verification_email("student@gmail.com", "Jane Doe", "abc123token")

    _, _, message_str = mock_server.sendmail.call_args[0]
    assert "Verify your DSS account" in message_str


# -------------------------------------------------------
# PASSWORD RESET EMAIL — content
# -------------------------------------------------------

def test_password_reset_email_contains_correct_link_and_token(mock_smtp):
    _, mock_server = mock_smtp

    email_service.send_password_reset_email("student@gmail.com", "Jane Doe", "resettoken456")

    _, _, message_str = mock_server.sendmail.call_args[0]
    expected_link = f"{email_service.FRONTEND_URL}/reset-password?token=resettoken456"
    assert expected_link in message_str


def test_password_reset_email_has_correct_subject(mock_smtp):
    _, mock_server = mock_smtp

    email_service.send_password_reset_email("student@gmail.com", "Jane Doe", "resettoken456")

    _, _, message_str = mock_server.sendmail.call_args[0]
    assert "Reset your DSS password" in message_str


# -------------------------------------------------------
# FAILURE PROPAGATION
# -------------------------------------------------------

def test_smtp_failure_propagates_to_caller(mock_smtp):
    """
    If Gmail rejects the login (e.g. bad app password, or the
    account-restriction issue currently blocking a brand-new
    account), the caller must find out via an exception, not have
    it silently swallowed — callers decide whether to raise further
    or just log.
    """
    _, mock_server = mock_smtp
    mock_server.login.side_effect = smtplib.SMTPAuthenticationError(535, b"Authentication failed")

    with pytest.raises(smtplib.SMTPAuthenticationError):
        email_service.send_verification_email("student@gmail.com", "Jane Doe", "sometoken123")