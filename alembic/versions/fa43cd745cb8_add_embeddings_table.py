"""add embeddings table

Revision ID: fa43cd745cb8
Revises: e5924cbf914f
Create Date: 2026-07-25 12:25:36.865172

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = 'fa43cd745cb8'
down_revision: Union[str, Sequence[str], None] = 'e5924cbf914f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # Enable the pgvector extension first
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;") 

    """Upgrade schema."""
    op.create_table('embeddings',
        sa.Column('embedding_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('decision_id', sa.Integer(), nullable=True),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('outcome_id', sa.Integer(), nullable=True),
        sa.Column('strategy_id', sa.Integer(), nullable=True),
        sa.Column('constraint_id', sa.Integer(), nullable=True),
        sa.Column('source_type', sa.Enum(
            'problem_statement', 'decision_desc', 'document_chunk',
            'outcome_desc', 'strategy_description', 'constraint_description',
            name='sourcetypeenum'
        ), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('embedding', Vector(768), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['constraint_id'], ['constraints_master.constraint_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['decision_id'], ['decisions.decision_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.document_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['outcome_id'], ['outcomes.outcome_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['strategy_id'], ['strategies.strategy_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('embedding_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('embeddings')
    op.execute("DROP TYPE IF EXISTS sourcetypeenum")