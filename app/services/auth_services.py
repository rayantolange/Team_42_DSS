from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest
from app.schemas.user import UserCreate
from app.services.user_service import UserService
from app.models.user import User
from app.services.email_service import send_verification_email 
from app.core.security import (
    hash_password, verify_password, create_access_token,
    create_email_verification_token, decode_email_verification_token,
)

class AuthService:
    """
    Handles authentication-related operations.

    Responsibilities:
    - Register
    - Login
    - Email Verification
    - Password Reset (later)
    - Refresh Token (later)
    """

    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def login(self, data: LoginRequest) -> dict:
            """
            Full login flow:
            1. Check user exists by email
            2. Verify the plain password against the stored hash
            3. Create and return a JWT access token
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
    
            # Step 3 — create JWT
            # "sub" (subject) is a standard JWT claim
            # we store user_id as a string inside it
            access_token = create_access_token(
                data={"sub": str(user.user_id)}
            )
    
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_id": user.user_id,
                "full_name": user.full_name,
                "role": user.role,
            }
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
