# Jane MCP Server - Project Context

This document provides context about the Jane MCP server for Claude. It can be referenced in future sessions to quickly get Claude up to speed on the project's state and structure.

## Project Overview

Jane is a Model Context Protocol (MCP) server that provides a knowledge management system for standard library and specification documents. It allows Claude and other MCP-compatible LLMs to access, search, and manipulate a repository of documents.

The server implements the Model Context Protocol, enabling seamless integration with Claude Desktop and Claude Code. Jane functions as a document store with search capabilities, allowing AI assistants to access programming language documentation and project specifications.

## Current State & Features

As of the latest update, Jane implements 7 MCP tools:

1. `list_stdlibs` - Lists available standard library documents or languages
2. `list_specs` - Lists available specification documents or projects
3. `get_stdlib` - Retrieves a standard library document for a specific language
4. `get_spec` - Retrieves a specification document for a specific project
5. `search` - Searches documents by content or metadata
6. `create_document` - Creates a new document with frontmatter metadata
7. `update_document` - Updates an existing document's content and/or metadata

The server also implements document resources:
- `stdlib://{language}/{path}` - Access standard library documents
- `spec://{project}/{path}` - Access specification documents

Jane is currently functional with Claude Desktop and Claude Code CLI, using stdio transport.

## Implementation Details

Key implementation components:

- **Main Entry Point**: `src/index.ts` - Sets up the server with stdio transport
- **Server Creation**: `src/server.ts` - Configures resources and tools
- **Tools Implementation**: `src/tools/index.ts` - Implements the 7 MCP tools
- **Document Management**: `src/utils/filesystem.ts` - Handles document operations
- **Search Functionality**: `src/utils/search.js` - Provides document indexing and search
- **Document Format**: Markdown files with YAML frontmatter for metadata

Documents are stored in a directory structure:
```
Jane/
├── stdlib/        # Standard library documents by language
│   ├── javascript/
│   ├── typescript/
│   └── python/
└── specs/         # Specification documents by project
    ├── project1/
    └── project2/
```

## MCP Tools Summary

### `list_stdlibs`
- Lists available standard library documents
- Optional language filter
- Returns document paths or available languages

### `list_specs`
- Lists available specification documents
- Optional project filter
- Returns document paths or available projects

### `get_stdlib`
- Retrieves a standard library document for a specific language
- Parameters: language, path
- Returns document content with title

### `get_spec`
- Retrieves a specification document for a specific project
- Parameters: project, path
- Returns document content with title

### `search`
- Searches for documents by content or metadata
- Parameters: query, type (optional), language (optional), project (optional), includeContent (optional)
- Returns matching documents with metadata and context

### `create_document`
- Creates a new document with frontmatter metadata
- Parameters: type, language/project, path, title, description (optional), etc.
- Validates inputs and creates document with metadata

### `update_document`
- Updates an existing document's content and/or metadata
- Parameters: type, language/project, path, plus metadata fields to update
- Preserves existing metadata for fields not specified

## Jane Directory Management

The Jane directory is **completely user-managed** and not part of the codebase:

- **Automatic Setup**: The server automatically creates the Jane directory structure (`Jane/stdlib/` and `Jane/specs/`) on first run via the `ensureJaneStructure()` function.

- **User Control**: Users have complete control over their Jane directory - it can be a regular directory, a symlink to `~/Documents/Jane`, or located anywhere via the `JANE_DIR` environment variable.

- **Git Independence**: The Jane directory is completely ignored by Git (via `.gitignore`), so there are no conflicts whether you use symlinks, regular directories, or any other setup.

- **Document Creation**: Create documents using:
  - MCP tools: `create_document` and `update_document` through your MCP client
  - Manual creation: Add markdown files with YAML frontmatter in the appropriate subdirectories
  - Conversational creation: Ask Claude to research topics and create comprehensive reference documents

- **Directory Structure**: 
  ```
  Jane/                    # Auto-created by server
  ├── stdlib/             # Standard library docs by language
  │   ├── javascript/     # Created as needed
  │   ├── python/         # Created as needed
  │   └── ...
  └── specs/              # Project specifications by project
      ├── my-project/     # Created as needed
      └── ...
  ```

## Known Issues

- Path resolution can be tricky in different environments
- Document paths must follow specific format conventions
- When using symlinked Jane directories, ensure Git operations are performed outside the symlinked path to avoid conflicts

## Future Plans

Planned enhancements include:
- Docker containerization (in progress)
- Better error handling and validation
- Enhanced search capabilities
- Web UI for document management
- Authentication for document modification

## Claude Desktop Integration Guide

### Configuration

To use Jane with Claude Desktop:

1. Ensure Node.js is installed on your system (v18 or later)
2. Start Jane MCP server using `npm start`
3. Open Claude Desktop
4. Click on the settings menu (gear icon) and select "Settings..."
5. Go to the "Developer" section and click "Edit Config"
6. Add the Jane MCP server configuration to the JSON file:

```json
{
  "mcpServers": {
    "jane": {
      "command": "node",
      "args": [
        "/absolute/path/to/jane/dist/index.js"
      ]
    }
  }
}
```

7. Replace `/absolute/path/to/jane/dist/index.js` with the absolute path to your compiled Jane server
8. Save the config file and restart Claude Desktop
9. Look for the slider icon in the input box to access Jane's functionality

### Using Jane in Claude Desktop

Once connected, you can interact with Jane through Claude Desktop:

1. Click the slider icon in the message input area
2. Select "jane" from the available MCP servers
3. Choose a tool from the dropdown (e.g., list_stdlibs, search)
4. Fill in the required parameters
5. Send the request

Claude will receive the document content and can answer questions about it.

For example queries:
- "Show me all available standard libraries"
- "Get the JavaScript array methods documentation"
- "Search for 'API' in the specs"
- "Create a new Python document about dictionaries"

### Troubleshooting

If Claude Desktop can't connect to Jane:
1. Verify the server is running
2. Check the path in the Claude Desktop config
3. Restart Claude Desktop after config changes
4. Examine Jane's console output for errors