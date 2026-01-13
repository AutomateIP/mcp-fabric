#!/usr/bin/env python3
"""
MCP Gateway Test Runner using uv
"""

import subprocess
import sys
import os
from pathlib import Path


def run_command(cmd, cwd=None):
    """Run a command and return the result."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd or Path(__file__).parent,
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout, result.stderr
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {cmd}")
        print(f"Error: {e.stderr}")
        sys.exit(1)


def main():
    """Run tests using uv."""
    print("🧪 Running MCP Gateway Tests with uv")

    # Ensure we're in a virtual environment
    if not os.environ.get("VIRTUAL_ENV"):
        print("❌ Not in a virtual environment. Run 'uv venv && source .venv/bin/activate' first")
        sys.exit(1)

    # Install test dependencies
    print("📦 Installing test dependencies...")
    run_command("uv pip install -e '.[dev]'")

    # Run tests
    print("🧪 Running tests...")
    stdout, stderr = run_command("uv run pytest -v")

    if stdout:
        print(stdout)
    if stderr:
        print(stderr, file=sys.stderr)

    print("✅ Tests completed!")


if __name__ == "__main__":
    main()
