from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base


class DecisionStrategy(Base):
    __tablename__ = "decision_strategies"

    decision_id = Column(Integer, ForeignKey("decisions.decision_id", ondelete="CASCADE"), primary_key=True)
    strategy_id = Column(Integer, ForeignKey("strategies.strategy_id", ondelete="CASCADE"), primary_key=True)

    # Relationships
    decision = relationship("Decision", back_populates="decision_strategies")
    strategy = relationship("Strategy", back_populates="decision_strategies")


class DecisionConstraint(Base):
    __tablename__ = "decision_constraints"

    decision_id = Column(Integer, ForeignKey("decisions.decision_id", ondelete="CASCADE"), primary_key=True)
    constraint_id = Column(Integer, ForeignKey("constraints_master.constraint_id", ondelete="CASCADE"), primary_key=True)

    # Relationships
    decision = relationship("Decision", back_populates="decision_constraints")
    constraint = relationship("ConstraintMaster", back_populates="decision_constraints")
