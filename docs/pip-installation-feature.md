# Pip Installation Feature - Quick MCP Server Setup

## Overview

You can now install MCP servers directly from PyPI using simple commands like:
```bash
uv pip install duckduckgo-mcp-server
```

The gateway handles everything automatically: installation, entry point detection, and configuration.

## How to Use

### Web UI Method (Recommended)

1. **Open the Gateway UI**: http://localhost:3000
2. **Click "Add Server"**
3. **Fill in basic info**:
   - Name: e.g., "DuckDuckGo Search"
   - Description: "Search the web with DuckDuckGo"
   - Transport Type: **STDIO** (required for pip packages)

4. **Select Installation Type**: **Install from PyPI (pip/uv)**

5. **You'll see a user-friendly form** with:
   - Package name input (e.g., `duckduckgo-mcp-server`)
   - Checkbox to use `uv` instead of `pip` (faster, recommended)
   - Quick-fill buttons for popular packages
   - Command preview showing what will run

6. **Click "Create Server"**
   - Gateway installs the package
   - Auto-detects the entry point
   - Connects to the server
   - Discovers available tools

### Popular MCP Servers

The UI includes quick-fill buttons for these popular packages:

| Package Name | Description |
|-------------|-------------|
| `duckduckgo-mcp-server` | Web search with DuckDuckGo |
| `mcp-memory-server` | Persistent memory for agents |
| `mcp-server-fetch` | HTTP requests and web scraping |

Just click the button to auto-fill the package name!

### UV vs Pip

**UV (Recommended)**:
- ✅ 10-100x faster than pip
- ✅ Better dependency resolution
- ✅ Works great in Docker containers
- Check the "Use uv pip install" checkbox

**Pip (Standard)**:
- ✅ Always available
- ✅ Well-tested and reliable
- Leave checkbox unchecked

## What Happens Behind the Scenes

1. **Installation**:
   ```bash
   # With uv (faster):
   uv pip install <package-name> --target /app/mcp-servers/<server-id>

   # With pip (standard):
   pip install <package-name> --target /app/mcp-servers/<server-id>
   ```

2. **Entry Point Detection**:
   - Searches for `__main__.py` (can run with `python -m package_name`)
   - Checks `bin/` directory for executables
   - Falls back to common script names

3. **Auto-Configuration**:
   - Detected entry point is automatically added to `connection_config`
   - STDIO transport is configured
   - Server is ready to connect

4. **If Detection Fails**:
   - Installation still succeeds
   - You can manually configure the command/args later
   - Installation path is saved for reference

## API Method

You can also use the API directly:

```bash
curl -X POST http://localhost:8000/api/servers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DuckDuckGo Search",
    "description": "Search the web",
    "transport_type": "stdio",
    "installation_type": "pip",
    "pip_package": "duckduckgo-mcp-server",
    "use_uv": true,
    "connection_config": {}
  }'
```

## UI Features

The pip installation form includes:

### 📦 Package Name Input
- Simple text input
- Placeholder shows example
- Validation ensures it's not empty

### ⚡ UV Checkbox
- Toggle between pip and uv
- Explains uv is faster
- Shows command preview updates

### 💡 Popular Packages
- Quick-fill buttons
- Click to auto-populate package name
- Saves typing and prevents typos

### 👁️ Command Preview
- Shows exactly what will run
- Updates in real-time
- Example: `uv pip install duckduckgo-mcp-server`

### ℹ️ Help Text
- Explains auto-detection
- Links to documentation
- Clear error messages

## Installation Status

After submission, you can:

1. **View the server details** to see:
   - Install status: `installing` → `completed` or `failed`
   - Installation path
   - Installation log (full output)
   - Detected entry point

2. **Check logs** if installation fails:
   - Click "View" on the server
   - Scroll to Connection Configuration
   - See full pip/uv output

## Troubleshooting

### Installation Fails

