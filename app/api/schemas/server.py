"""Pydantic schemas for servers."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ServerCreate(BaseModel):
    """Schema for creating a server."""

    name: str = Field(..., description="Server name")
    description: Optional[str] = Field(None, description="Server description")
    transport_type: str = Field(..., description="Transport type (stdio, streamable_http, sse)")
    connection_config: dict = Field(..., description="Transport-specific configuration")


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

    model_config = {"from_attributes": True}


class ServerStatus(BaseModel):
    """Schema for server status."""

    server_id: str
    status: str
    is_connected: bool
    last_connected_at: Optional[datetime]
