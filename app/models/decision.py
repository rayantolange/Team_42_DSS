from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Date, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base
from app.models.enums import DecisionStatusEnum


class Decision(Base):
    __tablename__ = "decisions"

    decision_id = Column(Integer, primary_key=True, autoincrement=True)
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    title = Column(String(255), nullable=False)
    problem_statement = Column(Text, nullable=False)
    decision_desc = Column(Text, nullable=False)
    decision_type = Column(String(100))
    status = Column(Enum(DecisionStatusEnum), nullable=False, default=DecisionStatusEnum.draft)
    decision_date = Column(Date)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    updated_at = Column(DateTime(timezone=False), server_default=func.now(), onupdate=func.now())

    # Relationships
    department = relationship("Department", back_populates="decisions")
    creator = relationship("User", back_populates="decisions_created", foreign_keys=[created_by])
    documents = relationship("Document", back_populates="decision")
    outcomes = relationship("Outcome", back_populates="decision")
    decision_strategies = relationship("DecisionStrategy", back_populates="decision")
    decision_constraints = relationship("DecisionConstraint", back_populates="decision")
