"""Pydantic schemas for tags."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TagCreate(BaseModel):
    """Schema for creating a tag."""

    name: str = Field(..., description="Tag name")
    color: Optional[str] = Field(None, description="Hex color code")
    description: Optional[str] = Field(None, description="Tag description")


class TagUpdate(BaseModel):
    """Schema for updating a tag."""

    name: Optional[str] = Field(None, description="Tag name")
    color: Optional[str] = Field(None, description="Hex color code")
    description: Optional[str] = Field(None, description="Tag description")


class TagResponse(BaseModel):
    """Schema for tag response."""

    id: str
    name: str
    color: Optional[str]
    description: Optional[str]
    created_at: datetime
    tool_count: int = 0
    instance_count: int = 0

    model_config = {"from_attributes": True}
