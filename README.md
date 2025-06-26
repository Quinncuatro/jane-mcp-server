# Jane - Knowledge Management MCP Server

Jane is a Model Context Protocol (MCP) server that provides a knowledge management system for stdlib and specs documents. It allows Claude and other MCP-compatible LLMs to access, search, and manipulate a repository of standard library and specification documents.

## Features

- Access standard library documents (`stdlib`) for different programming languages
- Access specification documents (`specs`) for different projects
- Search through document content and metadata
- Create and update documents with proper frontmatter
- Compatible with Claude Desktop and Claude Code

## Installation

```bash
# Clone the repository
git clone https://your-repository-url/jane.git
cd jane

# Install dependencies
npm install

# Build the TypeScript code
npm run build
```

## Usage

```bash
# Start the server
npm start
```

This will start the Jane MCP server using the stdio transport, which allows it to communicate with MCP clients like Claude Desktop and Claude Code.

## Directory Structure

```
jane/
├── src/               # Source code
├── dist/              # Compiled JavaScript
├── tests/             # Test files
└── Jane/              # Knowledge base
    ├── stdlib/        # Standard library documents by language
    │   ├── javascript/
    │   ├── typescript/
    │   └── python/
    └── specs/         # Specification documents by project
        ├── project1/
        └── project2/
```

## Document Format

All documents are stored as Markdown files with YAML frontmatter containing metadata:

```markdown
---
title: Document Title
description: Document description
author: Author Name
createdAt: 2023-01-01T00:00:00Z
updatedAt: 2023-01-02T00:00:00Z
tags:
  - tag1
  - tag2
---

# Document Content

The actual markdown content goes here.
```

## Connecting to Claude

### Claude Desktop

1. Ensure Node.js is installed on your system
2. Start the Jane MCP server using `npm start`
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
        "/path/to/your/jane/dist/index.js"
      ]
    }
  }
}
```

7. Replace `/path/to/your/jane/dist/index.js` with the absolute path to your compiled Jane server
8. Save the config file and restart Claude Desktop
9. Look for the slider icon in the input box to access Jane's functionality

#### Troubleshooting

If you encounter issues with Claude Desktop not finding documents or returning empty results:

1. Check the Claude Desktop logs for error messages
2. Verify the Jane directory structure exists at `/path-to-project/Jane/`
3. The server automatically creates test documents when started
4. If documents are still not appearing, try rebuilding the project and restarting Claude Desktop:```bash
npm run build && npm start
```

### Claude Code

1. Start the Jane MCP server
2. Run Claude Code with the `--mcp` flag pointing to the Jane executable:

```bash
claude-code --mcp=node /path/to/jane/dist/index.js
```

3. Claude Code will now have access to all of Jane's tools and resources

#### Troubleshooting

If you encounter issues with Claude Code not finding documents or returning empty results:

1. Check the terminal output for error messages from the Jane MCP server
2. Verify that the Jane directory exists where expected (console.error logs will show the path)
3. You can manually trigger Jane to create test documents by modifying src/server.ts
4. Try rebuilding and restarting the server:
```bash
npm run build && npm start
```

## Available Tools

Jane provides the following MCP tools:

### `get_stdlib`
Retrieves a standard library document for a specific language.
- **Parameters**:
  - `language`: The programming language (e.g., javascript, typescript, python)
  - `path`: The path to the document within the language directory

### `get_spec`
Retrieves a specification document for a specific project.
- **Parameters**:
  - `project`: The project name
  - `path`: The path to the document within the project directory

### `list_stdlibs`
Lists available standard library documents, optionally filtered by language.
- **Parameters**:
  - `language` (optional): Filter by specific language

### `list_specs`
Lists available specification documents, optionally filtered by project.
- **Parameters**:
  - `project` (optional): Filter by specific project

### `search`
Searches for documents by content or metadata.
- **Parameters**:
  - `query`: The search query
  - `type` (optional): Filter by document type ('stdlib' or 'spec')
  - `language` (optional): Filter by language (for stdlib documents)
  - `project` (optional): Filter by project (for specs documents)
  - `includeContent` (optional): Whether to include document content in results

### `create_document`
Creates a new document with frontmatter metadata.
- **Parameters**:
  - `type`: Document type ('stdlib' or 'spec')
  - `language`: Required for stdlib documents
  - `project`: Required for spec documents
  - `path`: Path within the language/project directory
  - `title`: Document title
  - `description` (optional): Document description
  - `author` (optional): Document author
  - `tags` (optional): Array of document tags
  - `content`: Document content (markdown)

### `update_document`
Updates an existing document's content and/or metadata.
- **Parameters**:
  - `type`: Document type ('stdlib' or 'spec')
  - `language`: Required for stdlib documents
  - `project`: Required for spec documents
  - `path`: Path within the language/project directory
  - `title` (optional): Document title
  - `description` (optional): Document description
  - `author` (optional): Document author
  - `tags` (optional): Array of document tags
  - `content` (optional): Document content (markdown)
  - `updateMeta` (optional): Whether to update metadata

## Available Resources

### `stdlib://{language}/{path}`
Resource for accessing standard library documents.

### `spec://{project}/{path}`
Resource for accessing specification documents.

## Running Tests

```bash
# Run the test suite
npm test

# Run tests in watch mode
npm run test:watch
```

## License

MIT