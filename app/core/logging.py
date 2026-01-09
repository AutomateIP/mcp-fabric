"""Logging configuration."""

import logging
import sys
import json
from datetime import datetime
from typing import Any
from app.core.config import settings


class JSONFormatter(logging.Formatter):
    """JSON log formatter."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add extra context if available
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "server_id"):
            log_data["server_id"] = record.server_id
        if hasattr(record, "instance_id"):
            log_data["instance_id"] = record.instance_id
        if hasattr(record, "tool_name"):
            log_data["tool_name"] = record.tool_name

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


def setup_logging() -> None:
    """Configure application logging."""
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    # Create handler
    handler = logging.StreamHandler(sys.stdout)

    # Set formatter based on config
    if settings.log_format.lower() == "json":
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

    handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(handler)

    # Configure app logger
    app_logger = logging.getLogger("app")
    app_logger.setLevel(log_level)


def get_logger(name: str) -> logging.Logger:
    """Get logger instance."""
    return logging.getLogger(f"app.{name}")
