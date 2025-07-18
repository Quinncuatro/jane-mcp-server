# Jane - Knowledge Management MCP Server

Jane is a Model Context Protocol (MCP) server that provides a knowledge management system for standard library and specification documents. Built with TypeScript and the official MCP SDK, Jane allows Claude and other MCP-compatible clients to access, search, and manipulate a repository of documentation with SQLite-powered full-text search capabilities.

## Features

- **Document Management**: Create, read, update standard library and specification documents
- **SQLite-Powered Search**: Persistent full-text search with intelligent indexing and optimization
- **MCP Compliance**: Implements MCP protocol v2024-11-05 with 7 tools and 2 resource types
- **Client Compatibility**: Works with Claude Desktop, Claude Code, and custom MCP clients
- **Containerized Deployment**: Docker support with multi-stage builds and Alpine Linux
- **Performance Optimization**: Skip unchanged documents during indexing for faster startup

## Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd jane-mcp-server
npm install
npm run build

# Start the server
npm start
```

### Tool Versions
Jane includes a `.tool-versions` file that specifies the recommended tool versions:
```
uv 0.8.0
```

If you use [asdf](https://asdf-vm.com/) or [mise](https://mise.jdx.dev/) for version management, they will automatically use the specified versions.

## MCP Tools

Jane provides 7 MCP tools for document management:

- `list_stdlibs` / `list_specs` - List available documents and languages/projects
- `get_stdlib` / `get_spec` - Retrieve specific documents
- `search` - Full-text search across all documents with filtering
- `create_document` / `update_document` - Create and modify documents

## Claude Integration

### Claude Desktop
Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

### Claude Code
```bash
claude-code --mcp="node /path/to/jane-mcp-server/dist/index.js"
```

## Docker Deployment

```bash
# Quick start with Docker Compose
export JANE_DATA_DIR=/path/to/your/documents
docker-compose up -d
```

For Claude Desktop with Docker:
```json
{
  "mcpServers": {
    "jane": {
      "command": "docker",
      "args": ["exec", "-i", "jane-mcp-server", "node", "dist/index.js"]
    }
  }
}
```

## Configuration

- **`JANE_DIR`**: Set document storage location (default: `./Jane/`)
- **Document Structure**: `Jane/stdlib/{language}/` and `Jane/specs/{project}/`
- **Format**: Markdown with YAML frontmatter
- **SQLite Database**: Stored at `./document-index.db` in project root (automatically created)
- **SQLite Configuration**: 
  - Uses SQLite's FTS5 extension for full-text search
  - Automatically detects and indexes new/modified documents
  - Maintains document metadata and content in database

## Documentation

Comprehensive technical documentation is available in `./Jane/specs/jane-mcp-server/`:

- **[Architecture](./Jane/specs/jane-mcp-server/architecture.md)** - System design and components
- **[API Reference](./Jane/specs/jane-mcp-server/api-reference.md)** - Complete tool and resource documentation  
- **[Integration Guide](./Jane/specs/jane-mcp-server/integration-guide.md)** - Claude Desktop and Claude Code setup
- **[Development Workflow](./Jane/specs/jane-mcp-server/development-workflow.md)** - Development setup and practices
- **[Deployment Guide](./Jane/specs/jane-mcp-server/deployment.md)** - Docker and production deployment
- **[Testing Strategy](./Jane/specs/jane-mcp-server/testing-strategy.md)** - Testing framework and practices
- **[SQLite Testing Guide](./JANE_SQLITE_TESTING.md)** - Testing the SQLite indexing feature

### Using Documentation for Feature Development

These spec documents serve as a complete technical map for future development. When working on features:

1. **Start with the docs**: Review relevant spec documents to understand current architecture
2. **Use as implementation guide**: The documents provide implementation patterns and technical decisions
3. **Reference for integration**: Use API Reference and Integration Guide for client compatibility

**Documentation Update Workflow:**

Every feature should include documentation updates as part of the work:

```
Feature Development Checklist:
□ Implement the feature
□ Update relevant spec documents in ./Jane/specs/jane-mcp-server/
□ Update README.md if the change affects:
  - Features list
  - MCP tools summary  
  - Integration examples
  - Configuration options
□ Test documentation accuracy
□ Ensure examples still work
```

**Which documents to update:**
- **New MCP tools**: Update `api-reference.md`, `mcp-implementation.md`, README tools section
- **Architecture changes**: Update `architecture.md`, `technical-decisions.md`
- **New dependencies**: Update `development-workflow.md`, `deployment.md`
- **Configuration changes**: Update README config section, `deployment.md`
- **Integration changes**: Update `integration-guide.md`, README integration section

This ensures the documentation remains a reliable source of truth for future development work.

## Development

```bash
# Development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Run diagnostics
npx tsx tests/jane-diagnostics.ts

# Check SQLite database
sqlite3 document-index.db "SELECT COUNT(*) FROM documents;"

# View SQLite database tables
sqlite3 document-index.db .tables
```

## Troubleshooting

**Common Issues:**
- **"No documents found"**: Verify Jane directory exists and is writable
- **"MCP connection failed"**: Check absolute paths in client configuration
- **"Permission denied"**: Ensure proper file system permissions
- **"SQLite database errors"**: Check database permissions, try removing `document-index.db` to rebuild
- **"Document appears in search but not retrievable"**: Document exists in SQLite index but not on filesystem

**Diagnostic Commands:**
```bash
# Test server startup
npm start

# Run comprehensive diagnostics  
npx tsx tests/jane-diagnostics.ts

# Check document structure
find ./Jane -name "*.md" | head -5

# Inspect SQLite database
sqlite3 document-index.db "SELECT COUNT(*) FROM documents;"
sqlite3 document-index.db "SELECT type, path, title FROM documents LIMIT 10;"
```

**SQLite Database Troubleshooting:**
```bash
# Reset the SQLite database to rebuild from scratch
rm document-index.db
npm start

# Check database structure
sqlite3 document-index.db .schema
```

## License

MIT