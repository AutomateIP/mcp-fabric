"""add pip installation support

Revision ID: add_pip_support_001
Revises: add_git_support_001
Create Date: 2026-01-12 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_pip_support_001'
down_revision = 'add_git_support_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add pip installation fields to onboarded_servers table
    op.add_column('onboarded_servers', sa.Column('pip_package', sa.String(255), nullable=True))
    op.add_column('onboarded_servers', sa.Column('use_uv', sa.Boolean(), nullable=True, server_default='false'))

    # Update installation_type enum to include 'pip'
    # For PostgreSQL
    op.execute("ALTER TYPE installationtype ADD VALUE IF NOT EXISTS 'pip'")


def downgrade() -> None:
    # Remove pip installation fields
    op.drop_column('onboarded_servers', 'use_uv')
    op.drop_column('onboarded_servers', 'pip_package')

    # Note: Cannot remove enum value in PostgreSQL, would need to recreate the enum
