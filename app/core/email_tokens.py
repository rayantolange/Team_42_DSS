from datetime import datetime, timedelta

import jwt
from jwt.exceptions import PyJWTError

from app.core.config import (
    SECRET_KEY,
    ALGORITHM,
    EMAIL_VERIFICATION_EXPIRE_MINUTES,
)


def create_email_verification_token(
    user_id: int,
) -> str:
    """
    Generate an email verification JWT.
    """
    payload = {
        "sub": str(user_id),
        "scope": "email_verification",
        "exp": datetime.utcnow()
        + timedelta(
            minutes=EMAIL_VERIFICATION_EXPIRE_MINUTES
        ),
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_email_verification_token(
    token: str,
):
    """
    Decode an email verification token.
    """
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        if payload.get("scope") != "email_verification":
            return None

        return int(payload["sub"])

    except PyJWTError:
        return None