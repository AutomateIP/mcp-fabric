#!/usr/bin/env python3
"""
MCP Gateway - Quick Install CLI
Install MCP servers with a single command.

Usage:
    python install_mcp.py duckduckgo-mcp-server
    python install_mcp.py duckduckgo-mcp-server --uv
    python install_mcp.py "uv pip install duckduckgo-mcp-server"
"""

import sys
import re
import httpx
import asyncio


def parse_command(args: list[str]) -> tuple[str, bool]:
    """
    Parse command line arguments to extract package name and uv flag.

    Supports:
    - python install_mcp.py package-name
    - python install_mcp.py package-name --uv
    - python install_mcp.py "uv pip install package-name"
    - python install_mcp.py "pip install package-name"
    """
    if not args:
        return None, True

    # Join all args into single string
    full_command = ' '.join(args)

    # Check if --uv flag is present
    use_uv = '--uv' in args or 'uv pip install' in full_command or 'uv install' in full_command

    # Remove --uv flag if present
    full_command = full_command.replace('--uv', '').strip()

    # Extract package name from different formats
    package_name = None

    # Pattern: "uv pip install package-name"
    if match := re.search(r'uv\s+pip\s+install\s+([^\s]+)', full_command):
        package_name = match.group(1)
        use_uv = True
    # Pattern: "pip install package-name"
    elif match := re.search(r'pip\s+install\s+([^\s]+)', full_command):
        package_name = match.group(1)
    # Pattern: "uv install package-name"
    elif match := re.search(r'uv\s+install\s+([^\s]+)', full_command):
        package_name = match.group(1)
        use_uv = True
    # Just the package name
    else:
        # Take first non-flag argument
        for arg in args:
            if not arg.startswith('-'):
                package_name = arg
                break

    return package_name, use_uv


def generate_server_name(package_name: str) -> str:
    """Generate a friendly server name from package name."""
    name = package_name.replace('-mcp-server', '').replace('mcp-', '')
    name = name.replace('-', ' ').replace('_', ' ')
    return ' '.join(word.capitalize() for word in name.split())


async def install_server(package_name: str, use_uv: bool = True, gateway_url: str = "http://localhost:8000"):
    """Install MCP server via gateway API."""
    server_name = generate_server_name(package_name)

    print(f"🚀 Installing MCP server: {package_name}")
    print(f"📦 Package: {package_name}")
    print(f"⚡ Using: {'uv (fast)' if use_uv else 'pip'}")
    print(f"🏷️  Server name: {server_name}")
    print()

    payload = {
        "name": server_name,
        "description": f"Auto-installed from {package_name}",
        "transport_type": "stdio",
        "installation_type": "pip",
        "pip_package": package_name,
        "use_uv": use_uv,
        "connection_config": {}
    }

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            print("📡 Connecting to MCP Gateway...")
            response = await client.post(f"{gateway_url}/api/servers", json=payload)
            response.raise_for_status()

            server = response.json()
            print()
            print("✅ Server installed successfully!")
            print(f"   ID: {server['id']}")
            print(f"   Name: {server['name']}")
            print(f"   Status: {server['status']}")
            print()
            print(f"🌐 View in UI: http://localhost:3000")
            print(f"🔧 Manage: http://localhost:3000")
            print()
            return 0

    except httpx.HTTPStatusError as e:
        print()
        print(f"❌ Installation failed: {e.response.status_code}")
        try:
            error_detail = e.response.json().get('detail', str(e))
            print(f"   Error: {error_detail}")
        except:
            print(f"   Error: {e}")
        print()
        print("💡 Troubleshooting:")
        print("   - Is the MCP Gateway running? (docker-compose up)")
        print("   - Is the package name correct?")
        print("   - Check: http://localhost:8000/docs")
        return 1

    except httpx.ConnectError:
        print()
        print("❌ Cannot connect to MCP Gateway")
        print("   Make sure the gateway is running:")
        print()
        print("   cd /path/to/mcp_gateway")
        print("   docker-compose up")
        print()
        return 1

    except Exception as e:
        print()
        print(f"❌ Unexpected error: {e}")
        return 1


def print_usage():
    """Print usage information."""
    print("MCP Gateway - Quick Install CLI")
    print()
    print("Usage:")
    print("  python install_mcp.py <package-name>")
    print("  python install_mcp.py <package-name> --uv")
    print("  python install_mcp.py \"uv pip install <package-name>\"")
    print()
    print("Examples:")
    print("  python install_mcp.py duckduckgo-mcp-server")
    print("  python install_mcp.py duckduckgo-mcp-server --uv")
    print("  python install_mcp.py \"uv pip install duckduckgo-mcp-server\"")
    print("  python install_mcp.py \"pip install mcp-memory-server\"")
    print()
    print("Popular packages:")
    print("  - duckduckgo-mcp-server    (Web search)")
    print("  - mcp-memory-server        (Persistent memory)")
    print("  - mcp-server-fetch         (HTTP requests)")
    print("  - mcp-server-git           (Git operations)")
    print()


async def main():
    """Main entry point."""
    args = sys.argv[1:]

    if not args or args[0] in ['-h', '--help', 'help']:
        print_usage()
        return 0

    package_name, use_uv = parse_command(args)

    if not package_name:
        print("❌ No package name provided")
        print()
        print_usage()
        return 1

    return await install_server(package_name, use_uv)


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
