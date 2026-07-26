from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest
from app.schemas.user import UserCreate
from app.services.user_service import UserService
from app.models.user import User
from app.services.email_service import send_verification_email 
from app.core.password import hash_password, verify_password
from app.core.jwt import create_access_token, decode_access_token
from app.core.email_tokens import create_email_verification_token, decode_email_verification_token
from app.services.email_service import send_verification_email, send_password_reset_email
from app.core.refresh_tokens import (
    create_refresh_token,
    verify_refresh_token,
    rotate_refresh_token,
    revoke_refresh_token,
)
from app.core.email_tokens import (
    create_email_verification_token,
    decode_email_verification_token,
    create_password_reset_token,
    decode_password_reset_token,
)


class AuthService:
    """
    Handles authentication-related operations.
    Responsibilities:
    - Register
    - Login
    - Email Verification
    - Password Reset (later)
    - Refresh Token
    """
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def login(self, data: LoginRequest) -> dict:
        """
        Full login flow:
        1. Check user exists by email
        2. Verify the plain password against the stored hash
        3. Reject deactivated accounts
        4. Create and return a JWT access token + refresh token
        """
        # Step 1 — find user
        user = self.user_repo.get_by_email(data.email)
        if not user:
            # deliberately vague — don't reveal whether
            # email exists or password is wrong
            raise ValueError("Invalid email or password.")
        # Step 2 — verify password
        password_valid = verify_password(data.password, user.password_hash)
        if not password_valid:
            raise ValueError("Invalid email or password.")
        # Step 3 — reject deactivated accounts
        if not user.is_active:
            raise ValueError("This account has been deactivated.")

        # Step 3 — create JWT + refresh token
        access_token = create_access_token(
            data={"sub": str(user.user_id)}
        )
        refresh_token = create_refresh_token(self.db, user.user_id)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.user_id,
            "full_name": user.full_name,
            "role": user.role,
            "refresh_token": refresh_token,
        }

    def refresh(self, raw_refresh_token: str) -> dict:
        """
        Validates the refresh token, rotates it, and issues a new access token.
        """
        user_id = verify_refresh_token(self.db, raw_refresh_token)
        if user_id is None:
            raise ValueError("Invalid or expired refresh token.")

        user = self.user_repo.get_by_id(user_id)
        if user is None:
            raise ValueError("User not found.")

        new_access_token = create_access_token(data={"sub": str(user.user_id)})
        new_refresh_token = rotate_refresh_token(self.db, raw_refresh_token, user.user_id)

        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "user_id": user.user_id,
            "full_name": user.full_name,
            "role": user.role,
            "refresh_token": new_refresh_token,
        }

    def logout(self, raw_refresh_token: str) -> None:
        """
        Revokes the refresh token so it can no longer be used.
        """
        revoke_refresh_token(self.db, raw_refresh_token)

    def register(self, data: UserCreate) -> User:
        """
        Handles the complete registration workflow.
        Responsibilities:
        - Hash password
        - Create user
        - Generate verification token
        - Send verification email
        """
        # Hash password
        password_hash = hash_password(data.password)
        # Create user
        new_user = UserService(self.db).create_user(
            data=data,
            password_hash=password_hash,
        )
        # Generate verification token
        token = create_email_verification_token(
            new_user.user_id
        )
        # Send verification email
        send_verification_email(
            new_user.email,
            new_user.full_name,
            token,
        )
        return new_user

    def verify_email(self, token: str) -> User:
        """
        Validates the verification token and marks the user as verified.
        """
        user_id = decode_email_verification_token(token)
        if user_id is None:
            raise ValueError("Invalid or expired verification link.")
        user = self.user_repo.get_by_id(user_id)
        if user is None:
            raise ValueError("User not found.")
        if user.is_verified:
            return user  # idempotent — already verified, no error
        return self.user_repo.mark_verified(user)

    def resend_verification(self, email: str) -> None:
        """
        Re-sends a verification email. Always succeeds silently if the
        email doesn't exist or is already verified, to avoid leaking
        which emails are registered.
        """
        user = self.user_repo.get_by_email(email)
        if user and not user.is_verified:
            token = create_email_verification_token(user.user_id)
            send_verification_email(user.email, user.full_name, token)

    def request_password_reset(self, email: str) -> None:
        """
        Sends a password-reset email if the account exists. Always
        succeeds silently regardless of outcome, to avoid leaking
        which emails are registered.
        """
        user = self.user_repo.get_by_email(email)
        if user:
            token = create_password_reset_token(user.user_id)
            send_password_reset_email(user.email, user.full_name, token)

    def reset_password(self, token: str, new_password: str) -> User:
        """
        Validates the reset token and updates the user's password.
        """
        user_id = decode_password_reset_token(token)
        if user_id is None:
            raise ValueError("Invalid or expired reset link.")

        user = self.user_repo.get_by_id(user_id)
        if user is None:
            raise ValueError("User not found.")

        new_password_hash = hash_password(new_password)
        return self.user_repo.update_password(user, new_password_hash)