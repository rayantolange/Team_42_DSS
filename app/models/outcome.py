from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, Date, Enum, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base
from app.models.enums import OutcomeStatusEnum


class Outcome(Base):
    __tablename__ = "outcomes"

    outcome_id = Column(Integer, primary_key=True, autoincrement=True)
    decision_id = Column(Integer, ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=False)
    outcome_status = Column(Enum(OutcomeStatusEnum), nullable=False)
    outcome_desc = Column(Text)
    success_score = Column(Numeric(5, 2))
    evaluation_date = Column(Date)
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    # Relationships
    decision = relationship("Decision", back_populates="outcomes")
