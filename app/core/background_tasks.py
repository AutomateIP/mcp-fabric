"""Background tasks for monitoring and maintenance."""

import asyncio
from datetime import datetime, timedelta
from typing import Optional

from app.core.logging import get_logger
from app.core.config import settings
from app.managers.southbound import modern_southbound_manager as southbound_manager
from app.models.server import ServerStatus
from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger("background_tasks")


class HealthMonitor:
    """Monitors health of southbound server connections."""

    def __init__(self):
        """Initialize health monitor."""
        self.running = False
        self.task: Optional[asyncio.Task] = None

    async def start(self, db_session: AsyncSession) -> None:
        """Start health monitoring."""
        if self.running:
            logger.warning("Health monitor already running")
            return

        self.running = True
        southbound_manager.set_db_session(db_session)
        self.task = asyncio.create_task(self._monitor_loop())
        logger.info("Health monitor started")

    async def stop(self) -> None:
        """Stop health monitoring."""
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Health monitor stopped")

    async def _monitor_loop(self) -> None:
        """Main monitoring loop."""
        interval = settings.health_check_interval

        while self.running:
            try:
                await self._check_connections()
                await asyncio.sleep(interval)
            except Exception as e:
                logger.error(f"Error in health monitor loop: {e}", exc_info=True)
                await asyncio.sleep(10)  # Short sleep on error

    async def _check_connections(self) -> None:
        """Check all server connections."""
        for server_id, connection in list(southbound_manager.connections.items()):
            try:
                if not connection.is_connected:
                    logger.warning(
                        f"Server {connection.server.name} not connected, attempting reconnect",
                        extra={"server_id": server_id},
                    )
                    await self._attempt_reconnect(connection)
                else:
                    # Ping the server to verify connection
                    await self._ping_server(connection)

            except Exception as e:
                logger.error(
                    f"Error checking server {server_id}: {e}",
                    extra={"server_id": server_id},
                    exc_info=True,
                )

    async def _attempt_reconnect(self, connection) -> None:
        """Attempt to reconnect to a server."""
        if connection.reconnect_attempts >= settings.max_reconnect_attempts:
            logger.error(
                f"Max reconnect attempts reached for {connection.server.name}",
                extra={"server_id": connection.server.id},
            )
            return

        # Exponential backoff
        wait_time = settings.reconnect_backoff_base ** connection.reconnect_attempts
        await asyncio.sleep(wait_time)

        connection.reconnect_attempts += 1
        success = await connection.connect()

        if success:
            logger.info(
                f"Successfully reconnected to {connection.server.name}",
                extra={"server_id": connection.server.id},
            )
            # Rediscover tools after reconnection
            if southbound_manager.db_session:
                await southbound_manager.discover_tools(connection.server.id, southbound_manager.db_session)
        else:
            logger.warning(
                f"Reconnect attempt {connection.reconnect_attempts} failed for {connection.server.name}",
                extra={"server_id": connection.server.id},
            )

    async def _ping_server(self, connection) -> None:
        """Ping server to verify it's alive."""
        try:
            if connection.client:
                # Try to list tools as a health check
                await connection.list_tools()
        except Exception as e:
            logger.warning(
                f"Health check failed for {connection.server.name}: {e}",
                extra={"server_id": connection.server.id},
            )
            connection.is_connected = False


# Global health monitor instance
health_monitor = HealthMonitor()
