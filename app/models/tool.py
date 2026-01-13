"""Tool models."""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, JSON, DateTime, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import uuid

from app.models.base import Base


# Many-to-many association table for tools and tags
tool_tags = Table(
    "tool_tags",
    Base.metadata,
    Column("tool_id", String(36), ForeignKey("tools.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tool(Base):
    """Model for tools discovered from MCP servers."""

    __tablename__ = "tools"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    input_schema: Mapped[dict] = mapped_column(JSON, nullable=False)
    source_server_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("onboarded_servers.id", ondelete="CASCADE"), nullable=False
    )
    source_server_name: Mapped[str] = mapped_column(
        String(255), nullable=False
    )  # Denormalized for convenience
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    source_server: Mapped["OnboardedServer"] = relationship("OnboardedServer", back_populates="tools")
    tags: Mapped[list["Tag"]] = relationship(
        "Tag", secondary=tool_tags, back_populates="tools"
    )
    instances: Mapped[list["NorthboundInstance"]] = relationship(
        "NorthboundInstance",
        secondary="instance_tools",
        back_populates="tools",
    )

    def __repr__(self) -> str:
        return f"<Tool(id={self.id}, name={self.name}, server={self.source_server_name})>"


# Type alias for the association table
ToolTag = tool_tags
