"""Pydantic schemas for tools."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ToolResponse(BaseModel):
    """Schema for tool response."""

    id: str
    name: str
    description: Optional[str]
    input_schema: dict
    source_server_id: str
    source_server_name: str
    created_at: datetime
    updated_at: datetime
    tags: list[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ToolFilter(BaseModel):
    """Schema for filtering tools."""

    server_id: Optional[str] = None
    tag_ids: Optional[list[str]] = None
    search_term: Optional[str] = None


class AddTagsRequest(BaseModel):
    """Schema for adding tags to a tool."""

    tag_ids: list[str] = Field(..., description="List of tag IDs to add")
