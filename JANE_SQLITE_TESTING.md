# Jane SQLite Indexing Testing Guide

> **NEW FEATURE:** The SQLite indexer now has optimization to skip unchanged documents. It compares file modification times with the database and only processes files that are new or have been modified since the last indexing.

This document provides instructions for testing the new SQLite-based document indexing feature in the Jane MCP server. The implementation replaces the previous in-memory indexing with a persistent SQLite database for better performance and scalability.

## Prerequisites

- Node.js v18 or later
- Jane MCP Server codebase
- Claude Desktop (for interactive testing)
- Claude Code CLI (for command-line testing)

## Testing the SQLite Indexer

### 1. Server Setup

1. Clone the Jane MCP server repository (if not already done)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Start the server:
   ```bash
   npm start
   ```

During startup, you should see logs indicating:
- SQLite database initialization at `document-index.db`
- Document scanning, which indexes existing files
- A message like `Document scan complete: X indexed, Y unchanged, Z failed`
  - "indexed" - documents that were new or modified since last scan
  - "unchanged" - documents that were skipped because they haven't changed
  - "failed" - documents that failed to be processed

### 2. Configure Claude Desktop

1. Open Claude Desktop
2. Click on Settings (gear icon) → Settings...
3. Navigate to the "Developer" section
4. Click "Edit Config" 
5. Add the Jane MCP server configuration:

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

6. Replace `/absolute/path/to/jane-mcp-server` with the actual path to your Jane directory
7. Save and restart Claude Desktop

### 3. Configure Claude Code CLI

1. Open your Claude Code settings file at `~/.claude-code/settings.json`
2. Add the Jane MCP server configuration:

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

3. Replace `/absolute/path/to/jane-mcp-server` with the actual path to your Jane directory
4. Save the file

### 4. Test Document Creation

#### Using Claude Desktop

1. Open Claude Desktop
2. Click the slider icon in the input area
3. Select "jane" from the MCP server dropdown
4. Choose the "create_document" tool
5. Fill in the parameters:
   - type: "stdlib" or "spec"
   - language: (if stdlib) e.g., "python"
   - project: (if spec) e.g., "my-project"
   - path: e.g., "testing/sqlite-test.md"
   - title: e.g., "SQLite Test Document"
   - description: e.g., "A test document for SQLite indexing"
   - content: "# Test Content\n\nThis document tests SQLite indexing."
6. Send the request

#### Using Claude Code CLI

1. Start a new Claude Code session:
   ```bash
   claude-code
   ```
2. Ask Claude to create a document:
   ```
   Please create a new document in Jane with the following details:
   - Type: spec
   - Project: test-project
   - Path: testing/sqlite-test.md
   - Title: SQLite Test Document
   - Content: A test document for SQLite indexing
   ```

### 5. Test Document Search

#### Using Claude Desktop

1. Open Claude Desktop
2. Click the slider icon in the input area
3. Select "jane" from the MCP server dropdown
4. Choose the "search" tool
5. Enter a search query, e.g., "SQLite" or "test"
6. Optional: filter by type, language, or project
7. Send the request

#### Using Claude Code CLI

1. Start Claude Code CLI or continue your session
2. Ask Claude to search for documents:
   ```
   Please search Jane for documents containing "test" or "SQLite"
   ```

### 6. Verify SQLite Storage

To verify documents are properly stored in the SQLite database:

1. Stop the Jane server if it's running
2. Use SQLite CLI to inspect the database:
   ```bash
   sqlite3 document-index.db
   ```
3. In the SQLite prompt, run:
   ```sql
   -- Check document count
   SELECT COUNT(*) FROM documents;
   
   -- View document details
   SELECT type, path, title FROM documents LIMIT 10;
   
   -- Search for specific documents
   SELECT type, path, title FROM documents WHERE content LIKE '%SQLite%';
   
   -- Exit SQLite CLI
   .exit
   ```

### 7. Testing Existing Document Indexing and Optimization

To test that the SQLite indexer properly handles existing documents:

1. Create a new file directly in the Jane directory structure:
   ```bash
   mkdir -p Jane/stdlib/testing
   echo -e "---\ntitle: Manual Test\ndescription: Manually created test\nauthor: User\ntags:\n  - manual\n  - test\n---\n# Manual Test\n\nThis file was created manually." > Jane/stdlib/testing/manual-test.md
   ```

2. Start the Jane server:
   ```bash
   npm start
   ```

3. Verify the document appears in search results:
   - Use Claude Desktop or Claude Code to search for "Manual Test"
   - Check SQLite database: `sqlite3 document-index.db "SELECT * FROM documents WHERE title='Manual Test';"`

4. Test the optimization feature:
   - Stop the server (Ctrl+C)
   - Restart the server: `npm start`
   - Notice in the logs that the manual test document is listed in "skipped" count, not "indexed"
   - Modify the test document to change its content:
   ```bash
   echo -e "---\ntitle: Manual Test Updated\ndescription: Manually created test\nauthor: User\ntags:\n  - manual\n  - test\n  - updated\n---\n# Manual Test Updated\n\nThis file was created manually and updated." > Jane/stdlib/testing/manual-test.md
   ```
   - Restart the server again
   - Notice that the document is now in the "indexed" count since it was modified

## Performance Considerations

The SQLite indexer provides several performance improvements:

1. **Incremental Updates**: Only changed documents are processed, making server startup faster
2. **Persistent Storage**: Document index persists between server restarts
3. **Efficient Searches**: SQLite's FTS5 virtual table provides fast full-text searching
4. **Reduced Memory Usage**: Data is stored in the database rather than in memory

During initial server startup, all documents will be indexed. On subsequent startups, unchanged documents will be skipped, resulting in faster startup times.

## Troubleshooting

If documents aren't appearing in search results:

1. Check the server logs for any errors during document scanning
2. Verify the document file format (must have YAML frontmatter)
3. Ensure the Jane directory structure is correct
4. Check database connectivity with `sqlite3 document-index.db .tables`
5. Restart the Jane server and check if it properly scans documents

For optimization-related issues:

1. If all documents are being re-indexed on every restart:
   - Check if file timestamps are changing (some editors modify timestamps on save)
   - Verify the `updatedAt` field in document metadata matches file modification time
   - Check for database file permissions issues

If Claude can't connect to Jane:

1. Verify the server is running
2. Check the path in your Claude configuration
3. Restart Claude Desktop or Claude Code CLI
4. Examine Jane's console output for connection errors