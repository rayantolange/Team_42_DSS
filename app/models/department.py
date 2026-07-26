from sqlalchemy import Column, Integer, String, Text, Boolean
from sqlalchemy.orm import relationship

from app.models.base import Base


class Department(Base):
    __tablename__ = "departments"

    department_id = Column(Integer, primary_key=True, autoincrement=True)
    department_name = Column(String(100), nullable=False, unique=True)
    department_type = Column(String(50))
    description = Column(Text)
    is_active = Column(Boolean, nullable=False, server_default="true")

    # Relationships
    users = relationship("User", back_populates="department")
    decisions = relationship("Decision", back_populates="department")
