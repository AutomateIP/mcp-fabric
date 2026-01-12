# Manual Browser Test Checklist - Modal Enhancement

**Date**: 2026-01-10
**Application URL**: http://localhost:3000
**Purpose**: Validate SlidePanel implementation for server and instance detail views

---

## Pre-Test Setup

- [ ] Open browser (Chrome, Firefox, or Safari recommended)
- [ ] Navigate to http://localhost:3000
- [ ] Verify application loads without console errors (F12 > Console tab)
- [ ] Confirm you can see the main dashboard

---

## Test 1: Server Details Panel (Git-Installed Server)

**Target**: Git Test Server (ID: 424a829f-f15d-4987-8976-04fc5c1f6262)

### Steps:
1. [ ] Navigate to "Servers" page/section
2. [ ] Locate "Git Test Server" in the list
3. [ ] Click "View" or "Details" button

### Expected Results:
- [ ] Panel slides in smoothly from the right side (not center popup)
- [ ] Panel width is significantly larger than old modal (~80% of screen)
- [ ] Panel has gradient header with server name as title
- [ ] Close button (X) visible in top-right corner

### Content Validation:
- [ ] **Status Banner** visible at top showing:
  - Connection Status: "connected" (green badge)
  - Transport: "stdio" or "streamable_http"
  - Tools Discovered: Number displayed prominently

- [ ] **Blue "Git Installation" card** visible in left column containing:
  - [ ] Install Status badge: "completed" (green)
  - [ ] Repository URL: https://github.com/modelcontextprotocol/servers
  - [ ] Branch: "main"
  - [ ] Commit: First 8 chars of SHA (9691b958)
  - [ ] Installation Path: /app/mcp-servers/...
  - [ ] Installed timestamp: Recent date/time

- [ ] **Metadata section** below Git Installation showing:
  - [ ] Created date
  - [ ] Last Connected date (if applicable)
  - [ ] Session ID (if applicable)
  - [ ] Installation Type: "git"

- [ ] **Connection Configuration** section:
  - [ ] Collapsible (click to expand/collapse)
  - [ ] Shows JSON when expanded

