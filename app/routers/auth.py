# routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Form
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
# from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest, Token, ForgotPasswordRequest, ResetPasswordRequest
from app.services.user_service import UserService
from app.services.auth_services import AuthService
from pydantic import ValidationError

router = APIRouter(prefix="/auth", tags=["Authentication"])

REFRESH_COOKIE_NAME = "refresh_token"

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
    service = AuthService(db)
    try:
        new_user = service.register(data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    return new_user


# -------------------------------------------------------
# LOGIN
# -------------------------------------------------------
@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK
)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    remember_me: bool = Form(default=False),
    db: Session = Depends(get_db)
):
    service = AuthService(db)
    try:
        login_data = LoginRequest(
            email=form_data.username,
            password=form_data.password
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    try:
        result = service.login(login_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    refresh_token = result.pop("refresh_token")
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=False,   # set True once you're serving over HTTPS
        samesite="lax",
        max_age=60 * 60 * 24 * 30 if remember_me else None,
        path="/auth",
    )
    return result


# -------------------------------------------------------
# REFRESH
# -------------------------------------------------------
@router.post("/refresh", status_code=status.HTTP_200_OK, response_model=Token)
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: Session = Depends(get_db),
):
    if refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token."
        )

    service = AuthService(db)
    try:
        result = service.refresh(refresh_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

    new_refresh_token = result.pop("refresh_token")
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
        path="/auth",
    )
    return result


# -------------------------------------------------------
# LOGOUT
# -------------------------------------------------------
@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: Session = Depends(get_db),
):
    if refresh_token:
        AuthService(db).logout(refresh_token)
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/auth")
    return {"message": "Logged out."}


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
    service = AuthService(db)
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
    service = AuthService(db)
    service.resend_verification(email)
    return {"message": "If that account exists and isn't verified, a new link has been sent."}


# -------------------------------------------------------
# PASSWORD RESET
# -------------------------------------------------------

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Sends a password-reset link if the account exists.
    Always returns the same message regardless of outcome.
    """
    service = AuthService(db)
    service.request_password_reset(data.email)
    return {"message": "If that account exists, a password reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Resets the user's password using a valid reset token.
    """
    service = AuthService(db)
    try:
        service.reset_password(data.token, data.new_password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    return {"message": "Password reset successfully. You can now log in."}