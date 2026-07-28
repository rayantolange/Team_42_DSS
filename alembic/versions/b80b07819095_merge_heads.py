"""merge heads

Revision ID: b80b07819095
Revises: 65d83a89d95a, fe4f92e2234d
Create Date: 2026-07-26 23:41:31.634735

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b80b07819095'
down_revision: Union[str, Sequence[str], None] = ('65d83a89d95a', 'fe4f92e2234d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
