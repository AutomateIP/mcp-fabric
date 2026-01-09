# MCP Gateway

An intelligent intermediary system that manages multiple MCP (Model Context Protocol) servers. The gateway acts as both an MCP client (southbound) and MCP server (northbound), enabling fine-grained tool composition for AI agents.

## What is MCP Gateway?

MCP Gateway lets you:
- **Onboard multiple MCP servers** via STDIO or Streamable HTTP transports
- **Automatically discover** all available tools from each server
- **Create custom MCP endpoints** that expose different subsets of tools
- **Route tool invocations** to the correct backend server automatically

**Example**: Connect to a file system MCP server and a time MCP server, then create separate endpoints—one for Agent A with read-only file tools, another for Agent B with time tools only.

## Key Features

- **Southbound Integration**: Connect to multiple MCP servers (STDIO and Streamable HTTP)
- **Northbound Exposure**: Create multiple MCP server instances with custom tool selections
- **Dynamic Configuration**: Modify tool selections on-the-fly via web UI or API
- **Tool Discovery**: Automatically catalog all tools from onboarded servers
- **Tagging System**: Organize tools and instances with tags
- **REST API**: Comprehensive API for programmatic control
- **Health Monitoring**: Automatic reconnection and health checks
- **Web UI**: Modern React-based interface for management

## Tech Stack

### Backend
- **Python 3.11+** with FastMCP 2.0+
- **FastAPI** for REST API
- **PostgreSQL 15+** (required - SQLite not supported)
- **SQLAlchemy 2.0+** with async support
- **Alembic** for database migrations

### Frontend
- **React 19** with TypeScript
- **TailwindCSS 4**
- **Vite** for build tooling

## Quick Start

### 🐳 Docker (Recommended)

Fastest way to get started:

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Access the application
# Backend API: http://localhost:8000
# Frontend UI: http://localhost:3000
```

Services included:
- PostgreSQL 15 database
- Backend API server
- Frontend web UI

### Manual Installation

#### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Node.js 18+ (for frontend)

#### Backend Setup

```bash
# 1. Set up PostgreSQL
docker run -d \
  --name mcp-gateway-db \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=mcp_gateway \
  -p 5432:5432 \
  postgres:15

# Or install PostgreSQL locally (macOS)
brew install postgresql@15
brew services start postgresql@15
createdb mcp_gateway

# 2. Install dependencies
pip install -e .

# 3. Configure database connection
cat > .env << EOF
DATABASE_URL=postgresql+asyncpg://postgres:dev@localhost:5432/mcp_gateway
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
EOF

# 4. Run migrations
alembic upgrade head

# 5. Start backend
python -m app.main
```

Backend API available at http://localhost:8000

#### Frontend Setup

```bash
cd frontend/mcp-gateway-ui
npm install
npm run dev
```

Frontend UI available at http://localhost:5173

## Usage Examples

### Onboard an MCP Server (STDIO)

```bash
curl -X POST http://localhost:8000/api/servers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Time Server",
    "description": "MCP server for time operations",
    "transport_type": "stdio",
    "connection_config": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-time"]
    }
  }'
```

### Onboard an MCP Server (Streamable HTTP)

```bash
curl -X POST http://localhost:8000/api/servers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Remote Server",
    "transport_type": "streamable_http",
    "connection_config": {
      "url": "http://your-server.com/mcp",
      "headers": {
        "Authorization": "Bearer your-token"
      }
    }
  }'
```

### Create a Northbound Instance

```bash
# First, get available tools
curl http://localhost:8000/api/tools

# Create instance with selected tools
curl -X POST http://localhost:8000/api/instances \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Agent Tools",
    "description": "Custom tool selection for my AI agent",
    "tool_ids": ["tool-id-1", "tool-id-2"]
  }'
```

### Connect AI Agent to Instance

```python
from fastmcp import Client

# Connect to your instance endpoint
client = Client("http://localhost:8000/mcp/instances/{instance-id}")

async with client:
    # List available tools
    tools = await client.list_tools()
    print(f"Available tools: {[t.name for t in tools]}")

    # Call a tool
    result = await client.call_tool("get_time", {})
    print(f"Result: {result}")
