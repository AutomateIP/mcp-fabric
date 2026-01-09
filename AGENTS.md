# AGENTS.md

AI Agent Persistent Memory for MCP Gateway Project

## Project Overview

MCP Gateway is an intelligent intermediary system that acts as both an MCP client and server. It onboards multiple MCP servers (southbound), discovers their tools, and exposes dynamically configurable MCP server instances (northbound) where each instance can serve a custom selection of tools from any onboarded servers. This enables fine-grained tool composition for different AI agents.

**Key Value**: One gateway manages many MCP servers, and creates many customized MCP endpoints for different agents with different tool needs.

### Three-Layer Architecture

1. **Southbound Integration (Gateway as MCP Client)**
   - Connect to multiple MCP servers using STDIO and Streamable HTTP transports
   - Discover and catalog all available tools from each server
   - Proxy tool invocations from northbound to correct southbound server
   - Handle connection lifecycle: health checks, reconnection, session management

2. **Northbound Exposure (Gateway as MCP Server)**
   - Dynamically create multiple MCP server instances
   - Each instance exposes a custom selection of tools from any southbound servers
   - Tool selection happens via web UI/API and takes effect immediately for new connections
   - Primary transport: Streamable HTTP

3. **Configuration & Management**
   - Web UI for managing servers, instances, and tool selection
   - REST API for programmatic control
   - Database-backed persistence (PostgreSQL required)
   - Tagging system for organizing tools and instances

### Key Components

- **Southbound Manager**: Owns all MCP client connections, manages connection lifecycle, discovers tools, proxies invocations
- **Northbound Manager**: Creates and manages MCP server instances, dynamically registers tools, routes MCP requests
- **Tool Registry**: Maintains catalog of all available tools with schemas and metadata
- **Configuration Engine**: Handles instance configuration, validates tool selections, triggers updates

## Tech Stack

### Backend
- **Python**: 3.11+ (required)
- **MCP Framework**: FastMCP 2.0.0+
- **Web Framework**: FastAPI 0.109.0+
- **ASGI Server**: Uvicorn 0.27.0+ with standard extras
- **Database**: PostgreSQL 15+ (SQLite NOT supported due to nested transactions)
- **ORM**: SQLAlchemy 2.0.25+ (async)
- **Database Driver**: asyncpg 0.29.0+, psycopg2-binary 2.9.9+
- **Migrations**: Alembic 1.13.1+
- **Validation**: Pydantic 2.5.0+
- **HTTP Client**: httpx 0.26.0+
- **Process Management**: anyio 4.2.0+

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: TailwindCSS (required)
- **Type Safety**: TypeScript (strongly recommended)

### Infrastructure
- **Container**: Docker with Docker Compose
- **Database**: PostgreSQL 15-alpine

### Database Schema
**Core Tables**:
- `onboarded_servers`: Southbound MCP server configurations
- `tools`: Catalog of discovered tools with schemas
- `northbound_instances`: Northbound MCP server instance configurations
- `instance_tools`: Many-to-many junction (instances ↔ tools)
- `tags`: Tags for organization
- `tool_tags`: Many-to-many junction (tools ↔ tags)
- `instance_tags`: Many-to-many junction (instances ↔ tags)

## Design Principles

### Must Follow
1. **Use FastMCP framework** for all MCP server/client implementation
2. **Support both STDIO and Streamable HTTP** transports for southbound
3. **No mock/fake data** in production code
4. **All configurations must persist** to database
5. **Instance configuration changes take effect immediately** for new connections
6. **Use async/await patterns throughout** for all I/O operations
7. **PostgreSQL is required** - SQLite is not compatible with this application's async workflow

### Transport Protocol Requirements

**Southbound (Gateway as Client)**:
- **STDIO**: Required - Local process communication via stdin/stdout
- **Streamable HTTP**: Required - Modern HTTP-based bidirectional messaging
- **Legacy SSE**: Optional - Deprecated but may support for backward compatibility

**Northbound (Gateway as Server)**:
- **Streamable HTTP**: Primary/required transport
- **STDIO**: Optional for local agent connections

## Executable Commands

### Backend Development
```bash
# Install dependencies (from project root)
pip install -e .

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Run linter
ruff check .

# Auto-format code
black .

# Type checking
mypy app/
```

### Frontend Development
```bash
# Navigate to frontend directory
cd frontend/mcp-gateway-ui

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

### Docker Commands
```bash
# Start all services (from project root)
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Rebuild and restart
docker compose up -d --build

