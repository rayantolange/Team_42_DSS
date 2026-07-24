import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.config import REFRESH_TOKEN_EXPIRE_DAYS
from app.models.refresh_token import RefreshToken


def _hash_token(raw_token: str) -> str:
    """We store only the hash — never the raw token — so a DB leak doesn't leak usable tokens."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


def create_refresh_token(db: Session, user_id: int) -> str:
    raw_token = secrets.token_urlsafe(64)
    token_hash = _hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    db_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(db_token)
    db.commit()
    return raw_token  # only the raw version goes to the client, never stored


def verify_refresh_token(db: Session, raw_token: str) -> int | None:
    """Returns user_id if valid, else None."""
    token_hash = _hash_token(raw_token)
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked == False,
    ).first()

    if not db_token:
        return None
    if db_token.expires_at < datetime.now(timezone.utc):
        return None
    return db_token.user_id


def revoke_refresh_token(db: Session, raw_token: str) -> None:
    token_hash = _hash_token(raw_token)
    db_token = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if db_token:
        db_token.revoked = True
        db.commit()


def rotate_refresh_token(db: Session, old_raw_token: str, user_id: int) -> str:
    """Revoke the old token and issue a new one — prevents reuse if a token is stolen."""
    revoke_refresh_token(db, old_raw_token)
    return create_refresh_token(db, user_id)