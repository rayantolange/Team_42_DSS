"""merge heads

Revision ID: d3ee27a3d1d7
Revises: 65d83a89d95a, fe4f92e2234d
Create Date: 2026-07-26 22:31:23.813408

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3ee27a3d1d7'
down_revision: Union[str, Sequence[str], None] = ('65d83a89d95a', 'fe4f92e2234d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
