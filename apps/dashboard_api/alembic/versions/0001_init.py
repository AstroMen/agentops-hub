"""init schema

Revision ID: 0001_init
Revises: 
Create Date: 2026-03-01
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001_init'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    ticket_status = sa.Enum('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'QUEUED', 'RUNNING', 'DONE', 'FAILED', name='ticketstatus', native_enum=False)
    ticket_priority = sa.Enum('P0', 'P1', 'P2', 'P3', name='ticketpriority', native_enum=False)
    run_status = sa.Enum('RUNNING', 'DONE', 'FAILED', name='runstatus', native_enum=False)
    ticket_status.create(op.get_bind(), checkfirst=True)
    ticket_priority.create(op.get_bind(), checkfirst=True)
    run_status.create(op.get_bind(), checkfirst=True)

    op.create_table('users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    op.create_table('roles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.UniqueConstraint('name')
    )
    op.create_table('permissions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.UniqueConstraint('name')
    )
    op.create_table('user_roles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role_id', sa.Integer(), sa.ForeignKey('roles.id', ondelete='CASCADE'), nullable=False),
        sa.UniqueConstraint('user_id', 'role_id', name='uq_user_role')
    )
    op.create_table('role_permissions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('role_id', sa.Integer(), sa.ForeignKey('roles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('permission_id', sa.Integer(), sa.ForeignKey('permissions.id', ondelete='CASCADE'), nullable=False),
        sa.UniqueConstraint('role_id', 'permission_id', name='uq_role_permission')
    )
    op.create_table('tickets',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('status', ticket_status, nullable=False),
        sa.Column('priority', ticket_priority, nullable=False),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('assigned_agent', sa.String(length=120), nullable=False),
        sa.Column('approved_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('queued_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_table('runs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('ticket_id', sa.Integer(), sa.ForeignKey('tickets.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', run_status, nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('logs_url', sa.String(length=500), nullable=True),
        sa.Column('artifacts', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('actor_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.String(length=50), nullable=False),
        sa.Column('detail', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('runs')
    op.drop_table('tickets')
    op.drop_table('role_permissions')
    op.drop_table('user_roles')
    op.drop_table('permissions')
    op.drop_table('roles')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
    sa.Enum(name='runstatus', native_enum=False).drop(op.get_bind())
    sa.Enum(name='ticketpriority', native_enum=False).drop(op.get_bind())
    sa.Enum(name='ticketstatus', native_enum=False).drop(op.get_bind())
