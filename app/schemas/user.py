from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict, EmailStr
from app.core.validators import validate_college_email
from app.models.enums import UserRoleEnum

# -------------------------------------------------------
# CREATE (Registration)
# -------------------------------------------------------

class UserCreate(BaseModel):
    """
    Payload for creating / registering a new user.
    Accepts plain password — hashing is done in the service layer.
    """

    department_id: int = Field(
        description="Foreign key referencing the associated department."
    )

    full_name: str = Field(
        min_length=2,
        max_length=150,
        description="Full legal name of the user."
    )

    email: EmailStr = Field(
        description="Institutional email address ending with @randomcollege.edu.np."
    )

    role: UserRoleEnum = Field(
        description="Role assigned to the user within the system."
    )

    password: str = Field(
        min_length=8,
        description="Plain text password — will be hashed before storage."
    )

    @field_validator("email")
    @classmethod
    def check_email_domain(cls, value: str) -> str:
        return validate_college_email(value)


# -------------------------------------------------------
# RESPONSE (What the API returns to the client)
# -------------------------------------------------------

class UserResponse(BaseModel):
    """
    Shape of user data returned by the API.
    Never exposes password_hash.
    """

    model_config = ConfigDict(from_attributes=True)

    user_id: int = Field(
        description="Primary key of the user."
    )

    department_id: int = Field(
        description="Foreign key referencing the associated department."
    )

    full_name: str = Field(
        description="Full legal name of the user."
    )

    email: EmailStr = Field(
        description="Institutional email address."
    )

    role: str = Field(
        description="Role assigned to the user within the system."
    )

    created_at: datetime = Field(
        description="Timestamp of when the user account was created."
    )

class AdminUserResponse(BaseModel):
    """
    Extended user shape for admin views — includes verification
    status alongside the standard safe fields.
    """
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    department_id: int
    full_name: str
    email: str
    role: str
    is_verified: bool
    is_active: bool
    created_at: datetime


class UpdateUserRoleRequest(BaseModel):
    """
    Payload for an admin changing another user's role.
    """
    role: UserRoleEnum

class SystemStatsResponse(BaseModel):
    """
    Aggregate user counts for the admin system-health dashboard.
    """
    total_users: int
    verified_users: int
    unverified_users: int
    active_users: int
    deactivated_users: int
    role_counts: dict[str, int]