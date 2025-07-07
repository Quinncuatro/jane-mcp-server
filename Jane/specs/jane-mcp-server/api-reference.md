---
title: Jane MCP Server - API Reference
description: Complete API reference for all Jane MCP tools and resources with examples
tags:
  - api-reference
  - mcp-tools
  - mcp-resources
  - documentation
  - examples
createdAt: '2025-06-30T22:00:12.479Z'
updatedAt: '2025-06-30T22:00:12.479Z'
---
# Jane MCP Server - API Reference

## Overview

This document provides a complete reference for all MCP tools and resources exposed by the Jane server. Each tool and resource is documented with parameters, return values, and usage examples.

## MCP Tools

### get_stdlib

Retrieves a standard library document for a specific programming language.

**Parameters:**
- `language` (string, required): Programming language (e.g., `javascript`, `typescript`, `python`)
- `path` (string, required): Path to the document within the language directory

**Returns:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "# Document Title\n\nDocument content in markdown format..."
    }
  ]
}
```

**Example Usage:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_stdlib",
    "arguments": {
      "language": "javascript",
      "path": "array-methods.md"
    }
  }
}
```

**Error Cases:**
- `language` not found: Returns error with available languages
- `path` not found: Returns error with available documents for language
- Invalid parameters: Returns validation error

### get_spec

Retrieves a specification document for a specific project.

**Parameters:**
- `project` (string, required): Project name
- `path` (string, required): Path to the document within the project directory

**Returns:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "# Specification Title\n\nSpecification content..."
    }
  ]
}
```

**Example Usage:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_spec",
    "arguments": {
      "project": "project1",
      "path": "api.md"
    }
  }
}
```

### list_stdlibs

Lists available standard library documents, optionally filtered by language.

**Parameters:**
- `language` (string, optional): Filter by specific language

**Returns (without language filter):**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Available languages:\n- javascript\n- typescript\n- python"
    }
  ]
}
```

**Returns (with language filter):**
```json
{
  "content": [
    {
      "type": "text", 
      "text": "Documents in javascript:\n- array-methods.md\n- object-methods.md"
    }
  ]
}
```

**Example Usage:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_stdlibs",
    "arguments": {
      "language": "javascript"
    }
  }
}
```

### list_specs

Lists available specification documents, optionally filtered by project.

**Parameters:**
- `project` (string, optional): Filter by specific project

**Returns (without project filter):**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Available projects:\n- project1\n- project2"
    }
  ]
}
```

**Returns (with project filter):**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Documents in project1:\n- api.md\n- architecture.md"
    }
  ]
}
```

**Example Usage:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_specs",
    "arguments": {}
  }
}
```

### search

Searches for documents by content or metadata using the built-in search index.

**Parameters:**
- `query` (string, required): Search query text
- `type` (string, optional): Filter by document type (`"stdlib"` or `"spec"`)
- `language` (string, optional): Filter stdlib documents by language
- `project` (string, optional): Filter spec documents by project
- `includeContent` (boolean, optional): Include full document content in results (default: false)

**Returns:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 2 results:\n\n1. javascript/array-methods.md\n   Type: stdlib\n   Title: JavaScript Array Methods\n   Description: Common array manipulation methods\n   \n2. project1/api.md\n   Type: spec\n   Title: API Specification\n   Description: REST API documentation"
    }
  ]
}
```

**Example Usage:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
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

### create_document

Creates a new document with frontmatter metadata.

**Parameters:**
- `type` (string, required): Document type (`"stdlib"` or `"spec"`)
- `language` (string, required for stdlib): Programming language
- `project` (string, required for spec): Project name
- `path` (string, required): Path within language/project directory
- `title` (string, required): Document title
- `description` (string, optional): Document description
- `author` (string, optional): Document author
- `tags` (array of strings, optional): Document tags
- `content` (string, required): Document content in markdown

**Returns:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Document created successfully at stdlib://javascript/new-feature.md"
    }
  ]
}
```

**Example Usage (stdlib document):**
```json
{
  "jsonrpc": "2.0", 
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_document",
    "arguments": {
      "type": "stdlib",
      "language": "javascript",
      "path": "new-feature.md",
      "title": "JavaScript New Feature",
      "description": "Documentation for a new JavaScript feature",
      "tags": ["javascript", "es2024"],
      "content": "# JavaScript New Feature\n\nThis is documentation for a new feature..."
    }
  }
}
```

**Example Usage (spec document):**
```json
{
  "jsonrpc": "2.0",
  "id": 1, 
  "method": "tools/call",
  "params": {
    "name": "create_document",
    "arguments": {
      "type": "spec",
      "project": "myproject",
      "path": "requirements.md",
      "title": "Project Requirements",
      "description": "System requirements specification",
      "content": "# Project Requirements\n\n## Functional Requirements\n..."
    }
  }
}
```

### update_document

Updates an existing document's content and/or metadata.

**Parameters:**
- `type` (string, required): Document type (`"stdlib"` or `"spec"`)
- `language` (string, required for stdlib): Programming language  
- `project` (string, required for spec): Project name
- `path` (string, required): Path within language/project directory
- `title` (string, optional): Update document title
- `description` (string, optional): Update document description
- `author` (string, optional): Update document author
- `tags` (array of strings, optional): Update document tags
- `content` (string, optional): Update document content
- `updateMeta` (boolean, optional): Whether to update metadata (default: true)

**Returns:**
```json
{
  "content": [
    {
      "type": "text", 
      "text": "Document updated successfully"
    }
  ]
}
```

**Example Usage:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call", 
  "params": {
    "name": "update_document",
    "arguments": {
      "type": "stdlib",
      "language": "javascript", 
      "path": "array-methods.md",
      "title": "Updated JavaScript Array Methods",
      "tags": ["javascript", "arrays", "updated"],
      "content": "# Updated JavaScript Array Methods\n\nUpdated content..."
    }
  }
}
```

