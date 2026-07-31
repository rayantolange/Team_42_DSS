"""add status and status_message to documents

Revision ID: 77155834b6b0
Revises: 2c064fcc5e53
Create Date: 2026-07-30 21:23:22.652690

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '77155834b6b0'
down_revision: Union[str, Sequence[str], None] = '2c064fcc5e53'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    document_status_enum = postgresql.ENUM(
        "pending", "processing", "completed", "failed",
        name="documentstatusenum",
    )
    document_status_enum.create(op.get_bind())

    op.add_column(
        "documents",
        sa.Column(
            "status",
            sa.Enum("pending", "processing", "completed", "failed", name="documentstatusenum"),
            server_default="pending",
            nullable=False,
        ),
    )
    op.add_column("documents", sa.Column("status_message", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("documents", "status_message")
    op.drop_column("documents", "status")

    document_status_enum = postgresql.ENUM(
        "pending", "processing", "completed", "failed",
        name="documentstatusenum",
    )
    document_status_enum.drop(op.get_bind())
