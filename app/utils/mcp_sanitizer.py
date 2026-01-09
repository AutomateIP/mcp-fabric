"""MCP Response Sanitizer.

This module provides utilities to sanitize MCP tool responses to ensure they
comply with the MCP protocol specification, particularly handling the common
issue where southbound servers return `annotations: null` instead of omitting
the field or providing a valid object.
"""

from typing import Any, Dict, List, Union
from app.core.logging import get_logger
from mcp.types import TextContent, ImageContent, EmbeddedResource

logger = get_logger("mcp_sanitizer")


def clean_dict(d: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively clean a dictionary by removing keys with None values.

    Args:
        d: Dictionary to clean

    Returns:
        Cleaned dictionary without None values
    """
    if not isinstance(d, dict):
        return d

    cleaned = {}
    for key, value in d.items():
        if value is None:
            # Skip None values
            continue
        elif isinstance(value, dict):
            # Recursively clean nested dicts
            cleaned[key] = clean_dict(value)
        elif isinstance(value, list):
            # Recursively clean lists
            cleaned[key] = [clean_dict(item) if isinstance(item, dict) else item for item in value]
        else:
            cleaned[key] = value

    return cleaned


def model_to_dict(obj: Any, exclude_none: bool = True) -> Any:
    """Convert Pydantic models to dictionaries recursively."""
    if hasattr(obj, 'model_dump'):
        # Pydantic v2 - use exclude_none to omit None values
        return obj.model_dump(exclude_none=exclude_none)
    elif hasattr(obj, 'dict'):
        # Pydantic v1
        return obj.dict(exclude_none=exclude_none)
    elif isinstance(obj, list):
        return [model_to_dict(item, exclude_none=exclude_none) for item in obj]
    elif isinstance(obj, dict):
        if exclude_none:
            return clean_dict(obj)
        return {k: model_to_dict(v, exclude_none=exclude_none) for k, v in obj.items()}
    else:
        return obj


def dict_to_content_object(item_dict: Dict[str, Any]) -> Union[TextContent, ImageContent, EmbeddedResource, Dict[str, Any]]:
    """
    Convert a cleaned dict back to proper MCP content object.

    Args:
        item_dict: Cleaned dictionary representing a content item

    Returns:
        Proper MCP content object (TextContent, ImageContent, etc.)
    """
    content_type = item_dict.get('type')

    try:
        if content_type == 'text':
            # Create TextContent object, only including non-None fields
            return TextContent(
                type='text',
                text=item_dict.get('text', ''),
                # annotations and meta will be None if not in item_dict, which is fine
                # They'll be excluded when model_dump(exclude_none=True) is called
            )
        elif content_type == 'image':
            return ImageContent(
                type='image',
                data=item_dict.get('data', ''),
                mimeType=item_dict.get('mimeType', 'image/png')
            )
        elif content_type == 'resource':
            return EmbeddedResource(
                type='resource',
                resource=item_dict.get('resource', {})
            )
        else:
            # For unknown types, return the dict as-is
            logger.warning(f"Unknown content type: {content_type}, returning dict")
            return item_dict
    except Exception as e:
        logger.error(f"Failed to create content object from dict: {e}")
        return item_dict


def sanitize_mcp_tool_response(response: Any) -> Union[str, List[Union[TextContent, ImageContent, EmbeddedResource, Dict[str, Any]]]]:
    """
    Sanitize an MCP tool response to ensure protocol compliance.

    This function handles the common case where southbound MCP servers return
    responses with `annotations: null` which violates the MCP protocol specification.

    Args:
        response: The raw response from a southbound MCP server tool call
                 (could be CallToolResult, Pydantic models, dicts, or lists)

    Returns:
        Sanitized response list with protocol violations fixed (no None values)
    """
    logger.info(f"Sanitizing MCP tool response of type: {type(response)}")

    # Handle FastMCP Client's CallToolResult (dataclass)
    if type(response).__name__ == 'CallToolResult':
        logger.info("Detected CallToolResult from FastMCP Client")
        # Extract the content list from CallToolResult
        content_list = response.content if hasattr(response, 'content') else []
        logger.info(f"Extracted {len(content_list)} content items from CallToolResult")

        # Convert content items to dicts and clean them
        response_dict = []
        for item in content_list:
            if hasattr(item, 'model_dump'):
                # Content items are Pydantic models - convert with exclude_none
                item_dict = item.model_dump(exclude_none=True)
                logger.info(f"Converted content item to dict: {item_dict.get('type', 'unknown')}")
            elif hasattr(item, 'dict'):
                item_dict = item.dict(exclude_none=True)
                logger.info(f"Converted content item (v1) to dict: {item_dict.get('type', 'unknown')}")
            elif isinstance(item, dict):
                item_dict = item
            else:
                # Try to access __dict__ if it's a dataclass
                item_dict = item.__dict__ if hasattr(item, '__dict__') else item

            # Clean the dict to remove None values
            if isinstance(item_dict, dict):
                response_dict.append(clean_dict(item_dict))
            else:
                response_dict.append(item_dict)
    # Convert Pydantic models to dicts, excluding None values
    elif hasattr(response, 'model_dump') or hasattr(response, 'dict'):
        response_dict = model_to_dict(response, exclude_none=True)
        logger.info("Converted Pydantic model to dict with exclude_none=True")
    elif isinstance(response, list):
        # Handle list of Pydantic models or dicts
        response_dict = [model_to_dict(item, exclude_none=True) for item in response]
        logger.info(f"Converted list of {len(response)} items")
    elif isinstance(response, dict):
        # Clean the dict
        response_dict = clean_dict(response)
        logger.info("Cleaned dict by removing None values")
    else:
        logger.warning(f"Unexpected response type: {type(response)}, returning as list")
        return [response]

    # Ensure we return a list
    if not isinstance(response_dict, list):
        response_dict = [response_dict] if response_dict else []

    # Final pass: ensure no None values and reconstruct proper content objects
    sanitized_response = []
    for item in response_dict:
        if isinstance(item, dict):
            cleaned_item = clean_dict(item)
            # Convert cleaned dict back to proper MCP content object
            content_object = dict_to_content_object(cleaned_item)
            sanitized_response.append(content_object)
            logger.info(f"Sanitized item of type: {cleaned_item.get('type', 'unknown')}")
        else:
            sanitized_response.append(item)

    logger.info(f"Sanitization complete, returning {len(sanitized_response)} content objects")
    return sanitized_response
