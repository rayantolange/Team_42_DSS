# services/user_service.py

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserLogin


class UserService:
    """
    Handles all business logic for user operations.
    Orchestrates between security utilities and the user repository.
    """

    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    # -------------------------------------------------------
    # REGISTER
    # -------------------------------------------------------

    def register_user(self, data: UserCreate) -> User:
        """
        Full registration flow:
        1. Check email is not already taken
        2. Hash the plain password
        3. Persist the new user
        4. Return the created user ORM object
        """

        # Step 1 — duplicate email check
        if self.user_repo.email_exists(data.email):
            raise ValueError("A user with this email already exists.")

        # Step 2 — hash password
        # data.password is the plain text from UserCreate
        # it never touches the DB directly
        password_hash = hash_password(data.password)

        # Step 3 — persist
        new_user = self.user_repo.create(
            department_id=data.department_id,
            full_name=data.full_name,
            email=data.email,
            role=data.role,
            password_hash=password_hash,
        )

        return new_user

    # -------------------------------------------------------
    # LOGIN
    # -------------------------------------------------------

    def login_user(self, data: UserLogin) -> dict:
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