#!/usr/bin/env python3
"""Test script to verify MCP Gateway functionality."""

import asyncio
import json
import httpx


BASE_URL = "http://localhost:8000"


async def test_instance_creation():
    """Test creating a northbound instance."""
    print("=" * 60)
    print("TEST 1: Creating Northbound Instance")
    print("=" * 60)

    # Get available tools
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/tools")
        tools = response.json()
        print(f"\nAvailable tools: {len(tools)}")

        # Select first 3 tools
        tool_ids = [tool["id"] for tool in tools[:3]]
        print(f"Selected tool IDs: {tool_ids}")

        # Create instance
        instance_data = {
            "name": "Test Instance",
            "description": "Test northbound MCP instance",
            "tool_ids": tool_ids
        }

        response = await client.post(
            f"{BASE_URL}/api/instances",
            json=instance_data
        )

        if response.status_code == 201:
            instance = response.json()
            print(f"\n✓ Instance created successfully!")
            print(f"  ID: {instance['id']}")
            print(f"  Name: {instance['name']}")
            print(f"  Endpoint: {instance['endpoint_path']}")
            print(f"  Tool count: {instance['tool_count']}")
            return instance
        else:
            print(f"\n✗ Failed to create instance: {response.status_code}")
            print(f"  Response: {response.text}")
            return None


async def test_mcp_initialize(instance):
    """Test MCP initialize method."""
    print("\n" + "=" * 60)
    print("TEST 2: MCP Initialize")
    print("=" * 60)

    if not instance:
        print("\n✗ Skipping: No instance available")
        return False

    endpoint = f"{BASE_URL}{instance['endpoint_path']}"

    async with httpx.AsyncClient() as client:
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "clientInfo": {
                    "name": "test-client",
                    "version": "1.0.0"
                }
            }
        }

        response = await client.post(endpoint, json=request)

        if response.status_code == 200:
            result = response.json()
            print(f"\n✓ Initialize successful!")
            print(f"  Protocol version: {result.get('result', {}).get('protocolVersion')}")
            print(f"  Server info: {result.get('result', {}).get('serverInfo')}")
            return True
        else:
            print(f"\n✗ Initialize failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False


async def test_mcp_tools_list(instance):
    """Test MCP tools/list method."""
    print("\n" + "=" * 60)
    print("TEST 3: MCP Tools List")
    print("=" * 60)

    if not instance:
        print("\n✗ Skipping: No instance available")
        return None

    endpoint = f"{BASE_URL}{instance['endpoint_path']}"

    async with httpx.AsyncClient() as client:
        request = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        }

        response = await client.post(endpoint, json=request)

        if response.status_code == 200:
            result = response.json()
            tools = result.get('result', {}).get('tools', [])
            print(f"\n✓ Tools list successful!")
            print(f"  Tool count: {len(tools)}")
            for tool in tools:
                print(f"  - {tool.get('name')}")
            return tools
        else:
            print(f"\n✗ Tools list failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return None


async def test_mcp_tool_call(instance, tools):
    """Test MCP tools/call method."""
    print("\n" + "=" * 60)
    print("TEST 4: MCP Tool Call")
    print("=" * 60)

    if not instance or not tools:
        print("\n✗ Skipping: No instance or tools available")
        return False

    endpoint = f"{BASE_URL}{instance['endpoint_path']}"

    # Try to call get_devices (should not require parameters)
    tool_to_call = None
    for tool in tools:
        if tool.get('name') == 'get_devices':
            tool_to_call = tool
            break

    if not tool_to_call:
        print("\n✗ get_devices tool not found, trying first tool instead")
        tool_to_call = tools[0]

    async with httpx.AsyncClient(timeout=60.0) as client:
        request = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": tool_to_call.get('name'),
                "arguments": {}
            }
        }

        print(f"\n  Calling tool: {tool_to_call.get('name')}")

        try:
            response = await client.post(endpoint, json=request)

            if response.status_code == 200:
                result = response.json()
                if 'error' in result:
                    print(f"\n⚠ Tool call returned error:")
                    print(f"  {result['error']}")
                    return False
                else:
                    print(f"\n✓ Tool call successful!")
                    print(f"  Has content: {'content' in result.get('result', {})}")
                    print(f"  Is error: {result.get('result', {}).get('isError', 'unknown')}")
                    return True
            else:
                print(f"\n✗ Tool call failed: {response.status_code}")
                print(f"  Response: {response.text}")
                return False
        except Exception as e:
            print(f"\n✗ Tool call exception: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return False


async def test_southbound_connection():
    """Test southbound server connection."""
    print("\n" + "=" * 60)
    print("TEST 5: Southbound Server Connection")
    print("=" * 60)

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/servers")
        servers = response.json()

        print(f"\n  Total servers: {len(servers)}")
        for server in servers:
            print(f"\n  Server: {server['name']}")
            print(f"    Status: {server['status']}")
            print(f"    Transport: {server['transport_type']}")
            print(f"    Tool count: {server['tool_count']}")

            if server['status'] != 'connected':
                print(f"    ⚠ Server not connected!")
                return False

        print(f"\n✓ All servers connected!")
        return True


async def cleanup_instances():
    """Delete all test instances."""
    print("\n" + "=" * 60)
    print("CLEANUP: Deleting Test Instances")
    print("=" * 60)

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/instances")
        instances = response.json()

        for instance in instances:
            print(f"\n  Deleting instance: {instance['name']}")
            await client.delete(f"{BASE_URL}/api/instances/{instance['id']}")

        print(f"\n✓ Cleanup complete!")


async def main():
    """Run all tests."""
    print("\n" + "=" * 80)
    print(" MCP GATEWAY FUNCTIONALITY TEST SUITE")
    print("=" * 80)

    # Test southbound connection first
    await test_southbound_connection()

    # Test instance creation
    instance = await test_instance_creation()

    # Test MCP protocol
    await test_mcp_initialize(instance)
    tools = await test_mcp_tools_list(instance)
    await test_mcp_tool_call(instance, tools)

    # Cleanup
    await cleanup_instances()

    print("\n" + "=" * 80)
    print(" TEST SUITE COMPLETE")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
