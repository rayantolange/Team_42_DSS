"""merge refresh_tokens and embeddings branches

Revision ID: 39513c64818f
Revises: a49054774e62, fa43cd745cb8
Create Date: 2026-07-26 19:37:46.038367

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '39513c64818f'
down_revision: Union[str, Sequence[str], None] = ('a49054774e62', 'fa43cd745cb8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
