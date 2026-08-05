"""
Unit tests for app/core/jwt.py — access token creation and decoding.
No DB or HTTP needed. Expired/malformed/tampered tokens are built
directly rather than relying on real sleeps.
"""
import base64
import datetime as dt
import json
from datetime import timedelta

import jwt as pyjwt

from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.jwt import create_access_token, decode_access_token


def _b64url(data: dict) -> str:
    raw = json.dumps(data).encode()
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def test_round_trip_valid_token():
    token = create_access_token({"sub": "42"})
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "42"
    assert "exp" in payload


def test_expired_token_returns_none():
    token = create_access_token({"sub": "42"}, expires_delta=timedelta(seconds=-5))
    assert decode_access_token(token) is None


def test_not_yet_expired_token_decodes():
    token = create_access_token({"sub": "42"}, expires_delta=timedelta(seconds=5))
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "42"


def test_malformed_token_string_returns_none():
    assert decode_access_token("this-is-not-a-jwt") is None


def test_empty_token_returns_none():
    assert decode_access_token("") is None


def test_token_signed_with_wrong_secret_returns_none():
    bad_token = pyjwt.encode(
        {"sub": "42"},
        "secret_key_for_testing_purposes_12345",
        algorithm=ALGORITHM,
    )
    assert decode_access_token(bad_token) is None


def test_tampered_payload_returns_none():
    token = create_access_token({"sub": "42", "role": "faculty"})
    header, payload_segment, signature = token.split(".")
    corrupted_char = "A" if payload_segment[-1] != "A" else "B"
    corrupted_payload = payload_segment[:-1] + corrupted_char
    tampered_token = f"{header}.{corrupted_payload}.{signature}"
    assert decode_access_token(tampered_token) is None


def test_token_with_disallowed_algorithm_returns_none():
    # Algorithm confusion: a token signed with an algorithm other than
    # the one configured must be rejected, even with the right secret.
    alt_algorithm = "HS512" if ALGORITHM != "HS512" else "HS256"
    token = pyjwt.encode({"sub": "42"}, SECRET_KEY, algorithm=alt_algorithm)
    assert decode_access_token(token) is None


def test_alg_none_attack_is_rejected():
    # Classic JWT forgery: craft a token claiming alg "none" with no
    # signature at all, hoping the verifier skips signature checking.
    header = _b64url({"alg": "none", "typ": "JWT"})
    future_exp = int(
        (dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=5)).timestamp()
    )
    payload = _b64url({"sub": "42", "exp": future_exp})
    forged_token = f"{header}.{payload}."
    assert decode_access_token(forged_token) is None


def test_default_expiry_matches_config():
    token = create_access_token({"sub": "42"})
    payload = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    now = dt.datetime.now(dt.timezone.utc)
    expected = now + dt.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    actual = dt.datetime.fromtimestamp(payload["exp"], tz=dt.timezone.utc)
    assert abs((actual - expected).total_seconds()) < 5