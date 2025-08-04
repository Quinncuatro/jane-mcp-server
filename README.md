# Jane - Knowledge Management for AI Teams

Jane is a Model Context Protocol (MCP) server that transforms your team's documentation into an AI-accessible knowledge base. Built with TypeScript and the official MCP SDK, Jane allows Claude and other MCP-compatible clients to search, access, and manage your standard library documentation and project specifications with SQLite-powered performance.

**Perfect for development teams who want to:**
- 📚 Make their documentation instantly searchable by AI assistants
- 🔍 Quickly find APIs, coding standards, and architectural decisions
- 📝 Keep project specifications and requirements accessible
- 🚀 Onboard new team members faster with searchable knowledge

## Prerequisites

- **Node.js 18+** and **npm 8+**
- **MCP-compatible client**: Claude Desktop, Claude Code, or custom MCP client
- **5 minutes** for setup and first successful query

## Quick Start

Get Jane running with your first successful query in 3 steps:

### 1. Install and Build
```bash
git clone <repository-url>
cd jane-mcp-server
npm install
npm run build
```

### 2. Test the Server
```bash
npm start
```
✅ **You should see:** `"Jane MCP server is running and ready for connections"`  
Press `Ctrl+C` to stop when you see this message.

### 3. Connect to Claude Desktop
Add Jane to your Claude Desktop configuration:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "jane": {
      "command": "node",
      "args": ["/absolute/path/to/jane-mcp-server/dist/index.js"]
    }
  }
}
```

**Important:** Replace `/absolute/path/to/jane-mcp-server/dist/index.js` with your actual absolute path.

Restart Claude Desktop and look for the 📎 (attachment) icon in the input field to access Jane's tools.

### 4. Create Your First Documents
Get started by conversationally creating documents through Claude Desktop:

**Basic Document Creation:**
```
You: "Help me create a JavaScript reference document about array methods in Jane."

Claude: I'll create a comprehensive JavaScript array methods reference for you using Jane's document management.

