"""Modern transport implementations using FastMCP Client."""

from typing import Any, Optional
from fastmcp import Client
from fastmcp.client.transports import StdioTransport, StreamableHttpTransport
from fastmcp.client.auth import BearerAuth

from app.core.logging import get_logger
from app.models.server import TransportType

logger = get_logger("transports")


class ModernTransportFactory:
    """Factory for creating FastMCP Client instances with appropriate transports."""

    @staticmethod
    def create_client(
        transport_type: TransportType,
        config: dict[str, Any]
    ) -> Client:
        """Create a FastMCP Client instance based on transport type and config.

        Args:
            transport_type: Type of transport (STDIO or STREAMABLE_HTTP)
            config: Configuration dict with transport-specific parameters

        Returns:
            Configured FastMCP Client instance
        """
        if transport_type == TransportType.STDIO:
            # Create STDIO transport
            command = config["command"]
            args = config.get("args", [])
            env = config.get("env")

            logger.info(f"Creating STDIO client: {command} {' '.join(args)}")

            transport = StdioTransport(
                command=command,
                args=args,
                env=env
            )
            return Client(transport)

        elif transport_type == TransportType.STREAMABLE_HTTP:
            # Create HTTP transport
            url = config["url"]
            headers = config.get("headers", {})

            logger.info(f"Creating HTTP client for: {url}")

            # Check if Bearer auth is in headers
            auth = None
            if "Authorization" in headers and headers["Authorization"].startswith("Bearer "):
                token = headers["Authorization"].replace("Bearer ", "")
                auth = token  # StreamableHttpTransport accepts token string directly
                # Remove from headers since auth is handled separately
                headers = {k: v for k, v in headers.items() if k != "Authorization"}

            # Create transport with auth if present
            if auth:
                transport = StreamableHttpTransport(
                    url=url,
                    auth=auth,
                    headers=headers if headers else None
                )
            else:
                transport = StreamableHttpTransport(
                    url=url,
                    headers=headers if headers else None
                )

            return Client(transport)
        else:
            raise ValueError(f"Unsupported transport type: {transport_type}")
