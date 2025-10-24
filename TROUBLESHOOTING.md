# Troubleshooting - Claude Desktop Integration

## Problem: Tools not appearing / Gray toggle in Claude Desktop

### Symptoms
- MCP server is running (shows "running" status in Claude Desktop)
- Server logs show successful initialization
- Tools are listed in the logs
- But tools don't appear in Claude's UI, or toggle stays gray

### Diagnostic Steps

#### 1. Verify Package Version

Check which version Claude Desktop is using:

```bash
# In your MCP config, if using npx, the version should be updated automatically
npx -y prestashop-mcp-analytics@latest

# Or check installed version
npm list -g prestashop-mcp-analytics
```

**Expected:** Version 1.1.4 or later

#### 2. Check Claude Desktop Configuration

Location:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Correct configuration:**

```json
{
  "mcpServers": {
    "prestashop-analytics": {
      "command": "npx",
      "args": [
        "-y",
        "prestashop-mcp-analytics@latest"
      ],
      "env": {
        "PRESTASHOP_BASE_URL": "https://your-store.com",
        "PRESTASHOP_WS_KEY": "YOUR_32_CHAR_KEY_HERE"
      }
    }
  }
}
```

**Common mistakes:**
- ❌ Using `prestashop-mcp-analytics` instead of `prestashop-mcp-analytics@latest`
- ❌ Missing `@latest` suffix (keeps using old cached version)
- ❌ Wrong command name (should be `npx`, not `node`)
- ❌ Invalid environment variables

#### 3. Clear Cache and Restart

**Step 1: Completely quit Claude Desktop**
- macOS: Cmd+Q (not just close window)
- Windows: Right-click taskbar icon → Exit

**Step 2: Clear npm cache (optional)**
```bash
npx clear-npx-cache
# Or
rm -rf ~/.npm/_npx
```

**Step 3: Restart Claude Desktop**

**Step 4: Wait 10-15 seconds** for MCP server initialization

#### 4. Verify Server Output

Check Claude Desktop logs for the tools/list response:

**Look for this in the logs:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "prestashop_get_product_sales_stats",
        "description": "...",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",  // ✅ Must be present
          "$ref": "#/definitions/ProductSalesStatsInput",
          "definitions": { ... }
        },
        "annotations": {  // ✅ Must be present in v1.1.4+
          "readOnlyHint": true,
          "destructiveHint": false,
          "idempotentHint": true,
          "openWorldHint": true
        }
      },
      // ...
    ]
  }
}
```

**Red flags:**
- ❌ `inputSchema` contains `"_def"` or `"~standard"` → Zod object not converted (v1.1.2 or earlier)
- ❌ No `annotations` field → Missing in v1.1.3 or earlier
- ❌ No `$schema` field → Invalid JSON Schema

#### 5. Test Server Standalone

Run the server directly to check for errors:

```bash
cd /path/to/your/project
PRESTASHOP_BASE_URL=https://your-store.com \
PRESTASHOP_WS_KEY=YOUR_KEY_HERE \
npx -y prestashop-mcp-analytics@latest
```

**Expected output:**
```
🚀 Starting PrestaShop MCP Analytics Server...
📊 Version: 1.1.4
🔗 PrestaShop URL: https://your-store.com
✅ Environment validated
✨ PrestaShop MCP Analytics Server running via stdio
📋 Available tools:
  - prestashop_get_product_sales_stats
  - prestashop_get_top_products
```

Then type (to trigger tools/list):
```json
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

Press Enter twice, then Ctrl+D.

#### 6. Check Permissions

Ensure Claude Desktop has permission to:
- Execute npx commands
- Access network (for npm registry and PrestaShop API)
- Read/write temporary files

**macOS:** System Preferences → Security & Privacy → Privacy → Full Disk Access → Add Claude

#### 7. Verify PrestaShop Credentials

Test PrestaShop connection:

```bash
curl -u "YOUR_WS_KEY:" "https://your-store.com/api?output_format=JSON"
```

**Expected:** JSON response with API schema

**If fails:** Check:
- Webservice is enabled in PrestaShop
- WS_KEY has correct permissions (orders, order_details, products)
- URL is correct (include /api in curl, but NOT in PRESTASHOP_BASE_URL)

### Solutions by Symptom

#### Toggle Gray + No Tools Listed
→ Server not starting or crashing
- Check environment variables in config
- Look for error messages in Claude Desktop logs
- Test standalone (step 5)

#### Toggle Gray + Tools Listed in Logs
→ Schema format issue
- Verify `$schema` and `annotations` present in logs (step 4)
- Update to v1.1.4: `npx -y prestashop-mcp-analytics@latest`
- Clear cache (step 3)

#### Tools Appear but Can't Activate
→ Permissions or security issue
- Check Claude Desktop permissions (step 6)
- Restart Claude Desktop with admin/elevated privileges
- Check macOS Gatekeeper / Windows SmartScreen

#### Tools Work but Return Errors
→ PrestaShop connection issue
- Verify credentials (step 7)
- Check network connectivity
- Review PrestaShop Webservice permissions

### Still Not Working?

1. **Export logs:**
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`

2. **Create a minimal test case:**
   ```json
   {
     "mcpServers": {
       "test-only-prestashop": {
         "command": "npx",
         "args": ["-y", "prestashop-mcp-analytics@1.1.4"],
         "env": {
           "PRESTASHOP_BASE_URL": "https://demo.prestashop.com",
           "PRESTASHOP_WS_KEY": "YOUR_KEY"
         }
       }
     }
   }
   ```

3. **Report issue with:**
   - Claude Desktop version
   - Operating system
   - MCP server version (from logs: `📊 Version: ...`)
   - Full tools/list response from logs
   - Any error messages

### Version History

- **v1.1.4** (2025-01-24): Added annotations to tools/list response
- **v1.1.3** (2025-01-24): Fixed Zod → JSON Schema conversion
- **v1.1.2** (2025-01-24): Moved dotenv to devDependencies
- **v1.1.1** (2025-01-24): Fixed binary name
- **v1.1.0** (2025-01-24): Added order_states filtering
- **v1.0.0** (2025-01-15): Initial release

### Quick Fix Checklist

- [ ] Using `prestashop-mcp-analytics@latest` in config
- [ ] Completely quit and restarted Claude Desktop
- [ ] Cleared npx cache
- [ ] Verified environment variables are correct
- [ ] Checked logs show version 1.1.4
- [ ] Verified `$schema` and `annotations` in tools/list response
- [ ] Tested PrestaShop API connection with curl
- [ ] Waited 15 seconds after restart
- [ ] No other MCP servers causing conflicts

If all checked and still not working, please open an issue at:
https://github.com/DFRContact/prestashop-mcp-analytics/issues
