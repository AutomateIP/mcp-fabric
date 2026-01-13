"""Modern Northbound Manager using FastMCP Server."""

import uuid
from typing import Any, Dict, Optional
from datetime import datetime

from fastmcp import FastMCP
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger
from app.core.config import settings
from app.models.instance import NorthboundInstance
from app.models.tool import Tool
from app.models.tag import Tag
from app.managers.southbound import modern_southbound_manager
from app.utils.mcp_sanitizer import sanitize_mcp_tool_response

logger = get_logger("northbound")


class ModernNorthboundManager:
    """Manages northbound MCP server instances using FastMCP."""

    def __init__(self):
        """Initialize northbound manager."""
        self.db_session: Optional[AsyncSession] = None
        self.active_instances: dict[str, dict[str, Any]] = {}
        self.mcp_servers: dict[str, FastMCP] = {}

    def set_db_session(self, session: AsyncSession) -> None:
        """Set database session."""
        self.db_session = session

    async def create_instance(
        self,
        name: str,
        tool_ids: list[str],
        description: Optional[str] = None,
        transport_type: str = "http",
        tag_ids: Optional[list[str]] = None,
    ) -> NorthboundInstance:
        """Create a new northbound instance with FastMCP server."""
        if not self.db_session:
            raise RuntimeError("Database session not set")

        # Generate instance ID and endpoint path
        instance_id = str(uuid.uuid4())
        endpoint_path = f"{settings.instance_path_prefix}/{instance_id}"

        # Create instance model
        instance = NorthboundInstance(
            id=instance_id,
            name=name,
            description=description,
            transport_type=transport_type,
            endpoint_path=endpoint_path,
        )

        # Add tools
        if tool_ids:
            logger.info(f"Adding tools to instance: {tool_ids}")
            result = await self.db_session.execute(select(Tool).where(Tool.id.in_(tool_ids)))
            tools = result.scalars().all()
            logger.info(f"Found {len(tools)} tools in database")
            instance.tools.extend(tools)
            logger.info(f"Instance now has {len(instance.tools)} tools")

        # Add tags
        if tag_ids:
            result = await self.db_session.execute(select(Tag).where(Tag.id.in_(tag_ids)))
            tags = result.scalars().all()
            instance.tags.extend(tags)

        self.db_session.add(instance)
        await self.db_session.commit()

        # Refresh with eager loading for relationships
        result = await self.db_session.execute(
            select(NorthboundInstance)
            .options(selectinload(NorthboundInstance.tools))
            .options(selectinload(NorthboundInstance.tags))
            .where(NorthboundInstance.id == instance_id)
        )
        instance = result.scalar_one()

        # Register the instance as a FastMCP server
        await self.register_instance(instance, transport_type)

        logger.info(
            f"Created northbound instance: {name} with {len(tool_ids)} tools",
            extra={"instance_id": instance_id},
        )

        return instance

    async def get_instance(self, instance_id: str) -> Optional[NorthboundInstance]:
        """Get an instance by ID."""
        if not self.db_session:
            raise RuntimeError("Database session not set")

        result = await self.db_session.execute(
            select(NorthboundInstance)
            .where(NorthboundInstance.id == instance_id)
            .options(
                selectinload(NorthboundInstance.tools),
                selectinload(NorthboundInstance.tags),
            )
        )
        return result.scalar_one_or_none()

    async def get_all_instances(
        self, tag_ids: Optional[list[str]] = None
    ) -> list[NorthboundInstance]:
        """Get all instances with optional tag filter."""
        if not self.db_session:
            raise RuntimeError("Database session not set")

        query = select(NorthboundInstance).options(
            selectinload(NorthboundInstance.tools),
            selectinload(NorthboundInstance.tags),
        )

        # Filter by tags if specified
        if tag_ids:
            query = query.join(NorthboundInstance.tags).where(Tag.id.in_(tag_ids))

        result = await self.db_session.execute(query)
        return list(result.scalars().unique().all())

    async def update_instance(
        self,
        instance_id: str,
        tool_ids: Optional[list[str]] = None,
        tag_ids: Optional[list[str]] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> NorthboundInstance:
        """Update an instance."""
        if not self.db_session:
            raise RuntimeError("Database session not set")

        instance = await self.get_instance(instance_id)
        if not instance:
            raise ValueError(f"Instance {instance_id} not found")

        # Update basic fields
        if name is not None:
            instance.name = name
        if description is not None:
            instance.description = description

        # Update tools
        if tool_ids is not None:
            result = await self.db_session.execute(select(Tool).where(Tool.id.in_(tool_ids)))
            tools = result.scalars().all()
            instance.tools.clear()
            instance.tools.extend(tools)

        # Update tags
        if tag_ids is not None:
            result = await self.db_session.execute(select(Tag).where(Tag.id.in_(tag_ids)))
            tags = result.scalars().all()
            instance.tags.clear()
            instance.tags.extend(tags)

        instance.updated_at = datetime.utcnow()

        await self.db_session.commit()

        # Refresh with eager loading for relationships
        result = await self.db_session.execute(
            select(NorthboundInstance)
            .options(selectinload(NorthboundInstance.tools))
            .options(selectinload(NorthboundInstance.tags))
            .where(NorthboundInstance.id == instance_id)
        )
        instance = result.scalar_one()

        # Re-register the instance with updated tools
        await self.register_instance(instance, instance.transport_type)

        logger.info(
            f"Updated northbound instance: {instance.name}",
            extra={"instance_id": instance_id},
        )

        return instance

    async def delete_instance(self, instance_id: str) -> None:
        """Delete an instance."""
        if not self.db_session:
            raise RuntimeError("Database session not set")

        instance = await self.get_instance(instance_id)
        if not instance:
            raise ValueError(f"Instance {instance_id} not found")

        # Unregister the instance
        await self.unregister_instance(instance_id)

        # Delete from database
        await self.db_session.delete(instance)
        await self.db_session.commit()

        logger.info(
            f"Deleted northbound instance: {instance.name}",
            extra={"instance_id": instance_id},
        )

    async def register_instance(
        self, instance: NorthboundInstance, transport_type: str = "http"
    ) -> None:
        """Register an instance as a FastMCP server."""
        if transport_type == "stdio":
            # STDIO transport - would launch container here
            # For now, fall back to HTTP until STDIO implementation is complete
            logger.warning(
                f"STDIO transport not yet implemented, falling back to HTTP for instance {instance.name}"
            )
            transport_type = "http"

        # Create a new FastMCP server for this instance
        mcp = FastMCP(name=instance.name or f"Instance-{instance.id[:8]}")

        # Build tool mapping and register tools
        tool_mapping = {}
        for tool in instance.tools:
            tool_mapping[tool.name] = {
                "tool_id": tool.id,
                "server_id": tool.source_server_id,
                "tool_name": tool.name,
                "description": tool.description,
                "inputSchema": tool.input_schema,
            }

            # Create a proxy function for this tool with proper closure
            # FastMCP requires explicit parameters, not **kwargs
            def make_proxy_tool(tool_name: str, tool_schema: dict):
                async def proxy_tool(input_params: Optional[Dict[str, Any]] = None):
                    """Proxy tool call to southbound server."""
                    tool_info = tool_mapping[tool_name]
                    # Pass the input_params as the arguments to the southbound tool
                    # The result is already sanitized by the southbound manager
                    result = await modern_southbound_manager.call_tool(
                        tool_info["server_id"], tool_info["tool_name"], input_params or {}
                    )

                    logger.info(
                        f"Proxy tool result type: {type(result)}, length: {len(result) if isinstance(result, list) else 'N/A'}",
                        extra={"tool_name": tool_name},
                    )

                    return result

                return proxy_tool

            proxy_fn = make_proxy_tool(tool.name, tool.input_schema)

            # Register the tool with FastMCP using the tool decorator pattern
            # FastMCP.tool() can be called as a function with the function object
            mcp.tool(proxy_fn, name=tool.name, description=tool.description)

        # Store the FastMCP server and instance data
        self.mcp_servers[instance.id] = mcp
        self.active_instances[instance.id] = {
            "instance": instance,
            "tool_mapping": tool_mapping,
            "connections": 0,
            "mcp_server": mcp,
        }

        logger.info(
            f"Registered FastMCP instance {instance.name} with {len(tool_mapping)} tools",
            extra={"instance_id": instance.id},
        )

    async def unregister_instance(self, instance_id: str) -> None:
        """Unregister an instance."""
        if instance_id in self.active_instances:
            del self.active_instances[instance_id]
        if instance_id in self.mcp_servers:
            del self.mcp_servers[instance_id]
        logger.info(f"Unregistered instance", extra={"instance_id": instance_id})

    def get_mcp_server(self, instance_id: str) -> Optional[FastMCP]:
        """Get the FastMCP server for an instance."""
        return self.mcp_servers.get(instance_id)

    async def call_tool(self, instance_id: str, tool_name: str, arguments: dict[str, Any]) -> Any:
        """Call a tool through an instance."""
        if instance_id not in self.active_instances:
            raise ValueError(f"Instance {instance_id} not registered")

        instance_data = self.active_instances[instance_id]
        tool_mapping = instance_data["tool_mapping"]

        if tool_name not in tool_mapping:
            raise ValueError(f"Tool {tool_name} not available in instance {instance_id}")

        tool_info = tool_mapping[tool_name]
        server_id = tool_info["server_id"]

        # Call the tool on the southbound server
        logger.info(
            f"Proxying tool call {tool_name} to server {server_id}",
            extra={"instance_id": instance_id, "tool_name": tool_name},
        )

        return await modern_southbound_manager.call_tool(server_id, tool_name, arguments)

    def get_instance_tools(self, instance_id: str) -> list[dict[str, Any]]:
        """Get the list of tools for an instance."""
        if instance_id not in self.active_instances:
            raise ValueError(f"Instance {instance_id} not registered")

        instance_data = self.active_instances[instance_id]
        tool_mapping = instance_data["tool_mapping"]

        return [
            {
                "name": name,
                "description": info["description"],
                "inputSchema": info["inputSchema"],
            }
            for name, info in tool_mapping.items()
        ]


# Global northbound manager instance
modern_northbound_manager = ModernNorthboundManager()
