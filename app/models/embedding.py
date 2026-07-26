# app/models/embedding.py

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from app.models.base import Base
from app.models.enums import SourceTypeEnum


class Embedding(Base):
    """
    Stores vector embeddings for text drawn from multiple source tables.

    One row per entity for structured sources (title + description
    fields combined into a single chunk). Multiple rows per document
    for document_chunk, linked to a parent DocumentPage via page_id.

    department_id is denormalized here (not just reachable via a join)
    so retrieval queries can filter by department access at the database
    level without joining out to five different parent tables per query.

    metadata stores display-ready fields captured at embedding time, so
    a chat citation can be rendered without re-querying the source table.
    Frozen at embed time — if the source record is edited later, existing
    citations keep showing what was true when they were generated.
    """

    __tablename__ = "embeddings"

    embedding_id = Column(Integer, primary_key=True, autoincrement=True)

    decision_id = Column(Integer, ForeignKey("decisions.decision_id", ondelete="CASCADE"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.document_id", ondelete="CASCADE"), nullable=True)
    outcome_id = Column(Integer, ForeignKey("outcomes.outcome_id", ondelete="CASCADE"), nullable=True)
    strategy_id = Column(Integer, ForeignKey("strategies.strategy_id", ondelete="CASCADE"), nullable=True)
    constraint_id = Column(Integer, ForeignKey("constraints_master.constraint_id", ondelete="CASCADE"), nullable=True)
    page_id = Column(Integer, ForeignKey("document_pages.page_id", ondelete="CASCADE"), nullable=True)

    # Denormalized for efficient access-control filtering at query time.
    department_id = Column(Integer, ForeignKey("departments.department_id", ondelete="CASCADE"), nullable=True)

    source_type = Column(Enum(SourceTypeEnum), nullable=False)
    chunk_index = Column(Integer, nullable=True)

    content = Column(Text, nullable=False)
    embedding = Column(Vector(768), nullable=False)

    # Display-ready citation fields, shape varies by source_type.
    embedding_metadata = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=False), server_default=func.now())

    # Relationships
    decision = relationship("Decision", back_populates="embeddings")
    document = relationship("Document", back_populates="embeddings")
    outcome = relationship("Outcome", back_populates="embeddings")
    strategy = relationship("Strategy", back_populates="embeddings")
    constraint = relationship("ConstraintMaster", back_populates="embeddings")
    page = relationship("DocumentPage", back_populates="chunks")
    department = relationship("Department")