- [ ] **Tools List** in right column:
  - [ ] Tools display with numbering (#1, #2, etc.)
  - [ ] Each tool shows name in monospace font
  - [ ] Tool descriptions visible
  - [ ] Hover effect changes background color
  - [ ] Scrollable if many tools

### Interaction Tests:
- [ ] Click backdrop (dark area outside panel) → Panel closes
- [ ] Press ESC key → Panel closes
- [ ] Click X button → Panel closes
- [ ] Click "View Tools API" button → Opens new tab with API response
- [ ] Expand/collapse Connection Configuration → Works smoothly

---

## Test 2: Server Details Panel (System-Installed Server)

**Target**: itential-mcp (System installation)

### Steps:
1. [ ] Navigate to "Servers" page/section
2. [ ] Locate "itential-mcp" in the list
3. [ ] Click "View" or "Details" button

### Expected Results:
- [ ] Panel slides in from right (same as Test 1)
- [ ] **No Git Installation section** visible (this is system-installed)
- [ ] Status banner shows 17 tools
- [ ] Metadata shows Installation Type: "system"
- [ ] All other sections work as expected

---

## Test 3: Instance Details Panel

**Target**: time-tools instance (ID: 42486536-4d92-4211-9f81-463d414b0a39)

### Steps:
1. [ ] Navigate to "Instances" page/section
2. [ ] Locate "time-tools" instance
3. [ ] Click "View" or "Details" button

### Expected Results:
- [ ] Panel slides in from right with large width
- [ ] Title shows "time-tools"
- [ ] Subtitle shows "Time server tools only"

### Content Validation - Status Banner:
- [ ] **Endpoint Path** displayed in monospace with border
- [ ] **Tools Configured**: Shows "1" prominently
- [ ] **Tags**: Shows tags if present (may be empty)

### Content Validation - Left Column:
- [ ] **Metadata card** showing:
  - [ ] Created date
  - [ ] Last Updated date
  - [ ] Instance ID in monospace

- [ ] **All Tags section** (if instance has tags)

- [ ] **MCP Configuration card** (PROMINENT - blue background):
  - [ ] Title has code icon (</>)
  - [ ] "Copy Config" button visible
  - [ ] JSON configuration displayed with syntax highlighting
  - [ ] Shows structure: `{"mcpServers": {"time-tools": {...}}}`
  - [ ] URL shows: http://localhost:8000/mcp/instances/...
  - [ ] Transport shows: "streamableHttp"
  - [ ] Help text below: "How to use: Copy this configuration..."

### Content Validation - Right Column:
- [ ] **Tools section** header shows "Tools (1)"
- [ ] Tool card displays:
  - [ ] Tool name: "current_time" (monospace font, primary color)
  - [ ] Tool number: "#1"
  - [ ] Source badge: "time-server" (primary badge)
  - [ ] Description: "Returns the current time."
  - [ ] Hover effect on tool card

### Interaction Tests:
- [ ] Click "Copy Config" button → Button shows "✓ Copied" briefly
- [ ] Verify clipboard contains JSON (paste into text editor)
- [ ] Click "Open Endpoint" button → Opens endpoint in new tab
- [ ] Click backdrop → Panel closes
- [ ] Press ESC key → Panel closes
- [ ] Click X button → Panel closes
- [ ] Click "Close" button at bottom → Panel closes

---

## Test 4: Responsive Design

### Desktop (Wide Screen):
- [ ] Panel uses two-column layout (grid)
- [ ] Left column: Metadata, tags, MCP config
- [ ] Right column: Tools list
- [ ] Comfortable spacing between columns

### Tablet/Narrow (resize browser to ~800px width):
- [ ] Resize browser window to narrow width
- [ ] Two-column layout collapses to single column
- [ ] All content still readable and accessible
- [ ] Panel width adjusts appropriately

---

## Test 5: Multiple Operations

### Test Panel State Management:
1. [ ] Open server details panel
2. [ ] Close it
3. [ ] Open different server details panel
4. [ ] Verify correct data displays (no state pollution)

### Test Instance Operations:
1. [ ] Open instance details panel
2. [ ] Copy MCP config
3. [ ] Close panel
4. [ ] Open different instance
5. [ ] Verify correct config displays

---

## Test 6: Performance & Visual Quality

- [ ] Panel animation is smooth (no jank)
- [ ] No layout shift when panel opens
- [ ] Text is readable (proper contrast)
- [ ] Colors are visually appealing
- [ ] Scrolling within panel is smooth
- [ ] No horizontal scrollbar in panel content
- [ ] Loading states display properly (if applicable)

---

## Test 7: Browser Compatibility (Optional)

Test in multiple browsers if available:

### Chrome/Edge:
- [ ] All tests pass

### Firefox:
- [ ] All tests pass

### Safari:
- [ ] All tests pass

---

## Test 8: Console & Network (Developer Tools)

- [ ] Open DevTools (F12)
- [ ] Console tab: No errors when opening panels
- [ ] Network tab: Verify API calls succeed:
  - [ ] GET /api/servers/{id} returns 200
  - [ ] GET /api/instances/{id}/details returns 200
- [ ] React DevTools (if installed): No unnecessary re-renders

---

## Known Issues to Watch For

Document any issues found:

1. **Panel Animation Issues**:
   - Describe: ___________________________________
   - Severity: ___________________________________

2. **Data Display Issues**:
   - Describe: ___________________________________
   - Severity: ___________________________________

3. **Interaction Issues**:
   - Describe: ___________________________________
   - Severity: ___________________________________

4. **Layout/Responsive Issues**:
   - Describe: ___________________________________
   - Severity: ___________________________________

---

## Test Result Summary

**Date Completed**: _____________
**Tester**: _____________
**Browser(s) Tested**: _____________

**Overall Result**: [ ] PASS  [ ] FAIL  [ ] PARTIAL

**Critical Issues Found**: _____________

**Recommendations**:
_____________________________________________
_____________________________________________
_____________________________________________

---

## Sign-off

I confirm that I have manually tested the enhanced slide panels for both server and instance detail views, and they function as expected according to this checklist.

**Signature**: ________________
**Date**: ________________