```

## API Documentation

Interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

**Servers**
- `POST /api/servers` - Onboard MCP server
- `GET /api/servers` - List all servers
- `GET /api/servers/{id}` - Get server details
- `DELETE /api/servers/{id}` - Remove server
- `POST /api/servers/{id}/connect` - Manually connect
- `POST /api/servers/{id}/disconnect` - Manually disconnect

**Instances**
- `POST /api/instances` - Create instance
- `GET /api/instances` - List instances
- `GET /api/instances/{id}` - Get instance
- `PUT /api/instances/{id}` - Update instance
- `DELETE /api/instances/{id}` - Delete instance

**Tools**
- `GET /api/tools` - List all discovered tools
- `GET /api/tools/{id}` - Get tool details

**MCP Protocol**
- `POST /mcp/instances/{id}` - MCP JSON-RPC endpoint (connect agents here)

## Architecture

### Three-Layer Design

```
┌─────────────────────────────────────────┐
│   Frontend (React 19 + TailwindCSS 4)  │
│   Web UI for management                 │
└─────────────┬───────────────────────────┘
              │ REST API
              ▼
┌─────────────────────────────────────────┐
│   FastAPI Backend (FastMCP 2.0+)       │
│   Gateway Logic & Configuration         │
├─────────────────────────────────────────┤
│   Northbound Manager (MCP Server)      │
│   - Dynamic instance creation           │
│   - Tool selection & composition        │
│   - MCP protocol endpoints              │
├─────────────────────────────────────────┤
│   Southbound Manager (MCP Client)      │
│   - STDIO transport (local)             │
│   - Streamable HTTP (remote)            │
│   - Tool discovery & cataloging         │
│   - Connection lifecycle management     │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   MCP Servers (Multiple)                │
│   - Time, Filesystem, Custom, etc.      │
└─────────────────────────────────────────┘
```

### Key Components

- **Southbound Manager**: Manages MCP client connections, tool discovery, and invocation proxying
- **Northbound Manager**: Creates and manages MCP server instances with custom tool selections
- **Tool Registry**: Maintains catalog of all available tools with schemas
- **Configuration Engine**: Handles instance configuration and real-time updates

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
# Auto-format code
black .

# Run linter
ruff check .

# Type checking
mypy app/
```

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

## Documentation

For detailed guides and technical documentation:
- **[docs/QUICKSTART_MODERN.md](docs/QUICKSTART_MODERN.md)** - Comprehensive setup guide with examples
- **[CLAUDE.md](CLAUDE.md)** - AI assistant guidance and architectural details
- **[AGENTS.md](AGENTS.md)** - AI agent persistent memory and code patterns
- **[PROMPT.md](PROMPT.md)** - Complete project requirements and specifications

## Project Structure

```
mcp_gateway/
├── app/
│   ├── api/              # FastAPI routes and schemas
│   │   ├── routes/       # API endpoint handlers
│   │   └── schemas/      # Pydantic models
│   ├── core/             # Core configuration and utilities
│   ├── managers/         # Business logic managers
│   │   ├── southbound.py # MCP client connections
│   │   ├── northbound.py # MCP server instances
│   │   └── tool_registry.py # Tool catalog
│   ├── models/           # SQLAlchemy database models
│   ├── transports/       # MCP transport implementations
│   ├── utils/            # Utility functions
│   └── main.py           # FastAPI application entry point
├── alembic/              # Database migrations
├── frontend/             # React web UI
│   └── mcp-gateway-ui/
├── tests/                # Test suite
├── docs/                 # Documentation
├── docker-compose.yml    # Docker deployment
├── pyproject.toml        # Python dependencies and config
└── README.md             # This file
```

## Database Requirements

**PostgreSQL 15+ is required.** SQLite is not supported due to:
- Nested transaction requirements
- Async connection pooling needs
- Concurrent MCP server connection management

Use the included Docker Compose setup for easy PostgreSQL deployment.

## Performance & Security

### Performance Targets
- API response time: <100ms (excluding tool invocation)
- Tool proxy overhead: <50ms
- Support 100+ concurrent agent connections
- Handle 1000+ tool invocations per minute

### Security Best Practices
- Encrypt secrets at rest (API keys, tokens)
- Use HTTPS in production
- Configure CORS for web UI
- Implement rate limiting on API endpoints
- Validate Origin header for Streamable HTTP (prevents DNS rebinding)

## Support

For issues and questions:
1. Check the documentation in `docs/`
2. Review API documentation at http://localhost:8000/docs
3. Open an issue on GitHub

## License

MIT

---

**Built with FastMCP 2.0+ • React 19 • TailwindCSS 4 • PostgreSQL 15**
