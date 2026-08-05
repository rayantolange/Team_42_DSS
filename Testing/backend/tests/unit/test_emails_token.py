"""
Unit tests for app/core/email_tokens.py — email verification and
password reset tokens, including scope isolation and expiry.
"""
import datetime as dt

import jwt as pyjwt

from app.core.config import SECRET_KEY, ALGORITHM
from app.core.email_tokens import (
    create_email_verification_token,
    decode_email_verification_token,
    create_password_reset_token,
    decode_password_reset_token,
)


def test_email_verification_round_trip():
    token = create_email_verification_token(7)
    assert decode_email_verification_token(token) == 7


def test_password_reset_round_trip():
    token = create_password_reset_token(9)
    assert decode_password_reset_token(token) == 9


def test_email_verification_token_rejected_by_password_reset_decoder():
    # A verification token must not double as a password-reset token.
    token = create_email_verification_token(7)
    assert decode_password_reset_token(token) is None


def test_password_reset_token_rejected_by_email_verification_decoder():
    # A reset token must not double as a verification token.
    token = create_password_reset_token(9)
    assert decode_email_verification_token(token) is None


def test_expired_email_verification_token_returns_none():
    past = dt.datetime.now(dt.timezone.utc) - dt.timedelta(minutes=1)
    token = pyjwt.encode(
        {"sub": "7", "scope": "email_verification", "exp": past},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    assert decode_email_verification_token(token) is None


def test_expired_password_reset_token_returns_none():
    past = dt.datetime.now(dt.timezone.utc) - dt.timedelta(minutes=1)
    token = pyjwt.encode(
        {"sub": "9", "scope": "password_reset", "exp": past},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    assert decode_password_reset_token(token) is None


def test_malformed_email_verification_token_returns_none():
    assert decode_email_verification_token("garbage") is None


def test_malformed_password_reset_token_returns_none():
    assert decode_password_reset_token("garbage") is None


def test_email_verification_token_wrong_secret_returns_none():
    future = dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=5)
    token = pyjwt.encode(
        {"sub": "7", "scope": "email_verification", "exp": future},
        "secret_key_for_testing_purposes_12345",
        algorithm=ALGORITHM,
    )
    assert decode_email_verification_token(token) is None


def test_email_verification_token_missing_scope_returns_none():
    future = dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=5)
    token = pyjwt.encode(
        {"sub": "7", "exp": future},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    assert decode_email_verification_token(token) is None


def test_email_verification_token_missing_sub_raises():
    """
    Documents CURRENT behavior rather than desired behavior: the
    decoder only catches PyJWTError, so a validly-signed token that's
    simply missing "sub" raises an unhandled KeyError instead of
    returning None like every other invalid-token case does.
    """
    future = dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=5)
    token = pyjwt.encode(
        {"scope": "email_verification", "exp": future},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    try:
        decode_email_verification_token(token)
        assert False, "expected KeyError due to missing 'sub' claim"
    except KeyError:
        pass


def test_password_reset_token_missing_sub_raises():
    future = dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=5)
    token = pyjwt.encode(
        {"scope": "password_reset", "exp": future},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    try:
        decode_password_reset_token(token)
        assert False, "expected KeyError due to missing 'sub' claim"
    except KeyError:
        pass