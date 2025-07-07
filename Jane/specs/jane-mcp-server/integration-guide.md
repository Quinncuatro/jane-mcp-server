---
title: Jane MCP Server - Integration Guide
description: >-
  Complete guide for integrating Jane with MCP clients including Claude Desktop
  and Claude Code
tags:
  - integration
  - claude-desktop
  - claude-code
  - mcp-clients
  - configuration
createdAt: '2025-06-30T22:04:05.736Z'
updatedAt: '2025-06-30T22:04:05.737Z'
---
# Jane MCP Server - Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the Jane MCP server with various MCP clients, including Claude Desktop, Claude Code, and custom implementations. It covers configuration, troubleshooting, and optimization for different use cases.

## MCP Client Compatibility

### Supported Clients
- **Claude Desktop**: Full feature support with UI integration
- **Claude Code CLI**: Command-line access to all tools and resources
- **MCP Inspector**: Development and testing tool
- **Custom MCP Clients**: Any client implementing MCP protocol v2024-11-05

### Protocol Requirements
- **MCP Version**: 2024-11-05 or compatible
- **Transport**: Stdio (JSON-RPC over stdin/stdout)
- **Message Format**: JSON-RPC 2.0
- **Capabilities**: Tools and Resources support

## Claude Desktop Integration

### Prerequisites
- Claude Desktop installed and running
- Node.js 18+ installed on system
- Jane MCP server built and tested

### Configuration Steps

#### 1. Build Jane Server
```bash
# Navigate to Jane directory
cd /path/to/jane-mcp-server

# Install dependencies and build
npm install
npm run build

# Test server startup
npm start
# Should see: "Jane MCP server is running and ready for connections"
# Press Ctrl+C to stop
```

#### 2. Locate Claude Desktop Config
**macOS**:
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows**:
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux**:
```bash
~/.config/Claude/claude_desktop_config.json
```

#### 3. Configure MCP Server
Edit the Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "jane": {
      "command": "node",
      "args": [
        "/absolute/path/to/jane-mcp-server/dist/index.js"
      ]
    }
  }
}
```

**Important**: Use the absolute path to your Jane server's compiled `dist/index.js` file.

#### 4. Configure Document Storage (Optional)
```json
{
  "mcpServers": {
    "jane": {
      "command": "node",
      "args": [
        "/absolute/path/to/jane-mcp-server/dist/index.js"
      ],
      "env": {
        "JANE_DIR": "/path/to/your/documents"
      }
    }
  }
}
```

#### 5. Restart Claude Desktop
1. Completely quit Claude Desktop
2. Restart the application
3. Look for the 📎 (attachment) icon in the input field
4. Click the icon to see available MCP servers
5. Select "jane" from the dropdown

### Claude Desktop Usage

#### Accessing Jane Tools
1. Click the 📎 icon in the message input
2. Select "jane" from the MCP servers list
3. Choose a tool from the available options:
   - `list_stdlibs` - List available languages or documents
   - `list_specs` - List available projects or specifications
   - `search` - Search through documents
   - `get_stdlib` - Retrieve standard library documentation
   - `get_spec` - Retrieve specification documents
   - `create_document` - Create new documentation
   - `update_document` - Update existing documents

#### Example Interactions
```
User: Show me all available standard libraries
(Claude uses list_stdlibs tool)

User: Search for JavaScript array methods
(Claude uses search tool with query "array methods" and type "stdlib")

User: Get the JavaScript array methods documentation
(Claude uses get_stdlib tool with language "javascript" and path "array-methods.md")
```

### Troubleshooting Claude Desktop

#### Common Issues

**1. Jane server not appearing in MCP list**
- Verify absolute path in configuration
- Check Node.js is accessible from command line
- Restart Claude Desktop completely
- Check Claude Desktop logs

**2. "No tools available" or empty tool list**
- Verify server builds successfully: `npm run build`
- Test server manually: `echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/index.js`
- Check for JavaScript errors in server startup

**3. Document operations fail**
- Verify Jane directory exists and is writable
- Check JANE_DIR environment variable if set
- Run diagnostics: `npx tsx tests/jane-diagnostics.ts`

**4. Permission errors**
- Ensure Jane directory has proper permissions
- Check disk space availability
- Verify Node.js can write to the specified directory

#### Diagnostic Commands
```bash
# Test server startup
timeout 5s npm start
echo $? # Should be 124 (timeout) for successful startup

# Test MCP protocol
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npm start

# Check Jane directory
ls -la Jane/
find Jane/ -name "*.md" | head -5

# Run comprehensive diagnostics
npx tsx tests/jane-diagnostics.ts
```

## Claude Code Integration

### Prerequisites
- Claude Code CLI installed
- Node.js 18+ available in PATH
- Jane MCP server built and accessible

### Configuration

#### Direct Command Line Usage
```bash
# Start Jane server and connect Claude Code
claude-code --mcp="node /path/to/jane-mcp-server/dist/index.js"
```

#### Using Environment Variables
```bash
# Set custom document directory
export JANE_DIR=/path/to/documents

# Start with custom environment
JANE_DIR=/path/to/documents claude-code --mcp="node /path/to/jane-mcp-server/dist/index.js"
```

#### Configuration File (if supported)
```json
{
  "mcp": {
    "servers": {
      "jane": {
        "command": "node",
        "args": ["/path/to/jane-mcp-server/dist/index.js"],
        "env": {
          "JANE_DIR": "/path/to/documents"
        }
      }
    }
  }
}
```

### Claude Code Usage

#### Command Examples
```bash
# List available standard libraries
claude-code "What standard libraries are available?"

# Search for documentation
claude-code "Search for 'array methods' in the documentation"

