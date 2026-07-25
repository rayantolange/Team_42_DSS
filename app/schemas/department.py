from pydantic import BaseModel, ConfigDict, Field


class DepartmentResponse(BaseModel):
    """
    Shape of department data returned by the API.
    """
    model_config = ConfigDict(from_attributes=True)

    department_id: int = Field(
        description="Primary key of the department."
    )
    department_name: str = Field(
        description="Name of the department."
    )
    department_type: str | None = Field(
        default=None,
        description="Category of department (e.g. Academic, Administrative)."
    )
    description: str | None = Field(
        default=None,
        description="Description of the department's responsibilities."
    )