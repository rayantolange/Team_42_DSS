# repositories/user_repository.py

from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """
    Handles all database operations for the User model.
    Injected with a SQLAlchemy Session per request.
    """

    def __init__(self, db: Session):
        super().__init__(User, db)

    # -------------------------------------------------------
    # READ
    # -------------------------------------------------------

    # Gets the user by given uesr_id 
    def get_by_id(self, user_id: int) -> Optional[User]:
        return (
            self.db.query(User)
            .filter(User.user_id == user_id)
            .first()
        )

    # Gets the User by given email
    def get_by_email(self, email: str) -> Optional[User]:
        """
        Used during login and registration to check
        if a user with this email already exists.
        """
        return (
            self.db.query(User)
            .filter(User.email == email.lower())
            .first()
        )
    
    # Gets all the Users by department 
    def get_all_by_department(
        self,
        department_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """
        Fetch all users belonging to a specific department.
        Useful for admin views and department-level filtering.
        """
        return (
            self.db.query(User)
            .filter(User.department_id == department_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    # Gets all the user by Role
    def get_all_by_role(
        self,
        role: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """
        Fetch all users with a specific role.
        Useful for finding all admins, all staff etc.
        """
        return (
            self.db.query(User)
            .filter(User.role == role)
            .offset(skip)
            .limit(limit)
            .all()
        )

    # Checks weather the email exists or not
    def email_exists(self, email: str) -> bool:
        """
        Lightweight existence check used during registration.
        Uses .exists() subquery instead of fetching the full row.
        """
        from sqlalchemy import exists

        return self.db.query(
            exists().where(User.email == email.lower())
        ).scalar()
    
    # Marks a user's email as verified
    def mark_verified(self, user: User) -> User:
        """
        Sets is_verified = True after a successful token check.
        """
        user.is_verified = True
        return self.save(user)

    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------

    # Creates a new user
    def create(
        self,
        department_id: int,
        full_name: str,
        email: str,
        role: str,
        password_hash: str,
    ) -> User:
        """
        Creates and persists a new user.
        Password must already be hashed before calling this.
        """
        new_user = User(
            department_id=department_id,
            full_name=full_name,
            email=email.lower(),
            role=role,
            password_hash=password_hash,
        )
        return self.save(new_user)

    # -------------------------------------------------------
    # UPDATE
    # -------------------------------------------------------

    # Updates User password but hashing is required before doing this
    def update_password(self, user: User, new_password_hash: str) -> User:
        """
        Updates password hash for a user.
        New hash must already be generated before calling this.
        """
        user.password_hash = new_password_hash
        return self.save(user)

    # Updates User roles
    def update_role(self, user: User, new_role: str) -> User:
        """
        Updates the role of a user.
        Called by admin-level operations only.
        """
        user.role = new_role
        return self.save(user)

    # Updates User Details
    def update_details(
        self,
        user: User,
        full_name: Optional[str] = None,
        department_id: Optional[int] = None,
    ) -> User:
        """
        Updates mutable profile fields.
        Only updates fields that are explicitly provided.
        """
        if full_name is not None:
            user.full_name = full_name
        if department_id is not None:
            user.department_id = department_id

        return self.save(user)

    def deactivate_user(self, user: User) -> User:
        """
        Soft-deletes a user: revokes access and anonymizes their
        identifying info, while preserving the row so their past
        decisions/documents remain intact and correctly attributed.
        """
        user.is_active = False
        user.full_name = f"Deleted User #{user.user_id}"
        user.email = f"deleted-user-{user.user_id}@deactivated.local"
        return self.save(user)

    # -------------------------------------------------------
    # DELETE
    # -------------------------------------------------------
    #????
    def delete_by_id(self, user: User) -> None:
        """
        Deletes a user record.
        FK constraint on department is RESTRICT —
        the service layer must handle department checks first.
        """
        self.delete(user)