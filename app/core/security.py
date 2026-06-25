# core/security.py

from datetime import datetime, timedelta
from typing import Optional

import jwt
from jwt.exceptions import PyJWTError
from passlib.context import CryptContext
from dotenv import load_dotenv
import os

# -------------------------------------------------------
# CONFIG
# -------------------------------------------------------
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24      # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# -------------------------------------------------------
# PASSWORD
# -------------------------------------------------------

def hash_password(plain_password: str) -> str:
    """
    Hashes a plain text password using bcrypt.
    Called during registration before saving to DB.
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against a stored bcrypt hash.
    Called during login.
    Returns True if match, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


# -------------------------------------------------------
# JWT TOKENS
# -------------------------------------------------------

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Creates a signed JWT access token.
    data should contain identifying info — typically {"sub": str(user_id)}.
    Token expires after ACCESS_TOKEN_EXPIRE_MINUTES by default.
    """
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodes and validates a JWT token.
    Returns the payload dict if valid.
    Returns None if expired or tampered.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except PyJWTError:
        return None