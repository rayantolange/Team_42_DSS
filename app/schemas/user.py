from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict, EmailStr
from app.core.validators import validate_college_email

# ALLOWED_DOMAIN = "@randomcollege.edu.np"


# def validate_college_email(value: str) -> str:
#     """Ensures only institutional emails are accepted."""
#     if not value.lower().endswith(ALLOWED_DOMAIN):
#         raise ValueError(f"Email must belong to the domain {ALLOWED_DOMAIN}")
#     return value


# -------------------------------------------------------
# LOGIN
# -------------------------------------------------------

# class UserLogin(BaseModel):
#     """
#     Payload for the login endpoint.
#     Only email and raw password are needed.
#     """

#     email: EmailStr = Field(
#         description="Institutional email address."
#     )

#     password: str = Field(
#         min_length=8,
#         description="Raw password provided by the user for authentication."
#     )

#     @field_validator("email")
#     @classmethod
#     def check_email_domain(cls, value: str) -> str:
#         return validate_college_email(value)


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

    role: str = Field(
        min_length=2,
        max_length=100,
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


# UserLogin--- POST /auth/login---- Accepts email + plain password
# UserCreate---- POST /auth/register---- Accepts all registration fields + plain password
# UserResponse----- Any endpoint returning user data------Safe outward-facing shape, no password

