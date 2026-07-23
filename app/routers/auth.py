# routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
# from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService
from app.schemas.auth import LoginRequest, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])


# -------------------------------------------------------
# REGISTER
# -------------------------------------------------------

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register(
    data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Creates a new user account.
    Returns the created user — without password hash.
    """
    service = UserService(db)

    try:
        new_user = service.register_user(data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    return new_user


# -------------------------------------------------------
# LOGIN
# -------------------------------------------------------

# @router.post(
#     "/login",
#     status_code=status.HTTP_200_OK
# )
# def login(
#     data: LoginRequest,
#     db: Session = Depends(get_db)
# ):
#     """
#     Authenticates a user and returns a JWT access token.
#     Use the token in the Authorization header as: Bearer <token>
#     """
#     service = UserService(db)

#     try:
#         token_data = service.login_user(data)
#     except ValueError as e:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail=str(e)
#         )

#     return token_data

@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    service = UserService(db)

    login_data = LoginRequest(
        email=form_data.username,
        password=form_data.password
    )

    try:
        return service.login_user(login_data)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
# -------------------------------------------------------
# ME (get current logged-in user)
# -------------------------------------------------------

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Returns the currently authenticated user's profile.
    Requires a valid JWT in the Authorization header.
    No DB call needed — get_current_user already fetched the user.
    """
    return current_user

# -------------------------------------------------------
# EMAIL VERIFICATION
# -------------------------------------------------------

@router.get("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Called when the user clicks the verification link in their email.
    """
    service = UserService(db)
    try:
        service.verify_email(token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return {"message": "Email verified successfully. You can now log in."}


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
def resend_verification(email: str, db: Session = Depends(get_db)):
    """
    Resends a verification link if the account exists and isn't verified yet.
    Always returns the same message regardless of outcome.
    """
    service = UserService(db)
    service.resend_verification(email)
    return {"message": "If that account exists and isn't verified, a new link has been sent."}