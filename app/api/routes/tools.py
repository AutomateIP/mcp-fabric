"""API routes for tool management."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.api.schemas.tool import ToolResponse, AddTagsRequest
from app.managers.tool_registry import tool_registry
from app.core.logging import get_logger

router = APIRouter(prefix="/api/tools", tags=["tools"])
logger = get_logger("api.tools")


@router.get("", response_model=list[ToolResponse])
async def list_tools(
    server_id: Optional[str] = Query(None, description="Filter by server ID"),
    search_term: Optional[str] = Query(None, description="Search term"),
    db: AsyncSession = Depends(get_db),
) -> list[ToolResponse]:
    """List all available tools with optional filters."""
    tool_registry.set_db_session(db)
    tools = await tool_registry.get_all_tools(
        server_id=server_id, search_term=search_term
    )

    return [
        ToolResponse(
            id=tool.id,
            name=tool.name,
            description=tool.description,
            input_schema=tool.input_schema,
            source_server_id=tool.source_server_id,
            source_server_name=tool.source_server_name,
            created_at=tool.created_at,
            updated_at=tool.updated_at,
            tags=[tag.name for tag in tool.tags],
        )
        for tool in tools
    ]


@router.get("/{tool_id}", response_model=ToolResponse)
async def get_tool(
    tool_id: str, db: AsyncSession = Depends(get_db)
) -> ToolResponse:
    """Get a specific tool by ID."""
    tool_registry.set_db_session(db)
    tool = await tool_registry.get_tool_by_id(tool_id)

    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tool not found"
        )

    return ToolResponse(
        id=tool.id,
        name=tool.name,
        description=tool.description,
        input_schema=tool.input_schema,
        source_server_id=tool.source_server_id,
        source_server_name=tool.source_server_name,
        created_at=tool.created_at,
        updated_at=tool.updated_at,
        tags=[tag.name for tag in tool.tags],
    )


@router.post("/{tool_id}/tags", response_model=ToolResponse)
async def add_tags_to_tool(
    tool_id: str,
    request: AddTagsRequest,
    db: AsyncSession = Depends(get_db),
) -> ToolResponse:
    """Add tags to a tool."""
    tool_registry.set_db_session(db)

    try:
        tool = await tool_registry.add_tags_to_tool(tool_id, request.tag_ids)

        return ToolResponse(
            id=tool.id,
            name=tool.name,
            description=tool.description,
            input_schema=tool.input_schema,
            source_server_id=tool.source_server_id,
            source_server_name=tool.source_server_name,
            created_at=tool.created_at,
            updated_at=tool.updated_at,
            tags=[tag.name for tag in tool.tags],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )


@router.delete("/{tool_id}/tags/{tag_id}", response_model=ToolResponse)
async def remove_tag_from_tool(
    tool_id: str, tag_id: str, db: AsyncSession = Depends(get_db)
) -> ToolResponse:
    """Remove a tag from a tool."""
    tool_registry.set_db_session(db)

    try:
        tool = await tool_registry.remove_tag_from_tool(tool_id, tag_id)

        return ToolResponse(
            id=tool.id,
            name=tool.name,
            description=tool.description,
            input_schema=tool.input_schema,
            source_server_id=tool.source_server_id,
            source_server_name=tool.source_server_name,
            created_at=tool.created_at,
            updated_at=tool.updated_at,
            tags=[tag.name for tag in tool.tags],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
