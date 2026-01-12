"""Southbound server models."""

from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import String, Text, JSON, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import uuid

from app.models.base import Base


class TransportType(str, Enum):
    """Transport types for MCP servers."""

    STDIO = "stdio"
    STREAMABLE_HTTP = "streamable_http"
    SSE = "sse"  # Legacy support


class ServerStatus(str, Enum):
    """Connection status for MCP servers."""

    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    RECONNECTING = "reconnecting"


class InstallationType(str, Enum):
    """Installation type for MCP servers."""

    SYSTEM = "system"  # Already installed in container/system
    GIT = "git"        # Installed from git repository
    PIP = "pip"        # Installed via pip or uv


class OnboardedServer(Base):
    """Model for onboarded MCP servers."""

    __tablename__ = "onboarded_servers"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    transport_type: Mapped[TransportType] = mapped_column(
        SQLEnum(TransportType), nullable=False
    )
    connection_config: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[ServerStatus] = mapped_column(
        SQLEnum(ServerStatus), default=ServerStatus.DISCONNECTED, nullable=False
    )
    session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_connected_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Installation fields
    installation_type: Mapped[InstallationType] = mapped_column(
        SQLEnum(InstallationType, values_callable=lambda x: [e.value for e in x]),
        default=InstallationType.SYSTEM,
        nullable=False
    )

    # Git installation fields
    git_repo_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    git_branch: Mapped[Optional[str]] = mapped_column(
        String(128), nullable=True, default="main"
    )
    git_commit_sha: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    install_command: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    setup_command: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Pip installation fields
    pip_package: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    use_uv: Mapped[Optional[bool]] = mapped_column(nullable=True, default=False)

    # Common installation fields
    install_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    install_log: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    installed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    installation_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Relationships
    tools: Mapped[list["Tool"]] = relationship(
        "Tool", back_populates="source_server", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<OnboardedServer(id={self.id}, name={self.name}, status={self.status})>"
