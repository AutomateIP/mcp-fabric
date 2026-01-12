"""Pydantic schemas for servers."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class ServerCreate(BaseModel):
    """Schema for creating a server."""

    name: str = Field(..., description="Server name")
    description: Optional[str] = Field(None, description="Server description")
    transport_type: str = Field(..., description="Transport type (stdio, streamable_http, sse)")
    connection_config: dict = Field(..., description="Transport-specific configuration")

    # Installation fields (optional)
    installation_type: Optional[str] = Field(
        "system", description="Installation type: 'system', 'git', or 'pip'"
    )

    # Pip installation fields
    pip_package: Optional[str] = Field(
        None, description="Pip package name (e.g., 'duckduckgo-mcp-server')"
    )
    use_uv: Optional[bool] = Field(
        False, description="Use 'uv pip install' instead of 'pip install'"
    )
    git_repo_url: Optional[str] = Field(
        None, description="Git repository URL (HTTPS only, required if installation_type='git')"
    )
    git_branch: Optional[str] = Field(
        "main", description="Git branch to clone (default: main)"
    )
    install_command: Optional[str] = Field(
        None, description="Command to install dependencies (auto-detected if not provided)"
    )
    setup_command: Optional[str] = Field(
        None, description="Command to build/setup project (optional)"
    )

    @field_validator("git_repo_url")
    @classmethod
    def validate_git_url(cls, v: Optional[str], info) -> Optional[str]:
        """Validate git URL if installation_type is git."""
        if v and not v.startswith("https://"):
            raise ValueError("Git URL must use HTTPS protocol")
        return v


class ServerUpdate(BaseModel):
    """Schema for updating a server."""

    name: Optional[str] = Field(None, description="Server name")
    description: Optional[str] = Field(None, description="Server description")
    connection_config: Optional[dict] = Field(None, description="Transport-specific configuration")


class ServerResponse(BaseModel):
    """Schema for server response."""

    id: str
    name: str
    description: Optional[str]
    transport_type: str
    connection_config: Optional[dict] = Field(None, description="Transport configuration")
    status: str
    session_id: Optional[str]
    created_at: datetime
    last_connected_at: Optional[datetime]
    tool_count: int = 0

    # Installation fields
    installation_type: Optional[str] = None

    # Git installation fields
    git_repo_url: Optional[str] = None
    git_branch: Optional[str] = None
    git_commit_sha: Optional[str] = None
    install_command: Optional[str] = None
    setup_command: Optional[str] = None

    # Pip installation fields
    pip_package: Optional[str] = None
    use_uv: Optional[bool] = None

    # Common installation fields
    install_status: Optional[str] = None
    installed_at: Optional[datetime] = None
    installation_path: Optional[str] = None

    model_config = {"from_attributes": True}


class ServerStatus(BaseModel):
    """Schema for server status."""

    server_id: str
    status: str
    is_connected: bool
    last_connected_at: Optional[datetime]
