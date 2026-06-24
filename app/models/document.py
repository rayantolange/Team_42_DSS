from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


class Document(Base):
    __tablename__ = "documents"

    document_id = Column(Integer, primary_key=True, autoincrement=True)
    decision_id = Column(Integer, ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    upload_date = Column(Date, server_default=func.current_date())
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    # Relationships
    decision = relationship("Decision", back_populates="documents")
    uploader = relationship("User", back_populates="documents_uploaded", foreign_keys=[uploaded_by])
