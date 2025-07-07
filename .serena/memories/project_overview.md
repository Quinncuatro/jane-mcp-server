# Jane MCP Server - Project Overview

## Purpose
Jane is a Model Context Protocol (MCP) server that provides a knowledge management system for standard library and specification documents. It allows Claude and other MCP-compatible LLMs to access, search, and manipulate a repository of documents.

## Core Functionality
- Access standard library documents (`stdlib`) for different programming languages
- Access specification documents (`specs`) for different projects  
- Search through document content and metadata
- Create and update documents with proper YAML frontmatter
- Compatible with Claude Desktop and Claude Code CLI

## Tech Stack
- **Runtime**: Node.js 18+ with ES2022 target
- **Language**: TypeScript with strict mode enabled
- **MCP SDK**: @modelcontextprotocol/sdk v1.13.1
- **File Operations**: fs-extra for enhanced file system operations
- **Pattern Matching**: glob for file pattern matching
- **Document Parsing**: gray-matter for YAML frontmatter parsing
- **Schema Validation**: zod for runtime type checking
- **Testing**: vitest with node environment
- **Linting**: ESLint with TypeScript rules
- **Containerization**: Docker with Alpine Linux base

## Architecture
- **Entry Point**: `src/index.ts` - Sets up stdio transport and starts server
- **Server Creation**: `src/server.ts` - Configures MCP server with resources and tools
- **MCP Tools**: `src/tools/index.ts` - Implements 7 MCP tools for document operations
- **Resources**: `src/resources/index.ts` - Implements MCP resources for document access
- **File System**: `src/utils/filesystem.ts` - Handles document CRUD operations
- **Search Engine**: `src/utils/search.ts` - Provides document indexing and search
- **Document Format**: Markdown with YAML frontmatter metadata
- **Logging**: Custom colored logger for debugging and monitoring

## Document Storage Structure
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