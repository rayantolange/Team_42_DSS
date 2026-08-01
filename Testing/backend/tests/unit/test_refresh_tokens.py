"""
Tests for app/core/refresh_tokens.py. Uses the real test DB via the
shared db_session fixture since these are thin wrappers around
RefreshToken rows, including revoke/rotate/expiry boundary behavior.
"""
import datetime as dt

from app.core.refresh_tokens import (
    create_refresh_token,
    verify_refresh_token,
    revoke_refresh_token,
    rotate_refresh_token,
    _hash_token,
)
from app.models.refresh_token import RefreshToken


def _get_row(db_session, raw_token):
    return (
        db_session.query(RefreshToken)
        .filter(RefreshToken.token_hash == _hash_token(raw_token))
        .first()
    )


def test_create_and_verify_refresh_token(db_session, faculty_user):
    raw = create_refresh_token(db_session, faculty_user.user_id)
    assert verify_refresh_token(db_session, raw) == faculty_user.user_id


def test_verify_unknown_token_returns_none(db_session):
    assert verify_refresh_token(db_session, "never-issued-token") is None


def test_verify_revoked_token_returns_none(db_session, faculty_user):
    raw = create_refresh_token(db_session, faculty_user.user_id)
    revoke_refresh_token(db_session, raw)
    assert verify_refresh_token(db_session, raw) is None


def test_revoke_unknown_token_is_a_noop(db_session):
    revoke_refresh_token(db_session, "never-issued-token")  # must not raise


def test_rotate_refresh_token_invalidates_old_and_issues_new(db_session, faculty_user):
    old_raw = create_refresh_token(db_session, faculty_user.user_id)
    new_raw = rotate_refresh_token(db_session, old_raw, faculty_user.user_id)

    assert new_raw != old_raw
    assert verify_refresh_token(db_session, old_raw) is None
    assert verify_refresh_token(db_session, new_raw) == faculty_user.user_id


def test_expired_token_returns_none(db_session, faculty_user):
    raw = create_refresh_token(db_session, faculty_user.user_id)
    row = _get_row(db_session, raw)
    row.expires_at = dt.datetime.now(dt.timezone.utc) - dt.timedelta(seconds=1)
    db_session.commit()

    assert verify_refresh_token(db_session, raw) is None


def test_token_still_valid_seconds_before_expiry(db_session, faculty_user):
    """
    Boundary check: as long as expires_at is still in the future
    (even by a couple of seconds), the token verifies — the check is
    strictly "<", not "<=".
    """
    raw = create_refresh_token(db_session, faculty_user.user_id)
    row = _get_row(db_session, raw)
    row.expires_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(seconds=2)
    db_session.commit()

    assert verify_refresh_token(db_session, raw) == faculty_user.user_id


def test_token_hash_is_never_stored_in_plaintext(db_session, faculty_user):
    raw = create_refresh_token(db_session, faculty_user.user_id)
    row = _get_row(db_session, raw)
    assert row.token_hash != raw
    assert row.token_hash == _hash_token(raw)