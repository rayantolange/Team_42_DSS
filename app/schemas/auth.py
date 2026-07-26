from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from app.core.validators import validate_college_email


class LoginRequest(BaseModel):
    email: EmailStr = Field(
        description="Institutional email."
    )

    password: str = Field(
        min_length=8
    )

    @field_validator("email")
    @classmethod
    def check_email_domain(cls, value: str):
        return validate_college_email(value)

class Token(BaseModel):
    """
    JWT returned after successful login.
    """

    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    role: str


class TokenPayload(BaseModel):
    """
    Contents stored inside the JWT.
    """

    sub: int
    exp: datetime

class ForgotPasswordRequest(BaseModel):
    """
    Payload for requesting a password reset email.
    """
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """
    Payload for actually resetting the password using a valid token.
    """
    token: str
    new_password: str = Field(min_length=8)