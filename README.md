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

## Configuration

Jane supports several configuration options for document storage:

### Environment Variables

- `JANE_DIR`: Set the absolute path where Jane should store documents
  - Example: `JANE_DIR=/path/to/documents node dist/index.js`

### Path Resolution Strategy

If `JANE_DIR` is not set, Jane will attempt to find a suitable storage location in the following order:

1. `./Jane/` in the current working directory
2. `./Jane/` in the project root (two levels up from utils)
3. `./Jane/` in the parent directory of the current working directory

This robust path resolution ensures Jane works correctly in various environments:
- Local development: Documents are stored in `./Jane/` relative to the project root
- MCP clients: Documents are properly found regardless of the MCP client's working directory
- Docker: Documents can be stored in a mounted volume by setting `JANE_DIR`

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
└── Jane/              # Knowledge base (portable document store)
    ├── stdlib/        # Standard library documents by language
    │   ├── javascript/
    │   ├── typescript/
    │   └── python/
    └── specs/         # Specification documents by project
        ├── project1/
        └── project2/
```

### Path Resolution

Jane uses relative paths from the project root to ensure portability:

- **Project Root**: The directory where `.git/` lives (typically the repo clone location)
- **Document Store**: `./Jane/` (relative to project root)
- **Standard Library**: `./Jane/stdlib/{language}/{filename}`
- **Specifications**: `./Jane/specs/{project}/{filename}`

This relative path approach ensures:
- Portability across different development environments
- Compatibility with Docker containerization
- Easy distribution to other users

The server automatically creates the `Jane/` directory structure if it doesn't exist.

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
2. Verify the Jane directory structure exists at `./Jane/` (relative to project root)
3. The server automatically creates test documents when started
4. Ensure the server is running from the correct project root directory to ensure proper path resolution
5. Check console logs for details on path resolution problems (now in friendly colors!)
6. If documents are still not appearing, try rebuilding the project and restarting Claude Desktop:
```bash
npm run build && npm start
```

##### Common Issues and Solutions

**Issue**: "No stdlib languages found" or "No spec projects found"

**Solution**: 
- Confirm the `./Jane/` directory exists in the project root
- The server should be started from the project root directory
- If needed, manually create the directory structure before starting the server
- Set `JANE_DIR` environment variable to explicitly specify document location

**Issue**: Document creation fails with "Failed to create document"

**Solution**:
- Check permissions on the `./Jane/` directory and its subdirectories
- Ensure path format follows the expected pattern (e.g., `language/filename.md` for stdlib)
- Verify the directory structure exists with proper subdirectories

**Issue**: Path resolution problems in various environments

**Solution**:
- Run the diagnostic script to verify Jane is working correctly: `npx tsx tests/jane-diagnostics.ts`
- Set `JANE_DIR` environment variable to explicitly configure document location
- Check the console logs for detailed path resolution information

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
2. Verify that the Jane directory exists where expected (colored console logs will show the path)
3. Ensure the server is running from the project root directory where the `.git/` folder lives
4. Set `JANE_DIR` environment variable if the automatic path resolution is failing
5. Run the comprehensive diagnostics script to identify problems

##### Diagnostic Commands

If you're experiencing issues with the Jane server, these commands can help diagnose problems:

```bash
# Run the comprehensive Jane diagnostics
npx tsx tests/jane-diagnostics.ts

# Check if the Jane directory structure exists
find ./Jane -type d | sort

# List all document files
find ./Jane -name "*.md" | sort

# Test basic document operations
npx tsx tests/test-doc-creation.ts

# Set explicit document location and start server
JANE_DIR=/path/to/documents npm start
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

## Docker Deployment

Jane can be run as a Docker container, making it easy to deploy to your homelab or any other environment.

### Prerequisites

- Docker and Docker Compose installed on your host system
- Git clone of this repository

### Quick Start

1. Clone the repository and navigate to it:

```bash
git clone https://your-repository-url/jane.git
cd jane
```

2. Set the path for Jane's document storage:

```bash
# Set the environment variable for your desired host path
export JANE_DATA_DIR=/path/to/your/jane/data
```

3. Build and start the container:

```bash
docker-compose up -d
```

The Jane MCP server is now running in a container with stdio transport.

### Configuration Options

#### Environment Variables

- `JANE_DATA_DIR`: Host path for storing Jane documents (mounted to `/app/Jane` in the container)
- Default path if not specified: `/path/to/your/jane/data`

#### Using with Claude Desktop

To use the containerized Jane server with Claude Desktop:

1. Configure Claude Desktop to use the container:

```json
{
  "mcpServers": {
    "jane": {
      "command": "docker",
      "args": [
        "exec",
        "-i",
        "jane-mcp-server",
        "node",
        "dist/index.js"
      ]
    }
  }
}
```

2. Restart Claude Desktop and look for the slider icon in the input box.

### Managing Documents

The documents are stored in the volume specified by `JANE_DATA_DIR`. You can:

- Add new documents directly to this directory on your host
- Back up documents by copying this directory
- Migrate documents by copying to a new host

### Verifying Operation

To verify the container is operating correctly:

```bash
# Check container status
docker ps -a | grep jane-mcp-server

# View container logs
docker logs jane-mcp-server

# Run diagnostics inside the container
docker exec jane-mcp-server node -e "console.log('Jane container is working')"
```

### Building Custom Images

To build a custom image with your own tag:

```bash
docker build -t your-registry/jane-mcp-server:custom-tag .
```

## License

MIT