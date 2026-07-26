from pydantic import BaseModel, ConfigDict, Field


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    department_id: int = Field(description="Primary key of the department.")
    department_name: str = Field(description="Name of the department.")
    department_type: str | None = Field(default=None, description="Category of department.")
    description: str | None = Field(default=None, description="Description of the department.")
    is_active: bool = Field(description="Whether this department is currently active.")

class DepartmentCreateRequest(BaseModel):
    """
    Payload for creating a new department.
    """
    department_name: str = Field(min_length=2, max_length=100)
    department_type: str | None = None
    description: str | None = None


class DepartmentUpdateRequest(BaseModel):
    """
    Payload for editing an existing department. All fields optional —
    only provided fields are updated.
    """
    department_name: str | None = Field(default=None, min_length=2, max_length=100)
    department_type: str | None = None
    description: str | None = None
