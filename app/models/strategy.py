from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


class Strategy(Base):
    __tablename__ = "strategies"

    strategy_id = Column(Integer, primary_key=True, autoincrement=True)
    strategy_name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    # Relationships
    decision_strategies = relationship("DecisionStrategy", back_populates="strategy")


class ConstraintMaster(Base):
    __tablename__ = "constraints_master"

    constraint_id = Column(Integer, primary_key=True, autoincrement=True)
    constraint_type = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    # Relationships
    decision_constraints = relationship("DecisionConstraint", back_populates="constraint")
