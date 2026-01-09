"""Common Pydantic schemas."""

from typing import Optional
from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Schema for health check response."""

    status: str
    database: str
    southbound_servers: int
    northbound_instances: int


class StatsResponse(BaseModel):
    """Schema for statistics response."""

    total_servers: int
    connected_servers: int
    total_tools: int
    total_instances: int
    total_tags: int


class ErrorResponse(BaseModel):
    """Schema for error response."""

    error: str
    detail: str
    code: Optional[str] = None


class SuccessResponse(BaseModel):
    """Schema for success response."""

    message: str
    data: Optional[dict] = None
