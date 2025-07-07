---
title: Jane MCP Server - System Architecture
description: >-
  Comprehensive overview of Jane MCP server architecture, components, and data
  flow
tags:
  - architecture
  - system-design
  - mcp-server
  - components
  - data-flow
createdAt: '2025-06-30T21:58:07.406Z'
updatedAt: '2025-06-30T21:58:07.406Z'
---
# Jane MCP Server - System Architecture

## Overview

Jane is a Model Context Protocol (MCP) server that provides a knowledge management system for standard library and specification documents. The server is built using TypeScript and the official MCP SDK, following a modular architecture that separates concerns between transport, server logic, document management, and search capabilities.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Client (Claude Desktop/Code)             │
└─────────────────────────┬───────────────────────────────────────┘
                         │ JSON-RPC over stdio
                         │
┌─────────────────────────▼───────────────────────────────────────┐
│                  StdioServerTransport                           │
└─────────────────────────┬───────────────────────────────────────┘
                         │
┌─────────────────────────▼───────────────────────────────────────┐
│                     McpServer                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │   Resources     │ │      Tools       │ │     Logger      │  │
│  │   Handler       │ │     Handler      │ │    Component    │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                         │
┌─────────────────────────▼───────────────────────────────────────┐
│                   Document Layer                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │   Filesystem    │ │   Frontmatter   │ │  DocumentIndex  │  │
│  │    Manager      │ │     Parser      │ │   (Search)      │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                         │
┌─────────────────────────▼───────────────────────────────────────┐
│                   File System                                  │
│           Jane/stdlib/    │    Jane/specs/                     │
│        ├── javascript/   │   ├── project1/                    │
│        ├── typescript/   │   ├── project2/                    │
│        └── python/       │   └── ...                          │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Transport Layer (`src/index.ts`)
- **Entry Point**: Main application entry with server initialization
- **Transport**: Uses `StdioServerTransport` for JSON-RPC communication over stdin/stdout
- **Protocol**: Implements MCP protocol v2024-11-05
- **Connection**: Handles client connection lifecycle and error management

### 2. Server Core (`src/server.ts`)
- **McpServer Instance**: Central server using @modelcontextprotocol/sdk
- **Capability Declaration**: Announces supported features (tools, resources)
- **Initialization**: Sets up directory structure and test documents
- **Service Registration**: Wires together resources, tools, and document indexing

### 3. MCP Tools (`src/tools/index.ts`)
Seven registered tools implementing the MCP tool interface:
- `get_stdlib` - Retrieve standard library documents
- `get_spec` - Retrieve specification documents  
- `list_stdlibs` - List available stdlib documents/languages
- `list_specs` - List available spec documents/projects
- `search` - Search documents by content and metadata
- `create_document` - Create new documents with frontmatter
- `update_document` - Update existing document content/metadata

### 4. MCP Resources (`src/resources/index.ts`)
Two resource types for direct document access:
- `stdlib://{language}/{path}` - Standard library document resources
- `spec://{project}/{path}` - Specification document resources

### 5. Document Management (`src/utils/filesystem.ts`)
- **Path Resolution**: Intelligent Jane directory discovery across environments
- **CRUD Operations**: Create, read, update document operations
- **Directory Structure**: Ensures proper stdlib/specs hierarchy
- **File System Interface**: Abstraction over fs-extra for enhanced file operations

### 6. Document Search (`src/utils/search.ts`)
- **DocumentIndex Class**: In-memory search index for fast content queries
- **Indexing**: Full-text indexing of document content and metadata
- **Search Filters**: Support for type, language, project filtering
- **Incremental Updates**: Maintains index consistency during document modifications

### 7. Frontmatter Processing (`src/utils/frontmatter.ts`)
- **YAML Parsing**: gray-matter integration for frontmatter extraction
- **Metadata Management**: Handles title, description, tags, timestamps
- **Schema Validation**: Ensures consistent metadata structure

### 8. Logging System (`src/utils/logger.ts`)
- **Colored Output**: Environment-aware colored logging for debugging
- **Log Levels**: info, success, warning, error, header, startup
- **Structured Logging**: Consistent format for server events and errors

## Data Flow

### Document Creation Flow
```
Client Request → Tool Validation → Document Generation → 
Filesystem Write → Index Update → Response
```

### Document Retrieval Flow
```
Client Request → Path Resolution → File Read → 
Frontmatter Parse → Content Format → Response
```

### Search Flow
```
Client Request → Query Processing → Index Search → 
Results Filtering → Content Assembly → Response
```

## Key Architectural Decisions

### 1. Transport Strategy
- **Stdio Transport**: Chosen for simplicity and broad MCP client compatibility
- **JSON-RPC**: Standard MCP protocol implementation
- **Synchronous Processing**: Single-threaded request handling for consistency

### 2. Document Storage
- **File-based Storage**: Markdown files with YAML frontmatter for human readability
- **Hierarchical Organization**: Language/project-based directory structure
- **Portable Paths**: Relative path resolution for cross-environment compatibility

### 3. Search Architecture
- **In-Memory Index**: Fast search with acceptable memory usage for document sets
- **Lazy Initialization**: Index built on first search or server startup
- **Full-Text Search**: Content and metadata indexing for comprehensive discovery

### 4. Error Handling
- **Graceful Degradation**: Server continues operation despite individual document errors
- **User-Friendly Messages**: Clear error messages for MCP clients
- **Detailed Logging**: Comprehensive server-side logging for debugging

### 5. Modularity
- **Clean Separation**: Clear boundaries between transport, business logic, and storage
- **Dependency Injection**: Shared instances (logger, document index) injected appropriately
- **Testability**: Each component can be tested independently

## Technology Stack Integration

### MCP SDK Integration
- **Server**: Uses `McpServer` from @modelcontextprotocol/sdk for MCP compliance
- **Types**: Leverages SDK type definitions for protocol conformance
- **Transport**: Built-in stdio transport for standard MCP communication

### TypeScript Configuration
- **ES2022 Target**: Modern JavaScript features with Node.js 18+ support
- **Strict Mode**: Enhanced type safety and error detection
- **Module System**: ES modules with NodeNext resolution

### External Dependencies
- **fs-extra**: Enhanced file system operations with promise support
- **gray-matter**: YAML frontmatter parsing for document metadata
- **glob**: Pattern-based file discovery and filtering
- **zod**: Runtime schema validation for tool inputs

## Scalability Considerations

### Current Limitations
- **Single-threaded**: No concurrent request processing
- **In-memory Search**: Index size limited by available memory
- **Local Storage**: No distributed or cloud storage support

### Growth Path
- **Async Processing**: Potential for concurrent request handling
- **External Search**: Integration with Elasticsearch or similar for large document sets
- **Distributed Storage**: Cloud storage backends for scalability
- **Caching Layer**: Redis or similar for performance optimization

## Security Considerations

### Current Implementation
- **File System Access**: Limited to Jane directory structure
- **Input Validation**: Zod schemas for all tool inputs
- **Path Sanitization**: Prevents directory traversal attacks

### Future Enhancements
- **Authentication**: User-based access control for document operations
- **Authorization**: Role-based permissions for different document types
- **Audit Logging**: Track all document modifications for compliance