## MCP Resources

Jane exposes two types of MCP resources for direct document access without using tools.

### stdlib Resources

Direct access to standard library documents via URI pattern.

**URI Pattern:** `stdlib://{language}/{path}`

**Example URIs:**
- `stdlib://javascript/array-methods.md`
- `stdlib://typescript/interfaces.md`
- `stdlib://python/list-methods.md`

**Returns:**
```json
{
  "contents": [
    {
      "uri": "stdlib://javascript/array-methods.md",
      "mimeType": "text/markdown",
      "text": "---\ntitle: JavaScript Array Methods\ndescription: Common array methods\n---\n\n# JavaScript Array Methods\n\n..."
    }
  ]
}
```

### spec Resources

Direct access to specification documents via URI pattern.

**URI Pattern:** `spec://{project}/{path}`

**Example URIs:**
- `spec://project1/api.md`
- `spec://project2/architecture.md`
- `spec://myproject/requirements.md`

**Returns:**
```json
{
  "contents": [
    {
      "uri": "spec://project1/api.md",
      "mimeType": "text/markdown", 
      "text": "---\ntitle: API Specification\ndescription: REST API docs\n---\n\n# API Specification\n\n..."
    }
  ]
}
```

## Error Handling

All tools and resources return structured errors following the JSON-RPC 2.0 specification.

### Common Error Codes

- `-32602`: Invalid params (missing required parameters, invalid types)
- `-32603`: Internal error (file system errors, parsing errors)
- `-32000`: Server error (application-specific errors)

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "details": "Language parameter is required for stdlib documents"
    }
  }
}
```

### Specific Error Scenarios

#### Tool Not Found
```json
{
  "error": {
    "code": -32601,
    "message": "Method not found",
    "data": {
      "details": "Tool 'unknown_tool' not found"
    }
  }
}
```

#### Document Not Found
```json
{
  "error": {
    "code": -32000,
    "message": "Document not found",
    "data": {
      "details": "Document at path 'javascript/nonexistent.md' not found"
    }
  }
}
```

#### Invalid Document Type
```json
{
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "details": "Type must be 'stdlib' or 'spec'"
    }
  }
}
```

#### File System Error
```json
{
  "error": {
    "code": -32603,
    "message": "Internal error",
    "data": {
      "details": "Permission denied: cannot write to document directory"
    }
  }
}
```

## Document Format

All documents use a consistent format with YAML frontmatter and Markdown content.

### Frontmatter Schema

```yaml
---
title: "Document Title"
description: "Document description"
author: "Author Name"
createdAt: "2023-01-01T00:00:00Z"
updatedAt: "2023-01-02T00:00:00Z"
tags:
  - "tag1"
  - "tag2"
---
```

### Required Fields
- `title`: Human-readable document title
- `createdAt`: ISO 8601 timestamp of creation
- `updatedAt`: ISO 8601 timestamp of last modification

### Optional Fields
- `description`: Brief description of document contents
- `author`: Document author name
- `tags`: Array of strings for categorization and search

### Content Format
- **Markdown**: CommonMark-compliant markdown content
- **Encoding**: UTF-8
- **Line Endings**: Unix-style (LF)

## Usage Examples

### Complete Workflow Example

1. **Discover available content:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "list_stdlibs",
    "arguments": {}
  }
}
```

2. **Search for specific content:**
```json
{
  "method": "tools/call", 
  "params": {
    "name": "search",
    "arguments": {
      "query": "array manipulation",
      "type": "stdlib"
    }
  }
}
```

3. **Retrieve specific document:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_stdlib",
    "arguments": {
      "language": "javascript",
      "path": "array-methods.md"
    }
  }
}
```

4. **Create new documentation:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "create_document",
    "arguments": {
      "type": "stdlib",
      "language": "javascript",
      "path": "new-arrays.md",
      "title": "Advanced Array Methods",
      "content": "# Advanced Array Methods\n\n..."
    }
  }
}
```

### Resource Access Example

Direct resource access bypasses tools for simple retrieval:

```json
{
  "method": "resources/read",
  "params": {
    "uri": "stdlib://javascript/array-methods.md"
  }
}
```

## Performance Considerations

### Tool Performance
- **get_stdlib/get_spec**: O(1) file system access
- **list_stdlibs/list_specs**: O(n) directory traversal
- **search**: O(n) index search, cached in memory
- **create_document**: O(1) write + O(1) index update
- **update_document**: O(1) read/write + O(1) index update

### Resource Performance
- **Resource access**: O(1) direct file system access
- **No caching**: Each resource request reads from disk
- **No batching**: Individual requests for each resource

### Optimization Recommendations
- Use `search` with `includeContent: false` for discovery
- Batch multiple document retrievals when possible
- Cache frequently accessed documents client-side
