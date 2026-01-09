"""Simple script to test the MCP Gateway API."""

import asyncio
import httpx


async def test_api():
    """Test the API endpoints."""
    base_url = "http://localhost:8000"

    async with httpx.AsyncClient() as client:
        # Test root endpoint
        print("Testing root endpoint...")
        response = await client.get(f"{base_url}/")
        print(f"Root: {response.status_code} - {response.json()}")

        # Test health endpoint
        print("\nTesting health endpoint...")
        response = await client.get(f"{base_url}/api/health")
        print(f"Health: {response.status_code} - {response.json()}")

        # Test stats endpoint
        print("\nTesting stats endpoint...")
        response = await client.get(f"{base_url}/api/stats")
        print(f"Stats: {response.status_code} - {response.json()}")

        # Test creating a tag
        print("\nCreating a test tag...")
        response = await client.post(
            f"{base_url}/api/tags",
            json={
                "name": "test-tag",
                "color": "#FF5733",
                "description": "A test tag",
            },
        )
        print(f"Create Tag: {response.status_code}")
        if response.status_code < 300:
            print(f"Response: {response.json()}")
        else:
            print(f"Error: {response.text}")

        # Test listing tags
        print("\nListing tags...")
        response = await client.get(f"{base_url}/api/tags")
        print(f"List Tags: {response.status_code} - {response.json()}")

        # Test creating a server (STDIO - Time MCP)
        print("\nCreating a test server...")
        response = await client.post(
            f"{base_url}/api/servers",
            json={
                "name": "Time Server",
                "description": "MCP server for time operations",
                "transport_type": "stdio",
                "connection_config": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-time"],
                },
            },
        )
        print(f"Create Server: {response.status_code}")
        if response.status_code == 201:
            server_data = response.json()
            print(f"Server created: {server_data['id']} - {server_data['name']}")
            server_id = server_data["id"]

            # List servers
            print("\nListing servers...")
            response = await client.get(f"{base_url}/api/servers")
            print(f"List Servers: {response.status_code} - Found {len(response.json())} servers")

            # List tools
            print("\nListing tools...")
            response = await client.get(f"{base_url}/api/tools")
            print(f"List Tools: {response.status_code} - Found {len(response.json())} tools")

            if response.status_code == 200:
                tools = response.json()
                if tools:
                    tool_ids = [tool["id"] for tool in tools[:3]]  # Take first 3 tools

                    # Create an instance
                    print("\nCreating an instance...")
                    response = await client.post(
                        f"{base_url}/api/instances",
                        json={
                            "name": "Test Instance",
                            "description": "A test instance",
                            "tool_ids": tool_ids,
                            "tag_ids": [],
                        },
                    )
                    print(f"Create Instance: {response.status_code}")
                    if response.status_code == 201:
                        instance_data = response.json()
                        print(
                            f"Instance created: {instance_data['id']} - {instance_data['name']}"
                        )

                        # Get instance endpoint
                        print("\nGetting instance endpoint...")
                        response = await client.get(
                            f"{base_url}/api/instances/{instance_data['id']}/endpoint"
                        )
                        print(f"Instance Endpoint: {response.status_code}")
                        if response.status_code == 200:
                            endpoint_info = response.json()
                            print(f"Endpoint URL: {endpoint_info['endpoint_url']}")

        print("\n✅ All API tests completed successfully!")


if __name__ == "__main__":
    asyncio.run(test_api())