[Claude uses Jane's create_document tool to create a well-structured stdlib document]
```

**Advanced Workflow - Research + Documentation:**
```
You: "Use Context7 to research the latest Ruby testing frameworks, then create a Jane reference document with current best practices and examples."

Claude: I'll research current Ruby testing approaches and create a comprehensive reference document for your Jane knowledge base.

[Claude researches via Context7, then creates a detailed Ruby testing document in Jane combining latest practices with practical examples]
```

**Project Specifications:**
```
You: "Create a project specification document for my e-commerce web app, including architecture decisions and API requirements."

Claude: I'll help you create a structured project specification document in Jane.

[Claude creates a comprehensive spec document with architecture notes, API design, and requirements]
```

**Test Your Setup:**
After creating documents, verify everything works:
```
You: "Search my documentation for 'array methods'"
You: "What Ruby testing resources do I have?"
You: "Show me all my project specifications"
```

## Key Features

- **🔍 Smart Document Search**: SQLite-powered full-text search with intelligent indexing that only processes new/modified documents
- **🤖 AI-Native Integration**: Seamlessly works with Claude Desktop, Claude Code, and custom MCP clients
- **📊 Performance Optimized**: Context window preservation through efficient SQLite database storage
- **📁 Flexible Organization**: Supports both standard library docs and project specifications
- **⚡ Zero Configuration**: Works out of the box with sensible defaults and automatic setup

## Usage Examples

### For Development Teams

**API Documentation Management:**
```
"Search for authentication endpoints in our API docs"
→ Jane finds and returns relevant REST API specifications
```

**Team Knowledge Sharing:**
```
"Show me our coding standards for TypeScript"
→ Jane retrieves team-specific development guidelines
```

**Technical Specifications:**
```
"Find the database schema requirements for the user service"
→ Jane searches project specs and returns architecture details
```

### Document Types Jane Manages

- **Standard Library Docs** (`stdlib`): Language-specific documentation (JavaScript, TypeScript, Python, etc.)
- **Project Specifications** (`specs`): Requirements, architecture docs, API specs, team guidelines

## MCP Tools

Jane provides 7 MCP tools for comprehensive document management:

### Discovery Tools
- **`list_stdlibs`** - Browse available programming languages and their documentation
- **`list_specs`** - Explore your project specifications and technical docs
- **`search`** - Full-text search across all documents with filtering options

### Document Access
- **`get_stdlib`** - Retrieve specific standard library documentation
- **`get_spec`** - Access project specifications and technical documents

### Content Management
- **`create_document`** - Add new documentation with structured metadata
- **`update_document`** - Modify existing documents and their metadata

## Integration Guides

### Claude Desktop Setup

1. **Build Jane** (if not done already):
   ```bash
   npm run build
   ```

2. **Find your absolute path**:
   ```bash
   pwd
   # Copy the output, you'll need: /that/path/dist/index.js
   ```

3. **Update Claude Desktop config** with the JSON above

4. **Restart Claude Desktop completely** (quit and reopen)

5. **Test the integration**:
   - Look for the 📎 icon in the input area
   - Select "jane" from the MCP servers dropdown
   - Try: "List available standard libraries"

### Claude Code Integration

Add Jane as an MCP server to Claude Code:

```bash
# Add Jane MCP server to Claude Code
claude mcp add jane node /absolute/path/to/jane-mcp-server/dist/index.js

# Start Claude Code interactive session
claude
```

**Verify the connection:**
```bash
# List configured MCP servers
claude mcp list

# Test Jane integration
> /mcp
# Select "jane" from the interactive menu to verify connection
```

## Configuration

### Document Structure
Jane automatically creates and organizes documents in a clear hierarchy:
```
Jane/                    # Auto-created by server on first run
├── stdlib/              # Standard library documentation
│   ├── javascript/      # Language-specific folders (created as needed)
│   ├── typescript/
│   └── python/
└── specs/               # Project specifications  
    ├── my-project/      # Project-specific folders (created as needed)
    └── other-project/
```

**Note:** The Jane directory is completely user-managed and not tracked by Git. The server's `ensureJaneStructure()` function automatically creates the directory structure when needed.

### SQLite Database
- **Location**: `./document-index.db` (automatically created)
- **Technology**: SQLite FTS5 for full-text search
- **Smart Indexing**: Only processes new/modified documents on startup
- **Performance**: Maintains document metadata and content for fast queries

### Document Format
All documents use Markdown with YAML frontmatter:
```markdown
---
title: "Document Title"
description: "Brief description"
author: "Author Name"
tags: ["tag1", "tag2"]
---

# Document Content

Your markdown content here...
```

## Recommended Setup: Private Document Storage

The recommended approach is to keep your documentation separate from the MCP server codebase using symlinks:

### Setup Private Jane Directory
```bash
# Create your private Jane documents directory
mkdir -p ~/Documents/Jane

# Create symlink from MCP server to your private docs
ln -s ~/Documents/Jane ~/dev/jane-mcp-server/Jane

# The server will automatically create stdlib/ and specs/ subdirectories
```

### Benefits
- **Complete Privacy**: Your documents are never part of the MCP server Git repository
- **Independent Backup**: Back up your documentation separately from the server code  
- **Team Flexibility**: Share docs privately while using the same server setup
- **Zero Git Conflicts**: The Jane directory is completely ignored by Git
- **Location Independence**: Move your documents anywhere and update the symlink

### Alternative Setups
```bash
# Use environment variable for different location
export JANE_DIR=/path/to/my/documents
npm start

# Or use the default ./Jane directory (auto-created)
# No setup needed - just run the server
```

Jane works seamlessly with any setup - symlinks, regular directories, or custom locations via `JANE_DIR`.

## Development

```bash
# Development mode with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Check SQLite database
sqlite3 document-index.db "SELECT COUNT(*) FROM documents;"
```

## Troubleshooting

### Common Issues

**🚫 "Jane server not appearing in MCP list"**
- Verify the absolute path in your Claude Desktop config
- Ensure Node.js is accessible: `node --version`
- Restart Claude Desktop completely
- Check server builds successfully: `npm run build`

**🚫 "No documents found"**
- Verify Jane directory exists: `ls -la Jane/`
- Check file permissions are readable
- Run diagnostics: `npx tsx tests/jane-diagnostics.ts`

**🚫 "SQLite database errors"**
- Check database permissions in project directory
- Reset database: `rm document-index.db && npm start`
- Verify disk space availability

**🚫 "Document appears in search but not retrievable"**
- Document exists in SQLite index but not on filesystem
- Run: `npm start` to resync database with filesystem
- Check for file permission issues

### Diagnostic Commands
```bash
# Test server startup
timeout 10s npm start
echo $? # Should be 124 (timeout) for successful startup

# Run comprehensive diagnostics
npx tsx tests/jane-diagnostics.ts

# Inspect SQLite database
sqlite3 document-index.db ".tables"
sqlite3 document-index.db "SELECT type, path, title FROM documents LIMIT 10;"

# Check document structure
find Jane/ -name "*.md" | head -5
```

### Getting Help
- **Integration Issues**: Check the integration guide for your specific MCP client
- **Performance Problems**: Review the SQLite configuration and document indexing
- **Document Management**: See the MCP tools reference and usage examples

## Comprehensive Documentation

For advanced usage, development, and deployment:

- **[Architecture](./Jane/specs/jane-mcp-server/architecture.md)** - System design and components
- **[API Reference](./Jane/specs/jane-mcp-server/api-reference.md)** - Complete tool and resource documentation  
- **[Integration Guide](./Jane/specs/jane-mcp-server/integration-guide.md)** - Advanced Claude Desktop and Claude Code setup
- **[Development Workflow](./Jane/specs/jane-mcp-server/development-workflow.md)** - Development setup and practices
- **[Deployment Guide](./Jane/specs/jane-mcp-server/deployment.md)** - Production deployment strategies
- **[Testing Strategy](./Jane/specs/jane-mcp-server/testing-strategy.md)** - Testing framework and practices

## License

MIT