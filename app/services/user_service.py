from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate


class UserService:
    """
    Handles all business logic for user operations.
    Orchestrates between security utilities and the user repository.
    """
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def create_user(
        self,
        data: UserCreate,
        password_hash: str,
    ) -> User:
        """
        Creates a new user in the database.
        Responsibilities:
        - Check duplicate email
        - Persist user
        Password hashing is handled by AuthService.
        """
        if self.user_repo.email_exists(data.email):
            raise ValueError("A user with this email already exists.")

        return self.user_repo.create(
            department_id=data.department_id,
            full_name=data.full_name,
            email=data.email,
            role=data.role,
            password_hash=password_hash,
        )