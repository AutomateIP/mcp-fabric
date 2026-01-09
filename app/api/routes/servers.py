"""API routes for server management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid

from app.core.database import get_db
from app.api.schemas.server import ServerCreate, ServerUpdate, ServerResponse, ServerStatus
from app.api.schemas.tool import ToolResponse
from app.models.server import OnboardedServer, TransportType, ServerStatus as ServerStatusEnum
from app.managers.southbound import modern_southbound_manager as southbound_manager
from app.core.logging import get_logger

router = APIRouter(prefix="/api/servers", tags=["servers"])
logger = get_logger("api.servers")


@router.post("", response_model=ServerResponse, status_code=status.HTTP_201_CREATED)
async def create_server(
    server_data: ServerCreate,
    skip_connect: bool = False,
    db: AsyncSession = Depends(get_db),
) -> ServerResponse:
    """Onboard a new MCP server.

    Args:
        server_data: Server configuration
        skip_connect: If True, create server without attempting connection (useful for testing)
        db: Database session
    """
    try:
        # Validate transport type
        try:
            transport_type = TransportType(server_data.transport_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid transport type: {server_data.transport_type}",
            )

        # Create server model
        server = OnboardedServer(
            id=str(uuid.uuid4()),
            name=server_data.name,
            description=server_data.description,
            transport_type=transport_type,
            connection_config=server_data.connection_config,
            status=ServerStatusEnum.DISCONNECTED,
        )

        db.add(server)
        await db.commit()
        await db.refresh(server)

        # Try to connect (only if not skipped)
        if not skip_connect:
            try:
                success = await southbound_manager.connect_server(server, db)
                if success:
                    # Discover tools (will add tools to DB)
                    await southbound_manager.discover_tools(server.id, db)
            except Exception as conn_error:
                logger.warning(f"Failed to connect server {server.name}: {conn_error}")
                # Server is created but not connected - that's OK

            # Refresh server to get latest status
            await db.refresh(server)

        # Count tools using a simple query
        from app.models.tool import Tool
        tool_count_result = await db.execute(
            select(Tool).where(Tool.source_server_id == server.id)
        )
        tool_count = len(tool_count_result.scalars().all())

        response = ServerResponse(
            id=server.id,
            name=server.name,
            description=server.description,
            transport_type=server.transport_type.value,
            connection_config=server.connection_config,
            status=server.status.value,
            session_id=server.session_id,
            created_at=server.created_at,
            last_connected_at=server.last_connected_at,
            tool_count=tool_count,
        )

        return response

    except Exception as e:
        logger.error(f"Failed to create server: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create server: {str(e)}",
        )


@router.get("", response_model=list[ServerResponse])
async def list_servers(db: AsyncSession = Depends(get_db)) -> list[ServerResponse]:
    """List all onboarded servers."""
    result = await db.execute(
        select(OnboardedServer).options(selectinload(OnboardedServer.tools))
    )
    servers = result.scalars().all()

    return [
        ServerResponse(
            id=server.id,
            name=server.name,
            description=server.description,
            transport_type=server.transport_type.value,
            connection_config=server.connection_config,
            status=server.status.value,
            session_id=server.session_id,
            created_at=server.created_at,
            last_connected_at=server.last_connected_at,
            tool_count=len(server.tools),
        )
        for server in servers
    ]


@router.get("/{server_id}", response_model=ServerResponse)
async def get_server(
    server_id: str, db: AsyncSession = Depends(get_db)
) -> ServerResponse:
    """Get a specific server."""
    result = await db.execute(
        select(OnboardedServer)
        .options(selectinload(OnboardedServer.tools))
        .where(OnboardedServer.id == server_id)
    )
    server = result.scalar_one_or_none()

    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Server not found"
        )

    return ServerResponse(
        id=server.id,
        name=server.name,
        description=server.description,
        transport_type=server.transport_type.value,
        status=server.status.value,
        session_id=server.session_id,
        created_at=server.created_at,
        last_connected_at=server.last_connected_at,
        tool_count=len(server.tools),
    )


@router.delete("/{server_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_server(server_id: str, db: AsyncSession = Depends(get_db)) -> None:
    """Delete a server."""
    result = await db.execute(
        select(OnboardedServer).where(OnboardedServer.id == server_id)
    )
    server = result.scalar_one_or_none()

    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Server not found"
        )

    # Disconnect if connected
    southbound_manager.set_db_session(db)
    await southbound_manager.disconnect_server(server_id)

    # Delete from database
    await db.delete(server)
    await db.commit()


@router.get("/{server_id}/status", response_model=ServerStatus)
async def get_server_status(
    server_id: str, db: AsyncSession = Depends(get_db)
) -> ServerStatus:
    """Get server connection status."""
    result = await db.execute(
        select(OnboardedServer).where(OnboardedServer.id == server_id)
    )
    server = result.scalar_one_or_none()

    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Server not found"
        )

    is_connected = server_id in southbound_manager.connections

    return ServerStatus(
        server_id=server.id,
        status=server.status.value,
        is_connected=is_connected,
        last_connected_at=server.last_connected_at,
    )


@router.post("/{server_id}/connect", response_model=ServerResponse)
async def connect_server(
    server_id: str, db: AsyncSession = Depends(get_db)
) -> ServerResponse:
    """Manually connect to a server and discover tools."""
    result = await db.execute(
        select(OnboardedServer)
        .options(selectinload(OnboardedServer.tools))
        .where(OnboardedServer.id == server_id)
    )
    server = result.scalar_one_or_none()

    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Server not found"
        )

    # Check if already connected
    if server_id in southbound_manager.connections:
        return ServerResponse(
            id=server.id,
            name=server.name,
            description=server.description,
            transport_type=server.transport_type.value,
            status=server.status.value,
            session_id=server.session_id,
            created_at=server.created_at,
            last_connected_at=server.last_connected_at,
            tool_count=len(server.tools),
        )

    try:
        # Attempt connection
        success = await southbound_manager.connect_server(server, db)
        if success:
            # Discover tools
            await southbound_manager.discover_tools(server.id, db)
            await db.refresh(server)

            return ServerResponse(
                id=server.id,
                name=server.name,
                description=server.description,
                transport_type=server.transport_type.value,
                status=server.status.value,
                session_id=server.session_id,
                created_at=server.created_at,
                last_connected_at=server.last_connected_at,
                tool_count=len(server.tools),
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to connect to server",
            )
    except Exception as e:
        logger.error(f"Error connecting to server {server_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect: {str(e)}",
        )


@router.post("/{server_id}/disconnect", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_server_endpoint(
    server_id: str, db: AsyncSession = Depends(get_db)
) -> None:
    """Manually disconnect from a server."""
    result = await db.execute(
        select(OnboardedServer).where(OnboardedServer.id == server_id)
    )
    server = result.scalar_one_or_none()

    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Server not found"
        )

    # Disconnect
    southbound_manager.set_db_session(db)
    await southbound_manager.disconnect_server(server_id)
