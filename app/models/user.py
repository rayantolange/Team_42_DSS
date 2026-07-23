from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import Enum
from app.models.enums import UserRoleEnum
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    department_id = Column(Integer, ForeignKey("departments.department_id", ondelete="RESTRICT"), nullable=False)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    role = Column(
    Enum(
        UserRoleEnum,
        name="user_role_enum",
        create_type=False
    ),
    nullable=False,
)
    password_hash = Column(String(255), nullable=False)
    is_verified = Column(Boolean, nullable=False, server_default="false") 
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    # Relationships
    department = relationship("Department", back_populates="users")
    decisions_created = relationship("Decision", back_populates="creator", foreign_keys="Decision.created_by")
    documents_uploaded = relationship("Document", back_populates="uploader", foreign_keys="Document.uploaded_by")
