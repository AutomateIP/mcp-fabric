"""Git-based MCP server installation manager."""

import asyncio
import logging
import os
import shutil
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

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


class GitServerManager:
    """Manages git-based MCP server installations."""

    def __init__(self, workspace_dir: str = "/app/mcp-servers"):
        """Initialize git server manager.

        Args:
            workspace_dir: Base directory for git-cloned servers
        """
        self.workspace_dir = Path(workspace_dir)
        self.workspace_dir.mkdir(parents=True, exist_ok=True)

    async def install_server(
        self,
        server_id: str,
        git_url: str,
        branch: str = "main",
        install_command: Optional[str] = None,
        setup_command: Optional[str] = None,
    ) -> InstallResult:
        """Clone and install an MCP server from git repository.

        Args:
            server_id: Unique server identifier
            git_url: Git repository URL
            branch: Branch to clone (default: main)
            install_command: Command to install dependencies
            setup_command: Command to build/setup the project

        Returns:
            InstallResult with installation details
        """
        log_lines = []

        try:
            # Validate git URL
            if not self._is_valid_git_url(git_url):
                return InstallResult(
                    success=False,
                    error=f"Invalid git URL: {git_url}",
                    log="\n".join(log_lines),
                )

            # Create server directory
            server_path = self.workspace_dir / server_id
            if server_path.exists():
                log_lines.append(f"Removing existing installation at {server_path}")
                shutil.rmtree(server_path)

            log_lines.append(f"Cloning {git_url} (branch: {branch})")

            # Clone repository
            clone_result = await self._clone_repo(git_url, branch, str(server_path))
            log_lines.extend(clone_result["log"])

            if not clone_result["success"]:
                return InstallResult(
                    success=False,
                    error=f"Failed to clone repository: {clone_result['error']}",
                    log="\n".join(log_lines),
                )

            # Get commit SHA
            commit_sha = await self._get_commit_sha(str(server_path))
            log_lines.append(f"Cloned commit: {commit_sha}")

            # Auto-detect project type if commands not provided
            if not install_command:
                install_command = await self._detect_install_command(str(server_path))
                if install_command:
                    log_lines.append(f"Auto-detected install command: {install_command}")

            # Execute install command
            if install_command:
                log_lines.append(f"Running install command: {install_command}")
                install_result = await self._run_command(
                    install_command, str(server_path), timeout=300
                )
                log_lines.extend(install_result["log"])

                if not install_result["success"]:
                    return InstallResult(
                        success=False,
                        error=f"Install command failed: {install_result['error']}",
                        log="\n".join(log_lines),
                    )

            # Execute setup command (build, compile, etc.)
            if setup_command:
                log_lines.append(f"Running setup command: {setup_command}")
                setup_result = await self._run_command(
                    setup_command, str(server_path), timeout=600
                )
                log_lines.extend(setup_result["log"])

                if not setup_result["success"]:
                    return InstallResult(
                        success=False,
                        error=f"Setup command failed: {setup_result['error']}",
                        log="\n".join(log_lines),
                    )

            # Detect entry point
            log_lines.append("Detecting entry point...")
            entry_point = await self._detect_entry_point(str(server_path))

            if not entry_point:
                log_lines.append("Warning: Could not auto-detect entry point")

            log_lines.append("Installation completed successfully")

            return InstallResult(
                success=True,
                path=str(server_path),
                entry_point=entry_point,
                log="\n".join(log_lines),
            )

        except Exception as e:
            logger.exception(f"Failed to install server {server_id}")
            log_lines.append(f"ERROR: {str(e)}")
            return InstallResult(
                success=False, error=str(e), log="\n".join(log_lines)
            )

    async def update_server(
        self, server_id: str, server_path: str, branch: str = "main"
    ) -> InstallResult:
        """Pull latest changes from git repository.

        Args:
            server_id: Server identifier
            server_path: Path to git repository
            branch: Branch to pull from

        Returns:
            InstallResult with update details
        """
        log_lines = []

        try:
            if not Path(server_path).exists():
                return InstallResult(
                    success=False,
                    error=f"Server path not found: {server_path}",
                    log="\n".join(log_lines),
                )

            log_lines.append(f"Updating from {branch} branch")

            # Pull latest changes
            update_result = await self._run_command(
                f"git pull origin {branch}", server_path
            )
            log_lines.extend(update_result["log"])

            if not update_result["success"]:
                return InstallResult(
                    success=False,
                    error=f"Failed to pull updates: {update_result['error']}",
                    log="\n".join(log_lines),
                )

            # Get new commit SHA
            commit_sha = await self._get_commit_sha(server_path)
            log_lines.append(f"Updated to commit: {commit_sha}")

            return InstallResult(success=True, log="\n".join(log_lines))

        except Exception as e:
            logger.exception(f"Failed to update server {server_id}")
            log_lines.append(f"ERROR: {str(e)}")
            return InstallResult(
                success=False, error=str(e), log="\n".join(log_lines)
            )

    async def uninstall_server(self, server_id: str, server_path: str) -> bool:
        """Remove installed server files.

        Args:
            server_id: Server identifier
            server_path: Path to server installation

        Returns:
            True if successful, False otherwise
        """
        try:
            path = Path(server_path)
            if path.exists() and path.parent == self.workspace_dir:
                shutil.rmtree(path)
                logger.info(f"Uninstalled server {server_id} from {server_path}")
                return True
            return False
        except Exception as e:
            logger.exception(f"Failed to uninstall server {server_id}")
            return False

    def _is_valid_git_url(self, url: str) -> bool:
        """Validate git URL.

        Args:
            url: Git repository URL

        Returns:
            True if valid, False otherwise
        """
        try:
            parsed = urlparse(url)
            # Only allow HTTPS URLs for security
            if parsed.scheme != "https":
                return False
            # Must have netloc (domain)
            if not parsed.netloc:
                return False
            return True
        except Exception:
            return False

    async def _clone_repo(
        self, git_url: str, branch: str, destination: str
    ) -> dict:
        """Clone git repository.

        Args:
            git_url: Repository URL
            branch: Branch to clone
            destination: Destination path

        Returns:
            Dict with success status, error, and log
        """
        try:
            cmd = f"git clone --depth 1 --branch {branch} {git_url} {destination}"
            return await self._run_command(cmd, os.getcwd(), timeout=180)
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "log": [f"Clone failed: {str(e)}"],
            }

    async def _run_command(
        self, command: str, cwd: str, timeout: int = 120
    ) -> dict:
        """Execute shell command.

        Args:
            command: Command to execute
            cwd: Working directory
            timeout: Command timeout in seconds

        Returns:
            Dict with success status, error, and log lines
        """
        log_lines = []

        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=cwd,
            )

            try:
                stdout, _ = await asyncio.wait_for(
                    process.communicate(), timeout=timeout
                )
                output = stdout.decode("utf-8", errors="replace")
                log_lines.append(output)

                if process.returncode == 0:
                    return {"success": True, "log": log_lines}
                else:
                    return {
                        "success": False,
                        "error": f"Command exited with code {process.returncode}",
                        "log": log_lines,
                    }

            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                return {
                    "success": False,
                    "error": f"Command timed out after {timeout}s",
                    "log": log_lines,
                }

        except Exception as e:
            return {"success": False, "error": str(e), "log": log_lines}

    async def _get_commit_sha(self, repo_path: str) -> str:
        """Get current commit SHA.

        Args:
            repo_path: Path to git repository

        Returns:
            Commit SHA or empty string if failed
        """
        result = await self._run_command("git rev-parse HEAD", repo_path, timeout=5)
        if result["success"] and result["log"]:
            return result["log"][0].strip()
        return ""

    async def _detect_install_command(self, repo_path: str) -> Optional[str]:
        """Auto-detect install command based on project files.

        Args:
            repo_path: Path to repository

        Returns:
            Detected install command or None
        """
        path = Path(repo_path)

        # Check for Node.js project
        if (path / "package.json").exists():
            return "npm install"

        # Check for Python project with setup.py
        if (path / "setup.py").exists():
            return "pip install -e ."

        # Check for Python project with pyproject.toml
        if (path / "pyproject.toml").exists():
            return "pip install -e ."

        # Check for requirements.txt
        if (path / "requirements.txt").exists():
            return "pip install -r requirements.txt"

        return None

    async def _detect_entry_point(self, repo_path: str) -> Optional[dict]:
        """Detect how to run the MCP server.

        Args:
            repo_path: Path to repository

        Returns:
            Dict with command and args, or None
        """
        path = Path(repo_path)

        # Check for Node.js project
        if (path / "package.json").exists():
            # Try to read start script from package.json
            try:
                import json

                with open(path / "package.json") as f:
                    pkg = json.load(f)

                # Check for start script
                if "scripts" in pkg and "start" in pkg["scripts"]:
                    return {
                        "command": "npm",
                        "args": ["start"],
                        "cwd": str(repo_path),
                    }

                # Check for main field
                if "main" in pkg:
                    return {
                        "command": "node",
                        "args": [pkg["main"]],
                        "cwd": str(repo_path),
                    }

            except Exception:
                pass

        # Check for Python module
        if (path / "setup.py").exists() or (path / "pyproject.toml").exists():
            # Try to detect module name from directory
            # This is a simple heuristic
            module_dirs = [
                d for d in path.iterdir() if d.is_dir() and (d / "__init__.py").exists()
            ]
            if module_dirs:
                module_name = module_dirs[0].name
                return {
                    "command": "python",
                    "args": ["-m", module_name],
                    "cwd": str(repo_path),
                }

        # Check for common executable names
        common_exes = ["index.js", "main.py", "server.py", "mcp_server.py"]
        for exe in common_exes:
            if (path / exe).exists():
                if exe.endswith(".js"):
                    return {"command": "node", "args": [exe], "cwd": str(repo_path)}
                elif exe.endswith(".py"):
                    return {"command": "python", "args": [exe], "cwd": str(repo_path)}

        return None
