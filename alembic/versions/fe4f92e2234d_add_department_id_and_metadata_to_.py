"""add department_id and metadata to embeddings

Revision ID: fe4f92e2234d
Revises: e720c645d0ce
Create Date: 2026-07-26 21:24:49.314186

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fe4f92e2234d'
down_revision: Union[str, Sequence[str], None] = 'e720c645d0ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('embeddings', sa.Column('department_id', sa.Integer(), nullable=True))
    op.add_column('embeddings', sa.Column('embedding_metadata', postgresql.JSONB(), nullable=True))
    op.create_foreign_key(
        'fk_embeddings_department_id',
        'embeddings', 'departments',
        ['department_id'], ['department_id'],
        ondelete='CASCADE',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_embeddings_department_id', 'embeddings', type_='foreignkey')
    op.drop_column('embeddings', 'embedding_metadata')
    op.drop_column('embeddings', 'department_id')