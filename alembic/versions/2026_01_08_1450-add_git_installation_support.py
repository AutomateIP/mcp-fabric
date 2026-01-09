"""Add git installation support

Revision ID: add_git_support_001
Revises: 9564efc4f1dc
Create Date: 2026-01-08 14:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_git_support_001'
down_revision = '9564efc4f1dc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add columns for git-based MCP server installation."""

    # Create installation_type enum with explicit values
    # Note: Using lowercase values to match Python enum values
    op.execute("CREATE TYPE installationtype AS ENUM ('system', 'git')")

    # Add new columns to onboarded_servers table
    op.add_column('onboarded_servers',
        sa.Column('installation_type',
                  sa.Enum('system', 'git', name='installationtype'),
                  nullable=False,
                  server_default='system')
    )

    op.add_column('onboarded_servers',
        sa.Column('git_repo_url', sa.String(512), nullable=True)
    )

    op.add_column('onboarded_servers',
        sa.Column('git_branch', sa.String(128), nullable=True, server_default='main')
    )

    op.add_column('onboarded_servers',
        sa.Column('git_commit_sha', sa.String(40), nullable=True)
    )

    op.add_column('onboarded_servers',
        sa.Column('install_command', sa.Text, nullable=True)
    )

    op.add_column('onboarded_servers',
        sa.Column('setup_command', sa.Text, nullable=True)
    )

    op.add_column('onboarded_servers',
        sa.Column('install_status', sa.String(50), nullable=True)
    )

    op.add_column('onboarded_servers',
        sa.Column('install_log', sa.Text, nullable=True)
    )

    op.add_column('onboarded_servers',
        sa.Column('installed_at', sa.DateTime(timezone=True), nullable=True)
    )

    op.add_column('onboarded_servers',
        sa.Column('installation_path', sa.String(512), nullable=True)
    )

    # Create index on installation_type for faster queries
    op.create_index(
        'ix_onboarded_servers_installation_type',
        'onboarded_servers',
        ['installation_type']
    )


def downgrade() -> None:
    """Remove git installation support columns."""

    # Drop index
    op.drop_index('ix_onboarded_servers_installation_type', 'onboarded_servers')

    # Drop columns
    op.drop_column('onboarded_servers', 'installation_path')
    op.drop_column('onboarded_servers', 'installed_at')
    op.drop_column('onboarded_servers', 'install_log')
    op.drop_column('onboarded_servers', 'install_status')
    op.drop_column('onboarded_servers', 'setup_command')
    op.drop_column('onboarded_servers', 'install_command')
    op.drop_column('onboarded_servers', 'git_commit_sha')
    op.drop_column('onboarded_servers', 'git_branch')
    op.drop_column('onboarded_servers', 'git_repo_url')
    op.drop_column('onboarded_servers', 'installation_type')

    # Drop enum type
    op.execute('DROP TYPE IF EXISTS installationtype')
