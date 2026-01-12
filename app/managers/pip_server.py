"""Pip-based MCP server installation manager."""

import asyncio
import logging
import os
import shutil
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.server import OnboardedServer, InstallationType

logger = logging.getLogger(__name__)


@dataclass
class InstallResult:
    """Result of server installation."""

    success: bool
    path: Optional[str] = None
    entry_point: Optional[dict] = None
    error: Optional[str] = None
    log: str = ""


class PipServerManager:
    """Manages pip/uv-based MCP server installations."""

    def __init__(self, workspace_dir: str = "/app/mcp-servers"):
        """Initialize pip server manager.

        Args:
            workspace_dir: Base directory for pip-installed servers
        """
        self.workspace_dir = Path(workspace_dir)
        self.workspace_dir.mkdir(parents=True, exist_ok=True)

    async def install_server(
        self,
        server_id: str,
        package_name: str,
        use_uv: bool = False,
    ) -> InstallResult:
        """Install an MCP server using pip or uv.

        Args:
            server_id: Unique server identifier
            package_name: Package name to install (e.g., 'duckduckgo-mcp-server')
            use_uv: Use 'uv pip install' instead of 'pip install'

        Returns:
            InstallResult with installation details
        """
        log_lines = []

        try:
            # Create virtual environment directory for this server
            venv_path = self.workspace_dir / server_id
            if venv_path.exists():
                log_lines.append(f"Removing existing installation at {venv_path}")
                shutil.rmtree(venv_path)

            venv_path.mkdir(parents=True, exist_ok=True)
            log_lines.append(f"Created installation directory: {venv_path}")

            # Determine install command
            if use_uv:
                # Use uv pip install (faster alternative to pip)
                install_cmd = ["uv", "pip", "install", package_name, "--target", str(venv_path)]
                log_lines.append(f"Installing with uv: uv pip install {package_name}")
            else:
                # Use standard pip install
                install_cmd = ["pip", "install", package_name, "--target", str(venv_path)]
                log_lines.append(f"Installing with pip: pip install {package_name}")

            # Execute installation
            process = await asyncio.create_subprocess_exec(
                *install_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=str(self.workspace_dir),
            )

            stdout, _ = await process.communicate()
            output = stdout.decode() if stdout else ""
            log_lines.append(output)

            if process.returncode != 0:
                return InstallResult(
                    success=False,
                    error=f"Installation failed with exit code {process.returncode}",
                    log="\n".join(log_lines),
                )

            log_lines.append("Installation completed successfully")

            # Try to detect the entry point
            entry_point = await self._detect_entry_point(venv_path, package_name)

            if entry_point:
                log_lines.append(f"Detected entry point: {entry_point}")
            else:
                log_lines.append("Warning: Could not auto-detect entry point")

            return InstallResult(
                success=True,
                path=str(venv_path),
                entry_point=entry_point,
                log="\n".join(log_lines),
            )

        except Exception as e:
            logger.exception(f"Error installing pip package {package_name}")
            return InstallResult(
                success=False,
                error=str(e),
                log="\n".join(log_lines),
            )

    async def _detect_entry_point(
        self, install_path: Path, package_name: str
    ) -> Optional[dict]:
        """Attempt to detect the entry point for the installed package.

        Args:
            install_path: Path where package was installed
            package_name: Name of the installed package

        Returns:
            Dict with 'command', 'args', and 'env' if detected, None otherwise
        """
        try:
            # Common patterns for MCP server packages
            # Most MCP servers have a __main__.py that can be executed with python -m

            # Environment variables needed for --target installations
            # PYTHONPATH must include the installation directory
            env = {
                "PYTHONPATH": str(install_path)
            }

            # Try to find package directory
            package_dir_name = package_name.replace("-", "_")
            package_dir = install_path / package_dir_name

            if package_dir.exists() and (package_dir / "__main__.py").exists():
                # Can be run with: python -m package_name
                return {
                    "command": "python",
                    "args": ["-m", package_dir_name],
                    "env": env
                }

            # Check for bin directory (common with console scripts)
            bin_dir = install_path / "bin"
            if bin_dir.exists():
                # Look for executable with package name
                executable = bin_dir / package_name
                if executable.exists():
                    return {
                        "command": str(executable),
                        "args": [],
                        "env": env
                    }

            # Fallback: Try common script names
            for script_name in [package_name, package_dir_name, "server", "main"]:
                script_path = bin_dir / script_name if bin_dir.exists() else None
                if script_path and script_path.exists():
                    return {
                        "command": str(script_path),
                        "args": [],
                        "env": env
                    }

            # Could not detect - user will need to configure manually
            return None

        except Exception as e:
            logger.warning(f"Error detecting entry point: {e}")
            return None

    async def uninstall_server(self, server_id: str) -> bool:
        """Uninstall a pip-installed server.

        Args:
            server_id: Server identifier

        Returns:
            True if successful, False otherwise
        """
        try:
            venv_path = self.workspace_dir / server_id
            if venv_path.exists():
                shutil.rmtree(venv_path)
                logger.info(f"Uninstalled server: {server_id}")
                return True
            return False
        except Exception as e:
            logger.exception(f"Error uninstalling server {server_id}")
            return False