# Stop and remove volumes (fresh start)
docker compose down -v
```

### Database Commands
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

## Code Style & Patterns

### Python Code Style
- **Line Length**: 100 characters (Black and Ruff configured)
- **Python Version Target**: py311
- **Formatter**: Black (required)
- **Linter**: Ruff
- **Import Style**: Absolute imports preferred
- **Async/Await**: Use async/await throughout for all I/O operations
- **Type Hints**: Use Pydantic models and Python type hints extensively

### Naming Conventions
- **Files**: `snake_case.py`
- **Classes**: `PascalCase`
- **Functions/Methods**: `snake_case`
- **Constants**: `UPPER_SNAKE_CASE`
- **Enums**: `PascalCase` for class, `UPPER_SNAKE_CASE` for values

### Project Structure
```
app/
├── main.py                    # FastAPI application entry point
├── models/                    # SQLAlchemy ORM models
│   ├── server.py             # Southbound server models
│   ├── instance.py           # Northbound instance models
│   └── tool.py               # Tool registry models
├── managers/                  # Core business logic
│   ├── southbound.py         # MCP client manager
│   ├── northbound.py         # MCP server manager
│   └── configuration.py      # Config engine
├── api/                       # FastAPI routes
│   ├── servers.py            # /api/servers/*
│   ├── instances.py          # /api/instances/*
│   ├── tools.py              # /api/tools/*
│   └── tags.py               # /api/tags/*
├── transports/               # MCP transport implementations
│   ├── stdio.py              # STDIO transport
│   └── streamable_http.py    # Streamable HTTP transport
└── db.py                     # Database session management
```

### Architectural Patterns
- **Three-Layer Architecture**: Southbound (client) → Gateway Logic → Northbound (server)
- **Manager Pattern**: Southbound/Northbound managers own connection lifecycle
- **Registry Pattern**: Tool Registry for discovered tools
- **Async Context Managers**: Use for connection lifecycle
- **Dependency Injection**: Use FastAPI's dependency injection system
- **Database Sessions**: Always use async context managers for sessions
- **Error Handling**: Structured logging with context (request_id, server_id, instance_id)

### Model Patterns
```python
# Example enum usage (from app/models/server.py)
class TransportType(str, Enum):
    STDIO = "stdio"
    STREAMABLE_HTTP = "streamable_http"
    SSE = "sse"  # Legacy support

