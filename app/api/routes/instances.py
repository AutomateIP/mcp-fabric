"""API routes for instance management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.api.schemas.instance import (
    InstanceCreate,
    InstanceUpdate,
    InstanceResponse,
    InstanceEndpointInfo,
    InstanceDetailResponse,
    ToolInfo,
)
from app.managers.northbound import modern_northbound_manager as northbound_manager
from app.core.config import settings
from app.core.logging import get_logger

router = APIRouter(prefix="/api/instances", tags=["instances"])
logger = get_logger("api.instances")


@router.post("", response_model=InstanceResponse, status_code=status.HTTP_201_CREATED)
async def create_instance(
    instance_data: InstanceCreate, db: AsyncSession = Depends(get_db)
) -> InstanceResponse:
    """Create a new northbound instance."""
    northbound_manager.set_db_session(db)

    try:
        instance = await northbound_manager.create_instance(
            name=instance_data.name,
            tool_ids=instance_data.tool_ids,
            description=instance_data.description,
            transport_type=instance_data.transport_type,
            tag_ids=instance_data.tag_ids,
        )

        return InstanceResponse(
            id=instance.id,
            name=instance.name,
            description=instance.description,
            endpoint_path=instance.endpoint_path,
            created_at=instance.created_at,
            updated_at=instance.updated_at,
            tool_count=len(instance.tools),
            tags=[tag.name for tag in instance.tags],
        )
    except Exception as e:
        logger.error(f"Failed to create instance: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create instance: {str(e)}",
        )


@router.get("", response_model=list[InstanceResponse])
async def list_instances(
    db: AsyncSession = Depends(get_db),
) -> list[InstanceResponse]:
    """List all northbound instances."""
    northbound_manager.set_db_session(db)
    instances = await northbound_manager.get_all_instances()

    return [
        InstanceResponse(
            id=instance.id,
            name=instance.name,
            description=instance.description,
            endpoint_path=instance.endpoint_path,
            created_at=instance.created_at,
            updated_at=instance.updated_at,
            tool_count=len(instance.tools),
            tags=[tag.name for tag in instance.tags],
        )
        for instance in instances
    ]


@router.get("/{instance_id}", response_model=InstanceResponse)
async def get_instance(instance_id: str, db: AsyncSession = Depends(get_db)) -> InstanceResponse:
    """Get a specific instance."""
    northbound_manager.set_db_session(db)
    instance = await northbound_manager.get_instance(instance_id)

    if not instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instance not found")

        return InstanceResponse(
            id=instance.id,
            name=instance.name,
            description=instance.description,
            transport_type=getattr(instance, "transport_type", "http"),
            endpoint_path=instance.endpoint_path,
            created_at=instance.created_at,
            updated_at=instance.updated_at,
            tool_count=len(instance.tools),
            tags=[tag.name for tag in instance.tags],
        )


@router.get("/{instance_id}/details", response_model=InstanceDetailResponse)
async def get_instance_details(
    instance_id: str, db: AsyncSession = Depends(get_db)
) -> InstanceDetailResponse:
    """Get detailed instance information including tools and MCP config."""
    northbound_manager.set_db_session(db)
    instance = await northbound_manager.get_instance(instance_id)

    if not instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instance not found")

    # Build MCP config in Claude Code format
    mcp_config = {
        "mcpServers": {
            instance.name: {
                "url": f"{settings.base_url}{instance.endpoint_path}",
                "transport": "streamableHttp",
            }
        }
    }

    # Build tools list
    tools_list = [
        ToolInfo(
            id=tool.id,
            name=tool.name,
            description=tool.description,
            source_server_name=tool.source_server_name,
        )
        for tool in instance.tools
    ]

    return InstanceDetailResponse(
        id=instance.id,
        name=instance.name,
        description=instance.description,
        endpoint_path=instance.endpoint_path,
        created_at=instance.created_at,
        updated_at=instance.updated_at,
        tool_count=len(instance.tools),
        tags=[tag.name for tag in instance.tags],
        tools=tools_list,
        mcp_config=mcp_config,
    )


@router.put("/{instance_id}", response_model=InstanceResponse)
async def update_instance(
    instance_id: str,
    instance_data: InstanceUpdate,
    db: AsyncSession = Depends(get_db),
) -> InstanceResponse:
    """Update an instance."""
    northbound_manager.set_db_session(db)

    try:
        instance = await northbound_manager.update_instance(
            instance_id=instance_id,
            tool_ids=instance_data.tool_ids,
            tag_ids=instance_data.tag_ids,
            name=instance_data.name,
            description=instance_data.description,
        )

        return InstanceResponse(
            id=instance.id,
            name=instance.name,
            description=instance.description,
            endpoint_path=instance.endpoint_path,
            created_at=instance.created_at,
            updated_at=instance.updated_at,
            tool_count=len(instance.tools),
            tags=[tag.name for tag in instance.tags],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update instance: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update instance: {str(e)}",
        )


@router.delete("/{instance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_instance(instance_id: str, db: AsyncSession = Depends(get_db)) -> None:
    """Delete an instance."""
    northbound_manager.set_db_session(db)

    try:
        await northbound_manager.delete_instance(instance_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{instance_id}/endpoint", response_model=InstanceEndpointInfo)
async def get_instance_endpoint(
    instance_id: str, db: AsyncSession = Depends(get_db)
) -> InstanceEndpointInfo:
    """Get connection information for an instance."""
    northbound_manager.set_db_session(db)
    instance = await northbound_manager.get_instance(instance_id)

    if not instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instance not found")

    endpoint_url = f"{settings.base_url}{instance.endpoint_path}"

    # Example MCP client configuration
    example_config = {
        "mcpServers": {
            instance.name: {
                "transport": {
                    "type": "http",
                    "url": endpoint_url,
                }
            }
        }
    }

    return InstanceEndpointInfo(
        instance_id=instance.id,
        name=instance.name,
        endpoint_url=endpoint_url,
        tool_count=len(instance.tools),
        example_config=example_config,
    )
