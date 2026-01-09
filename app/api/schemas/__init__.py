"""Pydantic schemas for API."""

from app.api.schemas.server import (
    ServerCreate,
    ServerUpdate,
    ServerResponse,
    ServerStatus as ServerStatusSchema,
)
from app.api.schemas.tool import ToolResponse, ToolFilter
from app.api.schemas.instance import (
    InstanceCreate,
    InstanceUpdate,
    InstanceResponse,
)
from app.api.schemas.tag import TagCreate, TagUpdate, TagResponse
from app.api.schemas.common import HealthResponse, StatsResponse

__all__ = [
    "ServerCreate",
    "ServerUpdate",
    "ServerResponse",
    "ServerStatusSchema",
    "ToolResponse",
    "ToolFilter",
    "InstanceCreate",
    "InstanceUpdate",
    "InstanceResponse",
    "TagCreate",
    "TagUpdate",
    "TagResponse",
    "HealthResponse",
    "StatsResponse",
]
