"""add_transport_type_to_instances

Revision ID: e71e5108bcfc
Revises: add_pip_support_001
Create Date: 2026-01-13 12:13:31.659248

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e71e5108bcfc"
down_revision: Union[str, None] = "add_pip_support_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add transport_type column to northbound_instances table
    op.add_column(
        "northbound_instances",
        sa.Column("transport_type", sa.String(20), nullable=False, server_default="http"),
    )


def downgrade() -> None:
    # Remove transport_type column from northbound_instances table
    op.drop_column("northbound_instances", "transport_type")
