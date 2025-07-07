---
title: Jane MCP Server - MCP Protocol Implementation
description: >-
  Technical specification of Model Context Protocol implementation in Jane
  server
tags:
  - mcp-protocol
  - implementation
  - tools
  - resources
  - stdio-transport
createdAt: '2025-06-30T21:59:05.698Z'
updatedAt: '2025-06-30T21:59:05.698Z'
---
# Jane MCP Server - MCP Protocol Implementation

## Overview

Jane implements the Model Context Protocol (MCP) version 2024-11-05 using the official TypeScript SDK (@modelcontextprotocol/sdk v1.13.1). The server provides a standards-compliant MCP interface for document knowledge management, exposing both tools and resources to MCP clients.

## Protocol Compliance

### MCP Version Support
- **Protocol Version**: 2024-11-05
- **SDK Version**: @modelcontextprotocol/sdk v1.13.1
- **Transport**: Stdio (JSON-RPC over stdin/stdout)
- **Capability Negotiation**: Full support for initialize/initialized handshake

### Server Capabilities
```json
{
  "capabilities": {
    "tools": {
      "listChanged": false
    },
    "resources": {
      "subscribe": false,
      "listChanged": false
    }
  }
}
```

### Server Information
```json
{
  "serverInfo": {
    "name": "jane",
    "version": "1.0.0",
    "description": "Knowledge management server for stdlib and specs"
  }
}
```

## Transport Implementation

### Stdio Transport Configuration
**File**: `src/index.ts`
```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Communication Protocol
- **Input**: JSON-RPC messages on stdin
- **Output**: JSON-RPC responses on stdout
- **Error Handling**: JSON-RPC error responses with appropriate error codes
- **Lifecycle**: Graceful connection/disconnection handling

## MCP Tools Implementation

Jane implements 7 MCP tools providing comprehensive document management capabilities.

### 1. get_stdlib
**Purpose**: Retrieve a standard library document for a specific language.

**Schema**:
```json
{
  "type": "object",
  "properties": {
    "language": { "type": "string" },
    "path": { "type": "string" }
  },
  "required": ["language", "path"]
}
```

**Implementation**: `src/tools/index.ts:31-56`
- Validates language and path parameters
- Constructs file path using `getDocumentPath()`
- Reads document using `readDocument()`
- Returns document content with title

**Error Conditions**:
- Invalid language/path parameters
- Document not found
- File system errors

### 2. get_spec
**Purpose**: Retrieve a specification document for a specific project.

**Schema**:
```json
{
  "type": "object",
  "properties": {
    "project": { "type": "string" },
    "path": { "type": "string" }
  },
  "required": ["project", "path"]
}
```

**Implementation**: `src/tools/index.ts:70-95`
- Similar to get_stdlib but for spec documents
- Project-based path resolution
- Consistent error handling patterns

### 3. list_stdlibs
**Purpose**: List available standard library documents or languages.

**Schema**:
```json
{
  "type": "object",
  "properties": {
    "language": { "type": "string" }
  }
}
```

**Implementation**: `src/tools/index.ts:108-154`
- Optional language filter
- Returns either list of languages or documents within a language
- Uses `listLanguages()` and `listDocuments()` from filesystem utils

### 4. list_specs
**Purpose**: List available specification documents or projects.

**Schema**:
```json
{
  "type": "object",
  "properties": {
    "project": { "type": "string" }
  }
}
```

**Implementation**: `src/tools/index.ts:167-213`
- Optional project filter
- Returns either list of projects or documents within a project
- Parallel implementation to list_stdlibs

### 5. search
**Purpose**: Search for documents by content or metadata.

**Schema**:
```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string" },
    "type": { "type": "string", "enum": ["stdlib", "spec"] },
    "language": { "type": "string" },
    "project": { "type": "string" },
    "includeContent": { "type": "boolean" }
  },
  "required": ["query"]
}
```

**Implementation**: `src/tools/index.ts:230-280`
- Uses DocumentIndex for fast search
- Multiple filter options for refined results
- Optional content inclusion for performance

### 6. create_document
**Purpose**: Create a new document with frontmatter metadata.

**Schema**:
```json
{
  "type": "object",
  "properties": {
    "type": { "type": "string", "enum": ["stdlib", "spec"] },
    "language": { "type": "string" },
    "project": { "type": "string" },
    "path": { "type": "string" },
    "title": { "type": "string" },
    "description": { "type": "string" },
    "author": { "type": "string" },
    "tags": { "type": "array", "items": { "type": "string" } },
    "content": { "type": "string" }
  },
  "required": ["type", "path", "title", "content"]
}
```

**Implementation**: `src/tools/index.ts:301-379`
- Validates type-specific required fields (language for stdlib, project for spec)
- Generates frontmatter with metadata
- Creates document using `writeDocument()`
- Updates search index

### 7. update_document
**Purpose**: Update an existing document's content and/or metadata.

**Schema**: Same as create_document but with optional fields
```json
{
  "type": "object",
  "properties": {
    "updateMeta": { "type": "boolean", "default": true }
  }
}
```

**Implementation**: `src/tools/index.ts:401-476`
- Preserves existing metadata for unspecified fields
- Selective metadata updates via updateMeta parameter
- Uses `updateDocument()` for atomic operations

## MCP Resources Implementation

Jane exposes two types of MCP resources for direct document access.

### Resource Types

#### stdlib://{language}/{path}
**Purpose**: Direct access to standard library documents
**URI Template**: `stdlib://{language}/{path}`
**MIME Type**: `text/markdown`

