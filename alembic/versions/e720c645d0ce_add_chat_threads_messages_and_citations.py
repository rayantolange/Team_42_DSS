"""add chat threads messages and citations

Revision ID: e720c645d0ce
Revises: 8e9783086975
Create Date: 2026-07-26 20:52:23.580051

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e720c645d0ce'
down_revision: Union[str, Sequence[str], None] = '8e9783086975'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('chat_threads',
        sa.Column('thread_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('thread_id')
    )

    op.create_table('chat_messages',
        sa.Column('message_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('thread_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.Enum('user', 'assistant', name='chatroleenum'), nullable=False),
        sa.Column('mode', sa.Enum('chat', 'rag_search', name='chatmodeenum'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['thread_id'], ['chat_threads.thread_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('message_id')
    )

    op.create_table('message_citations',
        sa.Column('citation_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('message_id', sa.Integer(), nullable=False),
        sa.Column('embedding_id', sa.Integer(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('snippet', sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(['message_id'], ['chat_messages.message_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['embedding_id'], ['embeddings.embedding_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('citation_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('message_citations')
    op.drop_table('chat_messages')
    op.execute("DROP TYPE IF EXISTS chatroleenum")
    op.execute("DROP TYPE IF EXISTS chatmodeenum")
    op.drop_table('chat_threads')
