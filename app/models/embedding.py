# app/models/embedding.py

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from app.models.base import Base
from app.models.enums import SourceTypeEnum


class Embedding(Base):
    """
    Stores vector embeddings for text drawn from multiple source tables.

    Each row represents ONE embeddable chunk:
      - Short structured fields (Decision.problem_statement,
        Decision.decision_desc, Outcome.outcome_desc,
        Strategy.description, ConstraintMaster.description) are embedded
        whole — one row per field, chunk_index stays NULL.
      - Document content is chunked before embedding — one row per
        chunk, chunk_index tracks order within the doc.

    Exactly one of decision_id / document_id / outcome_id / strategy_id /
    constraint_id is populated per row, matching source_type.
    """

    __tablename__ = "embeddings"

    embedding_id = Column(Integer, primary_key=True, autoincrement=True)

    decision_id = Column(
        Integer,
        ForeignKey("decisions.decision_id", ondelete="CASCADE"),
        nullable=True,
    )
    document_id = Column(
        Integer,
        ForeignKey("documents.document_id", ondelete="CASCADE"),
        nullable=True,
    )
    outcome_id = Column(
        Integer,
        ForeignKey("outcomes.outcome_id", ondelete="CASCADE"),
        nullable=True,
    )
    strategy_id = Column(
        Integer,
        ForeignKey("strategies.strategy_id", ondelete="CASCADE"),
        nullable=True,
    )
    constraint_id = Column(
        Integer,
        ForeignKey("constraints_master.constraint_id", ondelete="CASCADE"),
        nullable=True,
    )

    source_type = Column(Enum(SourceTypeEnum), nullable=False)
    chunk_index = Column(Integer, nullable=True)

    content = Column(Text, nullable=False)
    embedding = Column(Vector(768), nullable=False)

    created_at = Column(DateTime(timezone=False), server_default=func.now())

    # Relationships
    decision = relationship("Decision", back_populates="embeddings")
    document = relationship("Document", back_populates="embeddings")
    outcome = relationship("Outcome", back_populates="embeddings")
    strategy = relationship("Strategy", back_populates="embeddings")
    constraint = relationship("ConstraintMaster", back_populates="embeddings")