"""MCP Content Models.

Properly constructed MCP content models that comply with the protocol specification.
These models ensure that optional fields like 'annotations' are only included when
they have valid values, not when they're None.
"""

from typing import Any, Optional, Dict
from pydantic import BaseModel, Field


class TextContent(BaseModel):
    """MCP Text Content - compliant with protocol specification."""
    type: str = "text"
    text: str
    # Note: annotations is omitted if None, which is protocol-compliant

    class Config:
        # Exclude None values from serialization
        exclude_none = True

    def model_dump(self, **kwargs):
        """Override to always exclude None values."""
        kwargs['exclude_none'] = True
        return super().model_dump(**kwargs)


def create_text_content(text: str, annotations: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Create a text content item that's MCP protocol compliant.

    Args:
        text: The text content
        annotations: Optional annotations object (not included if None)

    Returns:
        Dictionary representation of text content without null fields
    """
    content = {
        "type": "text",
        "text": text
    }

    # Only include annotations if it's a valid object
    if annotations is not None and isinstance(annotations, dict):
        content["annotations"] = annotations

    return content