**Implementation**: `src/resources/index.ts`
- Pattern matching for stdlib URIs
- Language and path extraction from URI
- Document content retrieval with metadata

#### spec://{project}/{path}
**Purpose**: Direct access to specification documents
**URI Template**: `spec://{project}/{path}`
**MIME Type**: `text/markdown`

**Implementation**: `src/resources/index.ts`
- Pattern matching for spec URIs
- Project and path extraction from URI
- Consistent with stdlib resource handling

### Resource Handler Flow
```typescript
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  if (uri.startsWith('stdlib://')) {
    // Handle stdlib resource
  } else if (uri.startsWith('spec://')) {
    // Handle spec resource
  } else {
    throw new Error('Unknown resource type');
  }
});
```

## Error Handling Strategy

### MCP Error Codes
Jane uses standard JSON-RPC error codes:
- `-32700`: Parse error
- `-32600`: Invalid request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32000`: Server error (application-specific)

### Error Response Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "details": "Language parameter is required"
    }
  }
}
```

### Error Handling Patterns
1. **Input Validation**: Zod schema validation with descriptive messages
2. **File System Errors**: Graceful handling of missing files/permissions
3. **User-Friendly Messages**: Clear error descriptions for MCP clients
4. **Server Logging**: Detailed error logging for debugging

## Schema Validation

### Zod Integration
All tool inputs are validated using Zod schemas:
```typescript
const GetStdlibArgsSchema = z.object({
  language: z.string().min(1),
  path: z.string().min(1)
});
```

### Validation Flow
1. Raw request parameters received
2. Zod schema validation applied
3. Type-safe parameters passed to implementation
4. Validation errors returned as JSON-RPC errors

## Protocol Extensions

### Custom Metadata
Jane extends standard MCP responses with additional metadata:
- **Document timestamps**: createdAt, updatedAt in frontmatter
- **Search context**: Match highlighting and relevance scores
- **Path information**: Relative paths for document organization

### Performance Optimizations
- **Lazy Loading**: Documents loaded only when requested
- **Index Caching**: Search index maintained in memory
- **Batched Operations**: Efficient bulk document operations

## Client Integration

### Supported MCP Clients
- **Claude Desktop**: Full feature support with UI integration
- **Claude Code CLI**: Command-line access to all tools and resources
- **Custom Clients**: Any MCP-compliant client using stdio transport

### Usage Patterns
1. **Discovery**: `list_stdlibs` and `list_specs` for available content
2. **Search**: `search` tool for content discovery
3. **Retrieval**: `get_stdlib`/`get_spec` or resource URIs for document access
4. **Management**: `create_document` and `update_document` for content management

## Protocol Compliance Testing

### MCP Inspector
Jane is compatible with the official MCP Inspector tool:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### Test Coverage
- All 7 tools tested for correct request/response handling
- Resource access tested for both URI patterns
- Error conditions tested for appropriate error codes
- Schema validation tested for all input parameters

## Future MCP Features

### Potential Enhancements
- **Sampling Support**: Integration with client-side LLM sampling
- **Progress Notifications**: Long-running operation progress updates
- **Resource Subscriptions**: Real-time document change notifications
- **Tool Annotations**: Enhanced tool metadata for better client UX

### Protocol Evolution
Jane's modular architecture supports easy upgrades to future MCP protocol versions while maintaining backward compatibility.
