"""Northbound instance models."""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import uuid

from app.models.base import Base


class TransportType(str):
    """Transport types for northbound instances."""

    HTTP = "http"
    STDIO = "stdio"


# Many-to-many association table for instances and tools
instance_tools = Table(
    "instance_tools",
    Base.metadata,
    Column(
        "instance_id",
        String(36),
        ForeignKey("northbound_instances.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("tool_id", String(36), ForeignKey("tools.id", ondelete="CASCADE"), primary_key=True),
    Column("added_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
)


# Many-to-many association table for instances and tags
instance_tags = Table(
    "instance_tags",
    Base.metadata,
    Column(
        "instance_id",
        String(36),
        ForeignKey("northbound_instances.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("tag_id", String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class NorthboundInstance(Base):
    """Model for northbound MCP server instances."""

    __tablename__ = "northbound_instances"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    transport_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default=TransportType.HTTP
    )
    endpoint_path: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    tools: Mapped[list["Tool"]] = relationship(  # type: ignore[name-defined]
        "Tool", secondary=instance_tools, back_populates="instances"
    )
    tags: Mapped[list["Tag"]] = relationship(  # type: ignore[name-defined]
        "Tag", secondary=instance_tags, back_populates="instances"
    )

    def __repr__(self) -> str:
        return f"<NorthboundInstance(id={self.id}, name={self.name})>"


# Type aliases for the association tables
InstanceTool = instance_tools
InstanceTag = instance_tags
