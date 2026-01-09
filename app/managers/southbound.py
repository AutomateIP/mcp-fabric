"""Modern Southbound Manager using FastMCP Client."""

import uuid
from typing import Any, Optional
from datetime import datetime

from fastmcp import Client
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core.logging import get_logger
from app.models.server import OnboardedServer, ServerStatus, TransportType
from app.models.tool import Tool
from app.managers.transports import ModernTransportFactory
from app.utils.mcp_sanitizer import sanitize_mcp_tool_response

logger = get_logger("southbound")


class ServerConnection:
    """Represents a connection to an MCP server using FastMCP Client."""

    def __init__(self, server: OnboardedServer):
        """Initialize server connection."""
        self.server = server
        self.client: Optional[Client] = None
        self.is_connected = False
        self.reconnect_attempts = 0

    async def connect(self) -> bool:
        """Connect to MCP server using FastMCP Client."""
        try:
            # Create FastMCP Client with appropriate transport
            self.client = ModernTransportFactory.create_client(
                self.server.transport_type,
                self.server.connection_config
            )

            # Connect using async context manager pattern
            await self.client.__aenter__()

            self.is_connected = True
            self.reconnect_attempts = 0

            logger.info(
                f"Connected to {self.server.transport_type.value} server: {self.server.name}",
                extra={"server_id": self.server.id},
            )
            return True

        except Exception as e:
            logger.error(
                f"Failed to connect to server {self.server.name}: {e}",
                extra={"server_id": self.server.id},
                exc_info=True,
            )
            return False

    async def disconnect(self) -> None:
        """Disconnect from MCP server."""
        try:
            if self.client:
                await self.client.__aexit__(None, None, None)
                self.client = None

            self.is_connected = False
            logger.info(
                f"Disconnected from server: {self.server.name}",
                extra={"server_id": self.server.id},
            )

        except Exception as e:
            logger.error(
                f"Error disconnecting from server {self.server.name}: {e}",
                extra={"server_id": self.server.id},
                exc_info=True,
            )

    async def list_tools(self) -> list[dict[str, Any]]:
        """List all tools available from this server using FastMCP Client."""
        if not self.is_connected or not self.client:
            raise RuntimeError(f"Server {self.server.name} is not connected")

        try:
            # Use FastMCP Client's list_tools method
            tools = await self.client.list_tools()

            # Convert to dict format
            return [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "input_schema": tool.inputSchema,  # MCP uses camelCase
                }
                for tool in tools
            ]

        except Exception as e:
            logger.error(
                f"Failed to list tools from {self.server.name}: {e}",
                extra={"server_id": self.server.id},
                exc_info=True,
            )
            raise

    async def call_tool(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        """Call a tool on this server using FastMCP Client."""
        if not self.is_connected or not self.client:
            raise RuntimeError(f"Server {self.server.name} is not connected")

        try:
            logger.info(
                f"Calling tool {tool_name} on server {self.server.name}",
                extra={"server_id": self.server.id, "tool_name": tool_name},
            )

            # Use FastMCP Client's call_tool method
            result = await self.client.call_tool(tool_name, arguments)

            # Log the result type and structure for debugging
            logger.debug(
                f"Tool call result type: {type(result)}, "
                f"has __dict__: {hasattr(result, '__dict__')}"
            )

            # Sanitize the response to ensure MCP protocol compliance
            # This fixes issues like annotations: null which violate the spec
            sanitized_result = sanitize_mcp_tool_response(result)

            logger.info(
                f"Tool call completed - returning sanitized result",
                extra={
                    "server_id": self.server.id,
                    "tool_name": tool_name,
                    "result_type": str(type(sanitized_result)),
                    "result_length": len(sanitized_result) if isinstance(sanitized_result, list) else "N/A"
                }
            )

            return sanitized_result

        except Exception as e:
            logger.error(
                f"Failed to call tool {tool_name} on {self.server.name}: {e}",
                extra={"server_id": self.server.id, "tool_name": tool_name},
                exc_info=True,
            )
            raise


class ModernSouthboundManager:
    """Manages all southbound MCP server connections using FastMCP Client."""

    def __init__(self):
        """Initialize southbound manager."""
        self.connections: dict[str, ServerConnection] = {}
        self.db_session: Optional[AsyncSession] = None

    def set_db_session(self, session: AsyncSession) -> None:
        """Set database session."""
        self.db_session = session

    async def connect_server(self, server: OnboardedServer, db: AsyncSession) -> bool:
        """Connect to a server and add to managed connections."""
        if server.id in self.connections:
            logger.warning(
                f"Server {server.name} already connected",
                extra={"server_id": server.id},
            )
            return True

        connection = ServerConnection(server)

        # Connect using FastMCP Client
        success = await connection.connect()

        if success:
            self.connections[server.id] = connection

            # Update server status in database
            server.status = ServerStatus.CONNECTED
            server.last_connected_at = datetime.utcnow()
            db.add(server)
            await db.commit()

            return True

        return False

    async def disconnect_server(self, server_id: str) -> None:
        """Disconnect from a server."""
        connection = self.connections.get(server_id)
        if not connection:
            logger.warning(f"Server {server_id} not found in connections")
            return

        await connection.disconnect()
        del self.connections[server_id]

        # Update server status in database
        if self.db_session:
            result = await self.db_session.execute(
                select(OnboardedServer).where(OnboardedServer.id == server_id)
            )
            server = result.scalar_one_or_none()
            if server:
                server.status = ServerStatus.DISCONNECTED
                self.db_session.add(server)
                await self.db_session.commit()

    async def discover_tools(self, server_id: str, db: AsyncSession) -> list[Tool]:
        """Discover tools from a server and save to database."""
        connection = self.connections.get(server_id)
        if not connection:
            raise ValueError(f"Server {server_id} not connected")

        # Get existing tools for this server
        result = await db.execute(
            select(Tool).where(Tool.source_server_id == server_id)
        )
        existing_tools = {tool.name: tool for tool in result.scalars().all()}

        # Get tools from server using FastMCP Client
        tool_defs = await connection.list_tools()

        # Update or create Tool models
        tools = []
        current_tool_names = set()

        for tool_def in tool_defs:
            tool_name = tool_def["name"]
            current_tool_names.add(tool_name)

            if tool_name in existing_tools:
                # Update existing tool (preserving ID)
                tool = existing_tools[tool_name]
                tool.description = tool_def.get("description")
                tool.input_schema = tool_def.get("input_schema", {})
                tool.source_server_name = connection.server.name
            else:
                # Create new tool
                tool = Tool(
                    id=str(uuid.uuid4()),
                    name=tool_name,
                    description=tool_def.get("description"),
                    input_schema=tool_def.get("input_schema", {}),
                    source_server_id=server_id,
                    source_server_name=connection.server.name,
                )
                db.add(tool)

            tools.append(tool)

        # Remove tools that no longer exist on the server
        for tool_name, tool in existing_tools.items():
            if tool_name not in current_tool_names:
                await db.delete(tool)

        # Commit tools
        await db.commit()

        logger.info(
            f"Discovered {len(tools)} tools from server {connection.server.name}",
            extra={"server_id": server_id},
        )

        return tools

    async def call_tool(
        self, server_id: str, tool_name: str, arguments: dict[str, Any]
    ) -> Any:
        """Call a tool on a specific server."""
        connection = self.connections.get(server_id)
        if not connection:
            raise ValueError(f"Server {server_id} not connected")

        return await connection.call_tool(tool_name, arguments)

    async def disconnect_all(self) -> None:
        """Disconnect from all servers."""
        for server_id in list(self.connections.keys()):
            await self.disconnect_server(server_id)


# Global southbound manager instance
modern_southbound_manager = ModernSouthboundManager()
