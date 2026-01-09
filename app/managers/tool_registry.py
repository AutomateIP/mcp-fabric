"""Tool Registry - Manages the catalog of all available tools."""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger
from app.models.tool import Tool
from app.models.tag import Tag
from app.models.server import OnboardedServer


logger = get_logger("tool_registry")


class ToolRegistry:
    """Manages the catalog of all available tools."""

    def __init__(self):
        """Initialize tool registry."""
        self.db_session: Optional[AsyncSession] = None

    def set_db_session(self, session: AsyncSession) -> None:
        """Set database session."""
        self.db_session = session

    async def get_all_tools(
        self,
        server_id: Optional[str] = None,
        tag_ids: Optional[list[str]] = None,
        search_term: Optional[str] = None,
    ) -> list[Tool]:
        """Get all tools with optional filters."""
        if not self.db_session:
            raise RuntimeError("Database session not set")

        query = select(Tool).options(
            selectinload(Tool.source_server), selectinload(Tool.tags)
        )

        # Apply filters
        filters = []
        if server_id:
            filters.append(Tool.source_server_id == server_id)

        if search_term:
            search_pattern = f"%{search_term}%"
            filters.append(
                or_(
                    Tool.name.ilike(search_pattern),
                    Tool.description.ilike(search_pattern),
                )
            )

        if filters:
            query = query.where(and_(*filters))

        # Filter by tags if specified
        if tag_ids:
            query = query.join(Tool.tags).where(Tag.id.in_(tag_ids))

        result = await self.db_session.execute(query)
        tools = result.scalars().unique().all()

        logger.info(f"Retrieved {len(tools)} tools from registry")
        return list(tools)

    async def get_tool_by_id(self, tool_id: str) -> Optional[Tool]:
        """Get a specific tool by ID."""
        if not self.db_session:
            raise RuntimeError("Database session not set")

        result = await self.db_session.execute(
            select(Tool)
            .where(Tool.id == tool_id)
            .options(selectinload(Tool.source_server), selectinload(Tool.tags))
        )
        return result.scalar_one_or_none()

    async def get_tools_by_ids(self, tool_ids: list[str]) -> list[Tool]:
        """Get multiple tools by their IDs."""
        if not self.db_session:
            raise RuntimeError("Database session not set")

        result = await self.db_session.execute(
            select(Tool)
            .where(Tool.id.in_(tool_ids))
            .options(selectinload(Tool.source_server), selectinload(Tool.tags))
        )
        return list(result.scalars().unique().all())

    async def get_tool_by_name_and_server(
        self, tool_name: str, server_id: str
    ) -> Optional[Tool]:
        """Get a tool by name and server."""
        if not self.db_session:
            raise RuntimeError("Database session not set")

        result = await self.db_session.execute(
            select(Tool).where(
                and_(Tool.name == tool_name, Tool.source_server_id == server_id)
            )
        )
        return result.scalar_one_or_none()

    async def add_tags_to_tool(self, tool_id: str, tag_ids: list[str]) -> Tool:
        """Add tags to a tool."""
        if not self.db_session:
            raise RuntimeError("Database session not set")

        # Get the tool
        tool = await self.get_tool_by_id(tool_id)
        if not tool:
            raise ValueError(f"Tool {tool_id} not found")

        # Get the tags
        result = await self.db_session.execute(select(Tag).where(Tag.id.in_(tag_ids)))
        tags = result.scalars().all()

        # Add tags to tool
        for tag in tags:
            if tag not in tool.tags:
                tool.tags.append(tag)

        await self.db_session.commit()
        await self.db_session.refresh(tool)

        logger.info(
            f"Added {len(tags)} tags to tool {tool.name}",
            extra={"tool_name": tool.name},
        )

        return tool

    async def remove_tag_from_tool(self, tool_id: str, tag_id: str) -> Tool:
        """Remove a tag from a tool."""
        if not self.db_session:
            raise RuntimeError("Database session not set")

        # Get the tool
        tool = await self.get_tool_by_id(tool_id)
        if not tool:
            raise ValueError(f"Tool {tool_id} not found")

        # Remove the tag
        tool.tags = [tag for tag in tool.tags if tag.id != tag_id]

        await self.db_session.commit()
        await self.db_session.refresh(tool)

        logger.info(
            f"Removed tag from tool {tool.name}", extra={"tool_name": tool.name}
        )

        return tool

    async def get_tools_by_server(self, server_id: str) -> list[Tool]:
        """Get all tools from a specific server."""
        if not self.db_session:
            raise RuntimeError("Database session not set")

        result = await self.db_session.execute(
            select(Tool)
            .where(Tool.source_server_id == server_id)
            .options(selectinload(Tool.tags))
        )
        return list(result.scalars().all())

    async def delete_tools_by_server(self, server_id: str) -> int:
        """Delete all tools from a specific server."""
        if not self.db_session:
            raise RuntimeError("Database session not set")

        tools = await self.get_tools_by_server(server_id)
        count = len(tools)

        for tool in tools:
            await self.db_session.delete(tool)

        await self.db_session.commit()

        logger.info(f"Deleted {count} tools from server", extra={"server_id": server_id})

        return count


# Global tool registry instance
tool_registry = ToolRegistry()
