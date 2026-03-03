"""add projects table and ticket project relation

Revision ID: 0003_projects_table_and_ticket_project
Revises: 0002_agents_table
Create Date: 2026-03-03
"""

from alembic import op
import sqlalchemy as sa


revision = '0003_projects_table_and_ticket_project'
down_revision = '0002_agents_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('name'),
    )
    op.create_index('ix_projects_name', 'projects', ['name'], unique=True)

    op.execute("INSERT INTO projects (name, description, is_active) VALUES ('General', 'Default project', true)")

    op.add_column('tickets', sa.Column('project_id', sa.Integer(), nullable=True))
    op.execute('UPDATE tickets SET project_id = (SELECT id FROM projects WHERE name = \'General\' LIMIT 1)')
    op.alter_column('tickets', 'project_id', nullable=False)
    op.create_foreign_key('fk_tickets_project_id_projects', 'tickets', 'projects', ['project_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_tickets_project_id_projects', 'tickets', type_='foreignkey')
    op.drop_column('tickets', 'project_id')
    op.drop_index('ix_projects_name', table_name='projects')
    op.drop_table('projects')
