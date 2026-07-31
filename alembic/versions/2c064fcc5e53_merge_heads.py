"""merge heads

Revision ID: 2c064fcc5e53
Revises: b80b07819095, d3ee27a3d1d7
Create Date: 2026-07-30 21:22:28.888036

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2c064fcc5e53'
down_revision: Union[str, Sequence[str], None] = ('b80b07819095', 'd3ee27a3d1d7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