class ServerStatus(str, Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    RECONNECTING = "reconnecting"
```

### Tool Name Conflicts
When multiple servers expose tools with the same name, implement namespacing strategy:
- **Suggested format**: `server_name.tool_name`
- **Must ensure** unique tool identification across all onboarded servers
- **Configuration option** for conflict resolution behavior (e.g., auto-namespace vs. manual resolution)

## Testing Guidelines

### Testing Framework
- **Framework**: pytest with pytest-asyncio
- **Async Mode**: `asyncio_mode = "auto"` (configured in pyproject.toml)
- **Test Location**: `tests/` directory at project root
- **Test File Naming**: `test_*.py` or `*_test.py`
- **Test Function Naming**: `test_descriptive_name`

### Test Structure
```
tests/
├── unit/                      # Unit tests
│   ├── test_models.py
│   ├── test_managers.py
│   └── test_transports.py
├── integration/               # Integration tests
│   ├── test_api.py
│   └── test_southbound.py
└── conftest.py               # Pytest fixtures
```

### Testing Best Practices
- Use async test functions for async code: `async def test_feature():`
- Mock external dependencies (MCP servers, databases in unit tests)
- Use database fixtures for integration tests
- Test error conditions and edge cases
- Test connection lifecycle (connect, disconnect, reconnect)
- Validate Pydantic models with invalid data

## Example Usage Scenario

**Southbound Servers Onboarded**:
- **Time MCP Server**: Provides `get_time`, `get_timezone`, `convert_time`
- **File System MCP Server**: Provides `read_file`, `write_file`, `create_file`, `delete_file`, `list_directory`

**Northbound Instance A - "Agent 1 Tools"**:
- **Selected Tools**: `get_time`, `read_file`, `create_file`
- **Tags**: ["basic", "read-only-fs"]
- **Use Case**: AI agent that needs time info and can read/create files but not delete

**Northbound Instance B - "Agent 2 Tools"**:
- **Selected Tools**: `read_file`, `get_timezone`
- **Tags**: ["minimal", "read-only"]
- **Use Case**: AI agent with minimal permissions, read-only access

**Result**:
- Agent 1 connects to `http://localhost:8000/mcp/instances/{instance-a-id}` → sees only 3 tools
- Agent 2 connects to `http://localhost:8000/mcp/instances/{instance-b-id}` → sees only 2 tools
- Tool invocations automatically proxy to correct southbound server (Time or FileSystem)
- Admin can modify tool selections anytime via web UI without restarting anything

## Development Workflow

### Implementation Phases

When implementing or extending the gateway, follow these phases:

**Phase 1: Core Infrastructure**
- Database schema and ORM models
- Southbound Manager with STDIO support
- Tool discovery and cataloging
- Basic Tool Registry

**Phase 2: Northbound Instance Management**
- Northbound Manager implementation
- Dynamic MCP server instance creation
- Tool selection logic
- Instance CRUD API endpoints

**Phase 3: Streamable HTTP Support**
- Streamable HTTP client (southbound)
- Streamable HTTP server (northbound)
- Session management
- Connection health monitoring

**Phase 4: Web API Complete**
- Complete REST API
- Tag management system
- Advanced filtering and search
- OpenAPI documentation

**Phase 5: Web UI**
- Frontend application setup
- Dashboard, server management, instance management pages
- Tool browser/catalog
- Real-time updates via WebSocket/SSE

**Phase 6: Production Readiness**
- Comprehensive error handling
- Structured logging and monitoring
- Performance optimization
- Security hardening
- Testing suite

### API Structure

REST API endpoints follow this pattern:
- `/api/servers/*` - Southbound server management
- `/api/instances/*` - Northbound instance management
- `/api/tools/*` - Tool catalog operations
- `/api/tags/*` - Tag management
- `/api/health` - System health check
- `/api/stats` - System statistics

MCP instance endpoints:
- `/mcp/instances/{instance_id}` - Streamable HTTP endpoint for each instance

### Performance Targets

- API endpoints: <100ms (excluding tool invocation time)
- Tool invocation overhead: <50ms (proxy routing time)
- UI page load: <2 seconds
- Real-time update latency: <500ms
- Support 100+ concurrent agent connections
- Handle 1000+ tool invocations per minute

## Boundaries & Safety

### NEVER Touch
- **Production Secrets**: Never commit `.env`, `config.yaml`, or any files with credentials
- **Database Files**: `*.db`, `*.sqlite`, `*.sqlite3`, `mcp_gateway.db`, `gateway.db`
- **Generated Files**: `__pycache__/`, `*.pyc`, `.pytest_cache/`, `.ruff_cache/`
- **Archive Directory**: `archive/` contains historical files, excluded from git
- **Frontend Build Outputs**: `node_modules/`, `frontend/dist/`, `frontend/build/`
- **User Config**: `docker-compose.override.yml` (user-specific overrides)

### When to Ask for Confirmation
- **Database Schema Changes**: Any new migration that alters tables
- **Breaking API Changes**: Changes to REST API contracts or MCP protocol handling
- **Transport Protocol Changes**: Modifications to STDIO or Streamable HTTP logic
- **Security-Related Code**: Authentication, authorization, encryption changes
- **Performance-Critical Code**: Changes to connection pooling, caching, or routing
- **Production Configuration**: Changes to `docker-compose.yml`, environment variables

### Security Principles
- Encrypt secrets (API keys, tokens) at rest in database
- Validate all inputs to prevent injection attacks
- Use HTTPS for all external communication
- Validate Origin header for Streamable HTTP (prevent DNS rebinding)
- CORS configuration required for web UI
- Rate limiting on API endpoints

### Error Handling Requirements
- Use structured logging with context (server_id, instance_id, tool_name)
- Provide clear, user-friendly error messages
- Implement graceful degradation when southbound servers fail
- Use automatic reconnection with exponential backoff
- Implement circuit breaker pattern for repeatedly failing servers
- Never expose internal error details to external API consumers

### Development Guidelines
- Always run database migrations in development before starting server
- Test with real MCP servers when possible (not mocks) for integration tests
- Use Docker Compose for full-stack testing
- Keep console output clean (structured logging, not print statements)
- Document new API endpoints in OpenAPI schema
- Update AGENTS.md when architectural patterns change

### Database Constraints
- **PostgreSQL Required**: SQLite NOT supported due to nested transaction requirements
- Always use async database operations via asyncpg
- Use Alembic for ALL schema changes (no manual SQL)
- Test migrations with both upgrade and downgrade paths
- Keep migrations idempotent when possible

## References

- **Official MCP Specification**: https://modelcontextprotocol.io/specification/
- **FastMCP Python SDK**: https://github.com/modelcontextprotocol/python-sdk
- **Full Requirements Document**: [PROMPT.md](PROMPT.md) - Comprehensive architectural spec
- **Quick Start Guide**: [docs/QUICKSTART_MODERN.md](docs/QUICKSTART_MODERN.md) - Detailed setup with examples
- **Main README**: [README.md](README.md) - Project overview and getting started

---

**Last Updated**: 2026-01-09
**Project Status**: Pre-initial git commit, repository cleaned and organized