**Check the install log**:
1. Go to Servers page
2. Click "View" on the failed server
3. Look at Install Status and Install Log

**Common issues**:
- Package doesn't exist on PyPI → Check spelling
- Network issues → Retry
- Permission issues → Check Docker setup

### Entry Point Not Detected

**Manual configuration**:
1. Installation succeeds but server won't connect
2. Click "Edit" on the server
3. Add command/args manually:
   ```
   Command: python
   Args: -m package_name
   ```

### Server Won't Connect

**Check**:
1. Install Status = "completed"
2. Connection Config has command/args
3. Package actually provides MCP server functionality

**Debug**:
- View install log for errors
- Check if package requires additional setup
- Verify package is an MCP server (not a client library)

## Examples

### Example 1: DuckDuckGo Search

```
Name: DuckDuckGo Search
Description: Search the web with DuckDuckGo
Transport: STDIO
Installation: Install from PyPI (pip/uv)
Package: duckduckgo-mcp-server
Use uv: ✓ (checked)
```

**Result**: Installs in ~2 seconds with uv, auto-detects entry point, connects automatically.

### Example 2: Memory Server

```
Name: Memory Server
Description: Persistent storage for agent memory
Transport: STDIO
Installation: Install from PyPI (pip/uv)
Package: mcp-memory-server
Use uv: ✓ (checked)
```

**Result**: Installs, detects `python -m mcp_memory_server`, ready to use.

### Example 3: Custom Package

```
Name: My Custom Server
Description: Internal MCP server
Transport: STDIO
Installation: Install from PyPI (pip/uv)
Package: my-company-mcp-server
Use uv: ☐ (unchecked, using pip)
```

**Result**: Installs from your private PyPI, may need manual entry point configuration.

## Comparison with Other Methods

| Method | Speed | Complexity | Auto-Config |
|--------|-------|------------|-------------|
| **Pip Install** | ⚡⚡⚡ Fast | ✅ Easy | ✅ Yes |
| Git Clone | ⚡⚡ Slower | 😐 Medium | ✅ Yes |
| System (npx) | ⚡⚡⚡ Fast | ✅ Easy | ❌ Manual |

## Technical Details

### Backend

- **New Model Fields**:
  - `installation_type`: Now includes "pip"
  - `pip_package`: Package name from PyPI
  - `use_uv`: Boolean flag for uv vs pip

- **PipServerManager**:
  - Handles installation
  - Creates isolated directories
  - Auto-detects entry points
  - Logs all output

- **Installation Process**:
  - Async subprocess execution
  - Timeout protection
  - Error handling
  - Log capture

### Frontend

- **ServerForm Component**:
  - New "pip" installation type option
  - Dedicated pip configuration section
  - Quick-fill buttons
  - Real-time command preview
  - Form validation

- **Styling**:
  - Green theme for pip section (vs blue for git)
  - Clear visual hierarchy
  - Helpful examples
  - Error guidance

### Database

- **Migration**: `add_pip_support_001`
- **New Columns**:
  - `pip_package` (String255)
  - `use_uv` (Boolean, default false)

## Security Notes

- Packages installed to isolated directories
- No system-wide installation
- Each server has its own directory
- Directory path: `/app/mcp-servers/<server-id>`
- Easy cleanup (just delete directory)

## Performance

| Operation | Time (with uv) | Time (with pip) |
|-----------|----------------|-----------------|
| Install small package | 2-5 seconds | 10-30 seconds |
| Install large package | 10-20 seconds | 60-120 seconds |
| Entry point detection | <1 second | <1 second |

## Future Enhancements

Potential improvements:
- [ ] Package search/autocomplete from PyPI
- [ ] Version pinning
- [ ] Requirements.txt support
- [ ] Virtual environment per server
- [ ] Package update mechanism
- [ ] Dependency conflict detection

---

**Status**: ✅ Fully Implemented and Deployed
**Available**: http://localhost:3000
**API Docs**: http://localhost:8000/docs
