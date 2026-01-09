"""Northbound MCP server endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
import json

from app.core.database import get_db
from app.core.logging import get_logger
from app.managers.northbound import modern_northbound_manager as northbound_manager
from app.managers.southbound import modern_southbound_manager as southbound_manager

logger = get_logger("mcp_server")

router = APIRouter(prefix="/mcp/instances", tags=["mcp-protocol"])


@router.post("/{instance_id}")
async def mcp_instance_endpoint(
    instance_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Response:
    """
    MCP protocol endpoint for a specific instance.

    This endpoint handles MCP JSON-RPC requests from agents.
    """
    # Set database sessions
    northbound_manager.set_db_session(db)
    southbound_manager.set_db_session(db)

    # Check if instance exists and is registered
    if instance_id not in northbound_manager.active_instances:
        raise HTTPException(status_code=404, detail="Instance not found")

    try:
        # Parse JSON-RPC request
        body = await request.json()

        # Handle different MCP methods
        method = body.get("method")
        params = body.get("params", {})
        request_id = body.get("id")

        logger.info(
            f"MCP request: {method}",
            extra={"instance_id": instance_id, "method": method},
        )

        if method == "tools/list":
            # List tools for this instance
            tools = northbound_manager.get_instance_tools(instance_id)

            result = {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "tools": tools
                }
            }

        elif method == "tools/call":
            # Call a tool
            tool_name = params.get("name")
            arguments = params.get("arguments", {})

            if not tool_name:
                raise HTTPException(status_code=400, detail="Missing tool name")

            # Proxy to southbound server
            # The response is already sanitized by southbound manager
            response = await northbound_manager.call_tool(
                instance_id, tool_name, arguments
            )

            # Serialize the MCP response
            # The response can be:
            # - A string (simple text response)
            # - A list of content objects (TextContent, ImageContent, etc.)
            # - A list of dicts (already serialized)
            content_list = []

            if isinstance(response, str):
                # Simple string response - wrap in text content
                content_list.append({"type": "text", "text": response})
            elif isinstance(response, list):
                # List of content items (already sanitized)
                for item in response:
                    # Convert MCP content objects to dicts with exclude_none=True
                    if hasattr(item, 'model_dump'):
                        content_list.append(item.model_dump(exclude_none=True))
                    elif hasattr(item, 'dict'):
                        content_list.append(item.dict(exclude_none=True))
                    elif isinstance(item, dict):
                        content_list.append(item)
                    else:
                        # Fallback: try to convert to dict manually
                        content_list.append({
                            "type": getattr(item, 'type', 'text'),
                            "text": getattr(item, 'text', str(item))
                        })
            elif hasattr(response, 'content'):
                # CallToolResult object (old path, shouldn't happen with sanitizer)
                for item in response.content:
                    if hasattr(item, 'model_dump'):
                        content_list.append(item.model_dump(exclude_none=True))
                    elif hasattr(item, 'dict'):
                        content_list.append(item.dict(exclude_none=True))
                    else:
                        content_list.append({
                            "type": getattr(item, 'type', 'text'),
                            "text": getattr(item, 'text', str(item))
                        })

            result = {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "content": content_list,
                    "isError": False,
                }
            }

        elif method == "initialize":
            # Handle initialization
            result = {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {},
                    },
                    "serverInfo": {
                        "name": "MCP Gateway Instance",
                        "version": "0.1.0",
                    }
                }
            }

        elif method == "ping":
            # Handle ping
            result = {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {}
            }

        else:
            # Unknown method
            result = {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {
                    "code": -32601,
                    "message": f"Method not found: {method}"
                }
            }

        return Response(
            content=json.dumps(result),
            media_type="application/json",
        )

    except Exception as e:
        logger.error(
            f"Error handling MCP request: {e}",
            extra={"instance_id": instance_id},
            exc_info=True,
        )

        error_response = {
            "jsonrpc": "2.0",
            "id": body.get("id") if 'body' in locals() else None,
            "error": {
                "code": -32603,
                "message": f"Internal error: {str(e)}"
            }
        }

        return Response(
            content=json.dumps(error_response),
            media_type="application/json",
            status_code=500,
        )


@router.get("/{instance_id}")
async def mcp_instance_info(
    instance_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Get information about an MCP instance endpoint.

    This is not part of the MCP protocol, but provides
    information about the instance for discovery.
    """
    northbound_manager.set_db_session(db)

    instance = await northbound_manager.get_instance(instance_id)
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    tools = []
    if instance_id in northbound_manager.active_instances:
        tools = northbound_manager.get_instance_tools(instance_id)

    return {
        "instance_id": instance.id,
        "name": instance.name,
        "description": instance.description,
        "tool_count": len(tools),
        "tools": [tool["name"] for tool in tools],
        "endpoint": instance.endpoint_path,
        "protocol": "MCP",
        "transport": "http",
    }
