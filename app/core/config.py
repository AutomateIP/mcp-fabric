"""Application configuration."""

from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import yaml
from pathlib import Path


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Server settings
    server_host: str = Field(default="0.0.0.0", alias="SERVER_HOST")
    server_port: int = Field(default=8000, alias="SERVER_PORT")
    base_url: str = Field(default="http://localhost:8000", alias="BASE_URL")

    # Database settings
    database_url: str = Field(
        default="sqlite+aiosqlite:///./mcp_gateway.db", alias="DATABASE_URL"
    )

    # Security settings
    encryption_key: str = Field(
        default="default-dev-key-change-in-production", alias="ENCRYPTION_KEY"
    )
    api_key_required: bool = Field(default=False, alias="API_KEY_REQUIRED")

    # Logging settings
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_format: str = Field(default="json", alias="LOG_FORMAT")

    # Southbound settings
    connection_timeout: int = Field(default=30, alias="CONNECTION_TIMEOUT")
    health_check_interval: int = Field(default=60, alias="HEALTH_CHECK_INTERVAL")
    max_reconnect_attempts: int = Field(default=5, alias="MAX_RECONNECT_ATTEMPTS")
    reconnect_backoff_base: int = Field(default=2, alias="RECONNECT_BACKOFF_BASE")

    # Northbound settings
    instance_path_prefix: str = Field(default="/mcp/instances", alias="INSTANCE_PATH_PREFIX")
    tool_invocation_timeout: int = Field(default=120, alias="TOOL_INVOCATION_TIMEOUT")

    @classmethod
    def load_from_yaml(cls, config_path: str = "config.yaml") -> "Settings":
        """Load settings from YAML file and environment variables."""
        config_file = Path(config_path)
        if config_file.exists():
            with open(config_file, "r") as f:
                config_data = yaml.safe_load(f)

            # Flatten nested config for pydantic
            flat_config = {}
            if "server" in config_data:
                flat_config["server_host"] = config_data["server"].get("host", "0.0.0.0")
                flat_config["server_port"] = config_data["server"].get("port", 8000)
                flat_config["base_url"] = config_data["server"].get(
                    "base_url", "http://localhost:8000"
                )

            if "database" in config_data:
                flat_config["database_url"] = config_data["database"].get(
                    "url", "sqlite+aiosqlite:///./mcp_gateway.db"
                )

            if "logging" in config_data:
                flat_config["log_level"] = config_data["logging"].get("level", "INFO")
                flat_config["log_format"] = config_data["logging"].get("format", "json")

            if "southbound" in config_data:
                flat_config["connection_timeout"] = config_data["southbound"].get(
                    "connection_timeout", 30
                )
                flat_config["health_check_interval"] = config_data["southbound"].get(
                    "health_check_interval", 60
                )
                flat_config["max_reconnect_attempts"] = config_data["southbound"].get(
                    "max_reconnect_attempts", 5
                )
                flat_config["reconnect_backoff_base"] = config_data["southbound"].get(
                    "reconnect_backoff_base", 2
                )

            if "northbound" in config_data:
                flat_config["instance_path_prefix"] = config_data["northbound"].get(
                    "instance_path_prefix", "/mcp/instances"
                )
                flat_config["tool_invocation_timeout"] = config_data["northbound"].get(
                    "tool_invocation_timeout", 120
                )

            if "security" in config_data:
                flat_config["encryption_key"] = config_data["security"].get(
                    "encryption_key", "default-dev-key-change-in-production"
                )
                flat_config["api_key_required"] = config_data["security"].get(
                    "api_key_required", False
                )

            return cls(**flat_config)

        return cls()


# Global settings instance
settings = Settings.load_from_yaml()
