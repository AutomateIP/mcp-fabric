"""API routes for server management."""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid
from datetime import datetime

from app.core.database import get_db
from app.api.schemas.server import ServerCreate, ServerUpdate, ServerResponse, ServerStatus
from app.api.schemas.tool import ToolResponse
from app.models.server import OnboardedServer, TransportType, ServerStatus as ServerStatusEnum, InstallationType
from app.managers.southbound import modern_southbound_manager as southbound_manager
from app.managers.git_server import GitServerManager
from app.managers.pip_server import PipServerManager
from app.core.logging import get_logger

router = APIRouter(prefix="/api/servers", tags=["servers"])
logger = get_logger("api.servers")

# Initialize installation managers
git_manager = GitServerManager()
pip_manager = PipServerManager()


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

        # Validate installation type
        installation_type = InstallationType.SYSTEM
        if server_data.installation_type:
            try:
                installation_type = InstallationType(server_data.installation_type)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid installation type: {server_data.installation_type}",
                )

        # Validate git installation requirements
        if installation_type == InstallationType.GIT:
            if not server_data.git_repo_url:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="git_repo_url is required when installation_type is 'git'",
                )

        # Validate pip installation requirements
        if installation_type == InstallationType.PIP:
            if not server_data.pip_package:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="pip_package is required when installation_type is 'pip'",
                )

        # Create server model
        server = OnboardedServer(
            id=str(uuid.uuid4()),
            name=server_data.name,
            description=server_data.description,
            transport_type=transport_type,
            connection_config=server_data.connection_config,
            status=ServerStatusEnum.DISCONNECTED,
            installation_type=installation_type,
            # Git fields
            git_repo_url=server_data.git_repo_url,
            git_branch=server_data.git_branch or "main",
            install_command=server_data.install_command,
            setup_command=server_data.setup_command,
            # Pip fields
            pip_package=server_data.pip_package,
            use_uv=server_data.use_uv or False,
        )

        db.add(server)
        await db.commit()
        await db.refresh(server)

        # If git installation, clone and install
        if installation_type == InstallationType.GIT and server_data.git_repo_url:
            logger.info(f"Installing git-based server {server.name} from {server_data.git_repo_url}")
            server.install_status = "installing"
            await db.commit()

            try:
                install_result = await git_manager.install_server(
                    server_id=server.id,
                    git_url=server_data.git_repo_url,
                    branch=server_data.git_branch or "main",
                    install_command=server_data.install_command,
                    setup_command=server_data.setup_command,
                )

                if install_result.success:
                    server.install_status = "completed"
                    server.installation_path = install_result.path
                    server.install_log = install_result.log
                    server.installed_at = datetime.utcnow()

                    # Get commit SHA
                    if install_result.path:
                        from pathlib import Path
                        repo_path = Path(install_result.path)
                        if (repo_path / ".git").exists():
                            sha_result = await git_manager._get_commit_sha(install_result.path)
                            server.git_commit_sha = sha_result

                    # Update connection_config with detected entry point
                    if install_result.entry_point and transport_type == TransportType.STDIO:
                        # Merge entry point into connection_config
                        server.connection_config = {
                            **server.connection_config,
                            **install_result.entry_point,
                        }

                    logger.info(f"Successfully installed server {server.name} at {install_result.path}")
                else:
                    server.install_status = "failed"
                    server.install_log = install_result.log
                    logger.error(f"Failed to install server {server.name}: {install_result.error}")

                await db.commit()
                await db.refresh(server)

            except Exception as install_error:
                logger.error(f"Error installing server {server.name}: {install_error}", exc_info=True)
                server.install_status = "failed"
                server.install_log = str(install_error)
                await db.commit()
                await db.refresh(server)

        # If pip installation, install package
        if installation_type == InstallationType.PIP and server_data.pip_package:
            logger.info(f"Installing pip-based server {server.name} package: {server_data.pip_package}")
            server.install_status = "installing"
            await db.commit()

            try:
                install_result = await pip_manager.install_server(
                    server_id=server.id,
                    package_name=server_data.pip_package,
                    use_uv=server_data.use_uv or False,
                )

                if install_result.success:
                    server.install_status = "completed"
                    server.installation_path = install_result.path
                    server.install_log = install_result.log
                    server.installed_at = datetime.utcnow()

                    # Update connection_config with detected entry point
                    if install_result.entry_point and transport_type == TransportType.STDIO:
                        # Merge entry point into connection_config
                        server.connection_config = {
                            **server.connection_config,
                            **install_result.entry_point,
                        }

                    logger.info(f"Successfully installed server {server.name} at {install_result.path}")
                else:
                    server.install_status = "failed"
                    server.install_log = install_result.log
                    logger.error(f"Failed to install server {server.name}: {install_result.error}")

                await db.commit()
                await db.refresh(server)

            except Exception as install_error:
                logger.error(f"Error installing server {server.name}: {install_error}", exc_info=True)
                server.install_status = "failed"
                server.install_log = str(install_error)
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
            installation_type=server.installation_type.value if server.installation_type else None,
            git_repo_url=server.git_repo_url,
            git_branch=server.git_branch,
            git_commit_sha=server.git_commit_sha,
            install_command=server.install_command,
            setup_command=server.setup_command,
            install_status=server.install_status,
            installed_at=server.installed_at,
            installation_path=server.installation_path,
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
            installation_type=server.installation_type.value if server.installation_type else None,
            git_repo_url=server.git_repo_url,
            git_branch=server.git_branch,
            git_commit_sha=server.git_commit_sha,
            install_command=server.install_command,
            setup_command=server.setup_command,
            install_status=server.install_status,
            installed_at=server.installed_at,
            installation_path=server.installation_path,
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
        installation_type=server.installation_type.value if server.installation_type else None,
        git_repo_url=server.git_repo_url,
        git_branch=server.git_branch,
        git_commit_sha=server.git_commit_sha,
        install_command=server.install_command,
        setup_command=server.setup_command,
        install_status=server.install_status,
        installed_at=server.installed_at,
        installation_path=server.installation_path,
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

    # Clean up git installation if present
    if server.installation_type == InstallationType.GIT and server.installation_path:
        try:
            await git_manager.uninstall_server(server_id, server.installation_path)
            logger.info(f"Cleaned up git installation for server {server_id}")
        except Exception as e:
            logger.warning(f"Failed to clean up git installation: {e}")

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
            installation_type=server.installation_type.value if server.installation_type else None,
            git_repo_url=server.git_repo_url,
            git_branch=server.git_branch,
            git_commit_sha=server.git_commit_sha,
            install_command=server.install_command,
            setup_command=server.setup_command,
            install_status=server.install_status,
            installed_at=server.installed_at,
            installation_path=server.installation_path,
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
                installation_type=server.installation_type.value if server.installation_type else None,
                git_repo_url=server.git_repo_url,
                git_branch=server.git_branch,
                git_commit_sha=server.git_commit_sha,
                install_command=server.install_command,
                setup_command=server.setup_command,
                install_status=server.install_status,
                installed_at=server.installed_at,
                installation_path=server.installation_path,
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
