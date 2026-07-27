"""recreate embeddings with entity-level source types and add document_pages

Revision ID: 8e9783086975
Revises: 39513c64818f
Create Date: 2026-07-26 19:45:46.022367

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '8e9783086975'
down_revision: Union[str, Sequence[str], None] = '39513c64818f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("DROP TABLE IF EXISTS embeddings")
    op.execute("DROP TYPE IF EXISTS sourcetypeenum")

    source_type_enum = postgresql.ENUM(
        'decision', 'strategy', 'constraint', 'outcome', 'document_chunk',
        name='sourcetypeenum'
    )
    source_type_enum.create(op.get_bind(), checkfirst=True)

    # Prevent create_table from trying to create the type again
    source_type_enum_no_create = postgresql.ENUM(
        'decision', 'strategy', 'constraint', 'outcome', 'document_chunk',
        name='sourcetypeenum',
        create_type=False
    )

    op.create_table('document_pages',
        sa.Column('page_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=False),
        sa.Column('page_content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.document_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('page_id')
    )
    op.create_table('embeddings',
        sa.Column('embedding_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('decision_id', sa.Integer(), nullable=True),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('outcome_id', sa.Integer(), nullable=True),
        sa.Column('strategy_id', sa.Integer(), nullable=True),
        sa.Column('constraint_id', sa.Integer(), nullable=True),
        sa.Column('page_id', sa.Integer(), nullable=True),
        sa.Column('source_type', source_type_enum_no_create, nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('embedding', Vector(768), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['constraint_id'], ['constraints_master.constraint_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['decision_id'], ['decisions.decision_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.document_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['outcome_id'], ['outcomes.outcome_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['strategy_id'], ['strategies.strategy_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['page_id'], ['document_pages.page_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('embedding_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP TABLE IF EXISTS embeddings")
    op.execute("DROP TYPE IF EXISTS sourcetypeenum")
    op.execute("DROP TABLE IF EXISTS document_pages")

    source_type_enum = postgresql.ENUM(
        'problem_statement', 'decision_desc', 'document_chunk',
        'outcome_desc', 'strategy_description', 'constraint_description',
        name='sourcetypeenum'
    )
    source_type_enum.create(op.get_bind(), checkfirst=True)

    source_type_enum_no_create = postgresql.ENUM(
        'problem_statement', 'decision_desc', 'document_chunk',
        'outcome_desc', 'strategy_description', 'constraint_description',
        name='sourcetypeenum',
        create_type=False
    )

    op.create_table('embeddings',
        sa.Column('embedding_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('decision_id', sa.Integer(), nullable=True),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('outcome_id', sa.Integer(), nullable=True),
        sa.Column('strategy_id', sa.Integer(), nullable=True),
        sa.Column('constraint_id', sa.Integer(), nullable=True),
        sa.Column('source_type', source_type_enum_no_create, nullable=False),
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