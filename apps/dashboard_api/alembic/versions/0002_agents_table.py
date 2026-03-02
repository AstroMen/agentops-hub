"""add agents table

Revision ID: 0002_agents_table
Revises: 0001_init
Create Date: 2026-03-02
"""

from alembic import op
import sqlalchemy as sa


revision = '0002_agents_table'
down_revision = '0001_init'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'agents',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('name'),
    )
    op.create_index('ix_agents_name', 'agents', ['name'], unique=True)
    op.execute("INSERT INTO agents (name, description, is_active) VALUES ('dashboard-dev', 'Default dashboard agent', true)")


def downgrade() -> None:
    op.drop_index('ix_agents_name', table_name='agents')
    op.drop_table('agents')
