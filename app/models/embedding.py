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

    One row per entity for structured sources — the entity's title and
    description fields are combined into a single chunk:
      - source_type="decision": Decision.title + problem_statement + decision_desc
      - source_type="strategy": Strategy.strategy_name + description
      - source_type="constraint": ConstraintMaster.constraint_type + description
      - source_type="outcome": Outcome.outcome_desc (+ parent Decision.title as prefix)

    Multiple rows per document for document_chunk — each row is one
    child chunk of a DocumentPage (parent), linked via page_id.
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

    # Only set for source_type="document_chunk" — links a child chunk
    # back to its parent page for parent-child retrieval.
    page_id = Column(
        Integer,
        ForeignKey("document_pages.page_id", ondelete="CASCADE"),
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
    page = relationship("DocumentPage", back_populates="chunks")