# Get specific documentation
claude-code "Get the JavaScript array methods documentation"

# Create new documentation
claude-code "Create documentation for Python dictionaries"
```

#### Interactive Mode
```bash
# Start interactive session with Jane
claude-code --mcp="node /path/to/jane-mcp-server/dist/index.js"

# Then use natural language to interact with Jane tools
> List all available programming languages
> Search for "REST API" in specifications
> Create a new document about TypeScript interfaces
```

### Troubleshooting Claude Code

#### Common Issues

**1. MCP connection fails**
- Verify Jane server path is correct
- Test server independently: `node /path/to/jane-mcp-server/dist/index.js`
- Check Node.js version compatibility

**2. Document operations fail**
- Verify JANE_DIR environment variable
- Check file system permissions
- Test with simple operations first

**3. Performance issues**
- Monitor memory usage during large operations
- Consider splitting large document operations
- Use search filters to reduce result sets

## Custom MCP Client Integration

### MCP Protocol Implementation

#### Required Dependencies
```typescript
// TypeScript/JavaScript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
```

#### Basic Client Setup
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Create transport
const transport = new StdioClientTransport({
  command: "node",
  args: ["/path/to/jane-mcp-server/dist/index.js"]
});

// Create client
const client = new Client({
  name: "my-jane-client",
  version: "1.0.0"
});

// Connect
await client.connect(transport);
```

#### Tool Usage
```typescript
// List available tools
const tools = await client.listTools();
console.log("Available tools:", tools.tools.map(t => t.name));

// Call a tool
const result = await client.callTool({
  name: "list_stdlibs",
  arguments: {}
});

console.log("Tool result:", result.content[0].text);
```

#### Resource Usage
```typescript
// List available resources
const resources = await client.listResources();

// Read a resource
const resource = await client.readResource({
  uri: "stdlib://javascript/array-methods.md"
});

console.log("Resource content:", resource.contents[0].text);
```

### Error Handling
```typescript
try {
  const result = await client.callTool({
    name: "get_stdlib",
    arguments: {
      language: "javascript",
      path: "nonexistent.md"
    }
  });
} catch (error) {
  if (error.code === -32000) {
    console.log("Server error:", error.message);
  } else {
    console.log("Other error:", error);
  }
}
```

## MCP Inspector Integration

### Installation and Setup
```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Start inspector with Jane
npx @modelcontextprotocol/inspector node /path/to/jane-mcp-server/dist/index.js
```

### Inspector Usage

#### Interactive Testing
1. Open browser to inspector URL (usually http://localhost:5173)
2. Explore available tools and resources
3. Test tool calls with different parameters
4. View JSON-RPC messages in real-time
5. Debug protocol-level issues

#### Tool Testing
```json
{
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": {
      "query": "array methods",
      "type": "stdlib",
      "includeContent": false
    }
  }
}
```

#### Resource Testing
```json
{
  "method": "resources/read",
  "params": {
    "uri": "stdlib://javascript/array-methods.md"
  }
}
```

## Advanced Configuration

### Performance Optimization

#### Memory Configuration
```json
{
  "mcpServers": {
    "jane": {
      "command": "node",
      "args": [
        "--max-old-space-size=512",
        "/path/to/jane-mcp-server/dist/index.js"
      ]
    }
  }
}
```

#### Custom Document Directory
```json
{
  "mcpServers": {
    "jane": {
      "command": "node",
      "args": ["/path/to/jane-mcp-server/dist/index.js"],
      "env": {
        "JANE_DIR": "/mnt/shared-docs/jane",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Multi-Environment Setup

#### Development Configuration
```json
{
  "mcpServers": {
    "jane-dev": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/path/to/jane-mcp-server",
      "env": {
        "JANE_DIR": "/path/to/dev-docs"
      }
    }
  }
}
```

#### Production Configuration
```json
{
  "mcpServers": {
    "jane-prod": {
      "command": "node",
      "args": ["/opt/jane/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "JANE_DIR": "/var/lib/jane/documents"
      }
    }
  }
}
```

## Security Considerations

### Access Control
- Jane operates with file system permissions of the user running Claude Desktop/Code
- Documents are accessible to any process with read access to Jane directory
- No built-in authentication or authorization

### File System Security
```bash
# Set restrictive permissions on Jane directory
chmod 700 /path/to/jane/documents
chown $USER:$USER /path/to/jane/documents
```

### Network Security
- Jane uses stdio transport (no network exposure)
- All communication is local process-to-process
- No external network access required

## Best Practices

### Document Organization
- Use clear, descriptive document titles
- Organize documents in logical language/project hierarchies
- Include comprehensive tags for better searchability
- Maintain consistent naming conventions

### Performance Optimization
- Use search filters to reduce result sets
- Avoid including content in search results unless needed
- Monitor Jane directory size and clean up obsolete documents
- Consider using external backup solutions for important documents

### Maintenance
- Regularly update Jane server to latest version
- Monitor Claude Desktop/Code logs for errors
- Backup Jane documents directory
- Test configuration changes in development environment first

## Integration Examples

### Workflow Examples

#### Documentation Discovery Workflow
1. Use `list_stdlibs` to see available languages
2. Use `search` to find relevant documentation
3. Use `get_stdlib` to retrieve specific documents
4. Use Claude to summarize or explain the documentation

#### Content Creation Workflow
1. Use `search` to check for existing similar content
2. Use `create_document` to add new documentation
3. Use `update_document` to revise and improve content
4. Use `search` to verify new content is discoverable

#### Knowledge Management Workflow
1. Regular use of `search` for content discovery
2. Systematic use of `create_document` for new knowledge
3. Periodic use of `update_document` for content maintenance
4. Use of tags and descriptions for better organization
