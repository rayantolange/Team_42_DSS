# app/models/document_page.py

from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


class DocumentPage(Base):
    """
    Stores the full extracted text of one page of an uploaded document.

    This is the "parent" in parent-child chunking: child chunks
    (stored in Embedding, source_type=document_chunk) are the small
    pieces actually matched during similarity search, but once a
    child chunk matches, its parent page's full content is fetched
    from here to give the LLM complete context instead of just the
    small matched fragment.
    """

    __tablename__ = "document_pages"

    page_id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(
        Integer,
        ForeignKey("documents.document_id", ondelete="CASCADE"),
        nullable=False,
    )
    page_number = Column(Integer, nullable=False)
    page_content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    # Relationships
    document = relationship("Document", back_populates="pages")
    chunks = relationship("Embedding", back_populates="page")