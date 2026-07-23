from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict, EmailStr
ALLOWED_DOMAIN = "@randomcollege.edu.np"


def validate_college_email(value: str) -> str:
    """Ensures only institutional emails are accepted."""
    if not value.lower().endswith(ALLOWED_DOMAIN):
        raise ValueError(f"Email must belong to the domain {ALLOWED_DOMAIN}")
    return value