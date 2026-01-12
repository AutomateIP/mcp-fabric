# How to Install MCP Servers - It's THIS Easy

## The Easiest Way (3 Steps)

1. **Open the Gateway**: http://localhost:3000

2. **Click the big green "⚡ Quick Install" button**

3. **Paste your command** like this:
   ```
   uv pip install duckduckgo-mcp-server
   ```

4. **Press Enter** (or click "⚡ Install Now")

**That's it!** Your server is installed, configured, and connected automatically.

---

## What You Can Paste

The Quick Install understands ANY of these formats:

### Full UV Command (Recommended - Fastest)
```bash
uv pip install duckduckgo-mcp-server
```

### Full Pip Command
```bash
pip install mcp-memory-server
```

### Just the Package Name
```bash
mcp-server-fetch
```

It automatically figures out what you mean and installs it!

---

## Popular MCP Servers

Copy-paste any of these directly:

### Web Search
```bash
uv pip install duckduckgo-mcp-server
```

### Memory/Storage
```bash
uv pip install mcp-memory-server
```

### HTTP/Web Fetch
```bash
uv pip install mcp-server-fetch
```

### Git Operations
```bash
uv pip install mcp-server-git
```

---

## What Happens Automatically

When you paste a command:

1. ✅ **Package name extracted** - Automatically parsed from your command
2. ✅ **Server name generated** - Friendly name created (e.g., "Duckduckgo")
3. ✅ **Installation started** - Package installed using uv (super fast) or pip
4. ✅ **Entry point detected** - Automatically finds how to run the server
5. ✅ **Server configured** - Connection settings auto-configured
6. ✅ **Server connected** - Automatically connects and discovers tools
7. ✅ **Tools available** - All server tools immediately available for use

**You do NOTHING except paste the command!**

---

## Visual Guide

### Step 1: Main Page
When you open http://localhost:3000, you'll see:

```
┌─────────────────────────────────────────────────────┐
│  Servers                                            │
│  Southbound MCP servers • Paste install command ⚡  │
│                                                     │
│                        [⚡ Quick Install] [Advanced]│
└─────────────────────────────────────────────────────┘
```

The **⚡ Quick Install** button is BIG, GREEN, and OBVIOUS.

### Step 2: Quick Install Modal
Click it and you see:

```
┌──────────────────────────────────────────────┐
│  ⚡ Quick Install                            │
│  Just paste: uv pip install package-name     │
│                                              │
│  📋 Paste your install command here          │
│  ┌──────────────────────────────────────┐   │
│  │ uv pip install duckduckgo-mcp-server │   │ <- BIG INPUT
│  └──────────────────────────────────────┘   │
│                                              │
│  ✓ Ready to install          [UV (fast)]    │
│  Server name: Duckduckgo                     │
│  Package: duckduckgo-mcp-server              │
│  Command: uv pip install duckduckgo-mcp-...│
│                                              │
│  💡 Popular packages:                        │
│  [duckduckgo-mcp-server] [mcp-memory-server]│
│                                              │
│                      [⚡ Install Now]         │
└──────────────────────────────────────────────┘
```

### Step 3: Done!
Server appears in your list, already connected and working.

---

## Why This is Easy

### Before (Traditional Installation)
1. Find package on PyPI
2. Copy package name
3. Open terminal
4. Run install command
5. Figure out how to run the package
6. Open gateway UI
7. Click "Add Server"
8. Fill out 7+ form fields:
   - Name
   - Description
   - Transport type
   - Installation type
   - Package name
   - UV checkbox
   - Connection config
9. Click "Create Server"
10. Wait and hope it works

**10 steps, multiple tools, lots of typing**

### Now (Quick Install)
1. Click "⚡ Quick Install"
2. Paste command
3. Press Enter

**3 clicks/actions, done in 5 seconds**

---

## Advanced Options (If You Need Them)

If you want manual control, click the **"Advanced"** button instead. This gives you the full ServerForm with all options:
- Custom server name/description
- Manual command configuration
- Git repository installation
- System command installation
- Custom transport settings

But for 95% of use cases, **just use Quick Install!**

---

## Troubleshooting

### "Package not found"
- Check spelling of package name
- Make sure package exists on PyPI: https://pypi.org

### "Installation failed"
- View the server in the list
- Click "View" to see installation logs
- Error details will show what went wrong

### "Server won't connect"
- Entry point might not be auto-detected
- Click "Edit" on the server
- Manually configure command/args
- Usually: `python -m package_name`

---

## Examples

### Example 1: DuckDuckGo Search in 5 Seconds

1. Open http://localhost:3000
2. Click "⚡ Quick Install"
3. Paste: `uv pip install duckduckgo-mcp-server`
4. Press Enter
5. Done! Server "Duckduckgo" appears with search tools

### Example 2: Memory Server

1. Click "⚡ Quick Install"
2. Paste: `uv pip install mcp-memory-server`
3. Press Enter
4. Done! Server "Memory" appears with storage tools

### Example 3: Just Package Name

1. Click "⚡ Quick Install"
2. Type: `mcp-server-fetch`
3. Press Enter
4. Done! Server "Server Fetch" appears with HTTP tools

---

## Tips

- **Use UV** (it's 10-100x faster than pip)
- **Press Enter** to install (no need to click button)
- **Click popular packages** to auto-fill the command
- **Empty state hint** - When no servers exist, big button shows you exactly what to do

---

## That's It!

No terminal commands, no config files, no manual setup.

Just paste and go. ⚡

Open http://localhost:3000 and try it now!
