# core/dependencies.py

from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

# from app.core.security import decode_access_token
from app.core.jwt import decode_access_token
from app.database import SessionLocal          # your DB session factory
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# -------------------------------------------------------
# DATABASE SESSION
# -------------------------------------------------------

def get_db() -> Generator:
    """
    Creates a DB session per request.
    Automatically closes it when the request is done
    even if an exception is raised — that's what finally does.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------------------------------------
# CURRENT USER
# -------------------------------------------------------

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Decodes the JWT from the Authorization header.
    Fetches and returns the corresponding User from DB.
    Raises 401 if token is missing, invalid, or expired.
    Raises 404 if user no longer exists in DB.
    Injected into any route that requires authentication.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload_dict = decode_access_token(token)

    if payload_dict is None:
        raise credentials_exception

    try:
        payload = TokenPayload(**payload_dict)
    except Exception:
        raise credentials_exception

    user = user_repo.get_by_id(payload.sub)

    if user is None:
        raise credentials_exception

    user_repo = UserRepository(db)
    user = user_repo.get_by_id(int(user))

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    return user

    # def get_current_user(
    #     token: str = Depends(oauth2_scheme),
    #     db: Session = Depends(get_db)
    # ) -> User:
    #     """
    #     Decodes the JWT from the Authorization header.
    #     Fetches and returns the corresponding User from DB.
    #     Raises 401 if token is missing, invalid, or expired.
    #     Raises 404 if user no longer exists in DB.
    #     Injected into any route that requires authentication.
    #     """
    #     credentials_exception = HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Could not validate credentials.",
    #         headers={"WWW-Authenticate": "Bearer"},
    #     )

    #     payload = decode_access_token(token)

    #     if payload is None:
    #         raise credentials_exception

    #     user_id: str = payload.get("sub")

    #     if user_id is None:
    #         raise credentials_exception

    #     user_repo = UserRepository(db)
    #     user = user_repo.get_by_id(int(user_id))

    #     if user is None:
    #         raise HTTPException(
    #             status_code=status.HTTP_404_NOT_FOUND,
    #             detail="User not found."
    #         )

    #     return user