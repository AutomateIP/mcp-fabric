"""Main FastAPI application."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import db_manager
from app.core.logging import setup_logging, get_logger
from app.core.background_tasks import health_monitor
from app.api.routes import servers, tools, instances, tags
from app.api import mcp_server
from app.managers.southbound import modern_southbound_manager as southbound_manager
from app.managers.northbound import modern_northbound_manager as northbound_manager
from app.managers.tool_registry import tool_registry

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown."""
    # Startup
    setup_logging()
    logger.info("Starting MCP Gateway...")

    # Initialize database
    await db_manager.initialize()
    await db_manager.create_tables()
    logger.info("Database initialized")

    # Load existing servers and instances
    async for db_session in db_manager.get_session():
        southbound_manager.set_db_session(db_session)
        northbound_manager.set_db_session(db_session)
        tool_registry.set_db_session(db_session)

        # Start health monitoring
        await health_monitor.start(db_session)

        # Reconnect to existing servers on startup
        from sqlalchemy import select
        from app.models import OnboardedServer, NorthboundInstance

        result = await db_session.execute(select(OnboardedServer))
        servers = result.scalars().all()

        for server in servers:
            logger.info(f"Reconnecting to server: {server.name}")
            try:
                connected = await southbound_manager.connect_server(server, db_session)
                if connected:
                    # Discover tools after successful connection
                    logger.info(f"Discovering tools from {server.name}")
                    await southbound_manager.discover_tools(server.id, db_session)
            except Exception as e:
                logger.error(f"Failed to reconnect to server {server.name}: {e}")

        # Load and register existing instances
        from sqlalchemy.orm import selectinload
        result = await db_session.execute(
            select(NorthboundInstance).options(
                selectinload(NorthboundInstance.tools),
                selectinload(NorthboundInstance.tags)
            )
        )
        instances = result.scalars().all()

        for instance in instances:
            logger.info(f"Registering instance: {instance.name}")
            try:
                await northbound_manager.register_instance(instance)
            except Exception as e:
                logger.error(f"Failed to register instance {instance.name}: {e}")

        break

    logger.info("MCP Gateway started successfully")

    yield

    # Shutdown
    logger.info("Shutting down MCP Gateway...")
    await health_monitor.stop()
    await southbound_manager.disconnect_all()
    await db_manager.close()
    logger.info("MCP Gateway shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="MCP Gateway",
    description="Intelligent intermediary for managing multiple MCP servers",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(servers.router)
app.include_router(tools.router)
app.include_router(instances.router)
app.include_router(tags.router)
app.include_router(mcp_server.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "MCP Gateway",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected" if db_manager.engine else "disconnected",
        "southbound_servers": len(southbound_manager.connections),
        "northbound_instances": len(northbound_manager.active_instances),
    }


@app.get("/api/stats")
async def get_stats():
    """Get system statistics."""
    async for db_session in db_manager.get_session():
        from sqlalchemy import select, func
        from app.models import OnboardedServer, Tool, NorthboundInstance, Tag
        from app.models.server import ServerStatus

        # Count servers
        result = await db_session.execute(select(func.count()).select_from(OnboardedServer))
        total_servers = result.scalar()

        # Count connected servers
        result = await db_session.execute(
            select(func.count())
            .select_from(OnboardedServer)
            .where(OnboardedServer.status == ServerStatus.CONNECTED)
        )
        connected_servers = result.scalar()

        # Count tools
        result = await db_session.execute(select(func.count()).select_from(Tool))
        total_tools = result.scalar()

        # Count instances
        result = await db_session.execute(select(func.count()).select_from(NorthboundInstance))
        total_instances = result.scalar()

        # Count tags
        result = await db_session.execute(select(func.count()).select_from(Tag))
        total_tags = result.scalar()

        return {
            "total_servers": total_servers,
            "connected_servers": connected_servers,
            "total_tools": total_tools,
            "total_instances": total_instances,
            "total_tags": total_tags,
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.server_host,
        port=settings.server_port,
        reload=True,
    )
