"""Pydantic schemas for instances."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class InstanceCreate(BaseModel):
    """Schema for creating an instance."""

    name: str = Field(..., description="Instance name")
    description: Optional[str] = Field(None, description="Instance description")
    transport_type: str = Field("http", description="Transport type (http, stdio)")
    tool_ids: list[str] = Field(..., description="List of tool IDs to include")
    tag_ids: Optional[list[str]] = Field(None, description="List of tag IDs")


class InstanceUpdate(BaseModel):
    """Schema for updating an instance."""

    name: Optional[str] = Field(None, description="Instance name")
    description: Optional[str] = Field(None, description="Instance description")
    transport_type: Optional[str] = Field(None, description="Transport type (http, stdio)")
    tool_ids: Optional[list[str]] = Field(None, description="List of tool IDs to include")
    tag_ids: Optional[list[str]] = Field(None, description="List of tag IDs")


class InstanceResponse(BaseModel):
    """Schema for instance response."""

    id: str
    name: str
    description: Optional[str]
    transport_type: str = Field("http", description="Transport type")
    endpoint_path: str
    created_at: datetime
    updated_at: datetime
    tool_count: int = 0
    tags: list[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class InstanceEndpointInfo(BaseModel):
    """Schema for instance endpoint information."""

    instance_id: str
    name: str
    endpoint_url: str
    tool_count: int
    example_config: dict


class ToolInfo(BaseModel):
    """Schema for tool information in instance details."""

    id: str
    name: str
    description: Optional[str]
    source_server_name: str


class InstanceDetailResponse(BaseModel):
    """Schema for detailed instance response with tools."""

    id: str
    name: str
    description: Optional[str]
    transport_type: str = Field("http", description="Transport type")
    endpoint_path: str
    created_at: datetime
    updated_at: datetime
    tool_count: int = 0
    tags: list[str] = Field(default_factory=list)
    tools: list[ToolInfo] = Field(default_factory=list)
    mcp_config: dict = Field(default_factory=dict)

    model_config = {"from_attributes": True}
