---
title: Jane MCP Server - Document Management System
description: >-
  Technical specification of document storage, indexing, and management in Jane
  server
tags:
  - document-management
  - filesystem
  - indexing
  - frontmatter
  - storage
createdAt: '2025-06-30T22:03:07.476Z'
updatedAt: '2025-06-30T22:03:07.476Z'
---
# Jane MCP Server - Document Management System

## Overview

Jane implements a sophisticated document management system that handles storage, indexing, and retrieval of knowledge documents. The system supports two primary document types (stdlib and specs) with a unified architecture for consistent operations.

## Document Structure

### Document Types

#### Standard Library Documents (`stdlib`)
- **Purpose**: Programming language standard library documentation
- **Organization**: By programming language (`javascript`, `typescript`, `python`, etc.)
- **Path Pattern**: `Jane/stdlib/{language}/{document}.md`
- **Examples**: 
  - `Jane/stdlib/javascript/array-methods.md`
  - `Jane/stdlib/typescript/interfaces.md`

#### Specification Documents (`specs`)
- **Purpose**: Project specifications and technical documentation
- **Organization**: By project name
- **Path Pattern**: `Jane/specs/{project}/{document}.md`
- **Examples**:
  - `Jane/specs/jane-mcp-server/architecture.md`
  - `Jane/specs/project1/api.md`

### Document Format

#### File Format
- **Extension**: `.md` (Markdown)
- **Encoding**: UTF-8
- **Line Endings**: Unix-style (LF)
- **Structure**: YAML frontmatter + Markdown content

#### Document Template
```markdown
---
title: "Document Title"
description: "Brief description of the document"
author: "Author Name"
createdAt: "2023-01-01T00:00:00Z"
updatedAt: "2023-01-02T00:00:00Z"
tags:
  - "tag1"
  - "tag2"
---

# Document Title

Document content in markdown format...
```

## Frontmatter Schema

### Required Fields
- **title** (string): Human-readable document title
- **createdAt** (ISO 8601 string): Document creation timestamp
- **updatedAt** (ISO 8601 string): Last modification timestamp

### Optional Fields
- **description** (string): Brief document description
- **author** (string): Document author name
- **tags** (array of strings): Classification tags for search and organization

### Schema Validation
```typescript
interface DocumentMeta {
  title: string;
  description?: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}
```

## File System Management

### Directory Structure Management
**Implementation**: `src/utils/filesystem.ts:338-419`

The `ensureJaneStructure()` function creates and maintains the proper directory hierarchy:

```
Jane/
├── stdlib/
│   ├── javascript/
│   ├── typescript/
│   └── python/
└── specs/
    ├── project1/
    └── project2/
```

#### Path Resolution Strategy
1. **Environment Variable**: `JANE_DIR` if set
2. **Current Directory**: `./Jane/` relative to working directory
3. **Project Root**: `./Jane/` relative to git repository root
4. **Parent Directory**: `../Jane/` fallback option

### Document Operations

#### Document Creation
**Function**: `writeDocument(type, identifier, path, document)`
**Implementation**: `src/utils/filesystem.ts`

```typescript
await writeDocument('stdlib', 'javascript', 'new-feature.md', {
  title: 'New JavaScript Feature',
  description: 'Documentation for ES2024 feature',
  content: '# New JavaScript Feature\n\n...'
});
```

**Process**:
1. Validate document type and parameters
2. Generate frontmatter with timestamps
3. Combine frontmatter and content
4. Write to file system
5. Update search index

#### Document Reading
**Function**: `readDocument(type, identifier, path)`
**Implementation**: `src/utils/filesystem.ts`

```typescript
const doc = await readDocument('stdlib', 'javascript', 'array-methods.md');
// Returns: { title: string, content: string, meta: DocumentMeta }
```

**Process**:
1. Construct file path from parameters
2. Read file from file system
3. Parse frontmatter using gray-matter
4. Return structured document object

#### Document Updates
**Function**: `updateDocument(type, identifier, path, updates)`
**Implementation**: `src/utils/filesystem.ts`

```typescript
await updateDocument('stdlib', 'javascript', 'array-methods.md', {
  title: 'Updated Array Methods',
  tags: ['javascript', 'arrays', 'updated'],
  content: 'Updated content...'
});
```

**Process**:
1. Read existing document
2. Merge updates with existing metadata
3. Update `updatedAt` timestamp
4. Write modified document
5. Update search index

### Path Management

#### Path Construction
**Function**: `getDocumentPath(type, identifier, path)`

Constructs standardized paths based on document type:
- **stdlib**: `${JANE_DIR}/stdlib/${language}/${path}`
- **spec**: `${JANE_DIR}/specs/${project}/${path}`

#### Path Validation
- Prevents directory traversal attacks
- Ensures paths stay within Jane directory
- Validates required parameters by document type

## Search Index System

### DocumentIndex Class
**Implementation**: `src/utils/search.ts:7-224`

The DocumentIndex provides fast, in-memory search capabilities across all documents.

#### Index Structure
```typescript
interface SearchableDocument {
  type: 'stdlib' | 'spec';
  identifier: string; // language or project
  path: string;
  title: string;
  description?: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

#### Indexing Process
1. **Initialization**: `initialize()` method scans all documents
2. **Content Extraction**: Reads frontmatter and content
3. **Text Processing**: Normalizes text for search
4. **Index Storage**: Maintains in-memory searchable index

#### Search Operations
**Method**: `search(query, filters)`

```typescript
const results = await documentIndex.search('array methods', {
  type: 'stdlib',
  language: 'javascript',
  includeContent: false
});
```

**Search Features**:
- **Full-text search**: Content and metadata
- **Filtering**: By type, language, project
- **Ranking**: Relevance-based result ordering
- **Content inclusion**: Optional full content in results

#### Index Maintenance
- **Automatic updates**: Index updated on document changes
- **Incremental updates**: Only modified documents re-indexed
- **Memory management**: Index rebuilt on server restart

## Document Lifecycle

### Document Creation Workflow
```
Request → Validation → Path Construction → Content Generation → 
File Write → Index Update → Response
```

1. **Request Validation**: Check required parameters and types
2. **Path Construction**: Build safe file system path
3. **Content Generation**: Create frontmatter + markdown
4. **File Write**: Atomic write to file system
5. **Index Update**: Add to search index
6. **Response**: Return success or error

### Document Update Workflow
```
Request → Document Read → Metadata Merge → Content Update → 
File Write → Index Update → Response
```

1. **Document Read**: Load existing document
2. **Metadata Merge**: Combine new and existing metadata
3. **Timestamp Update**: Set new `updatedAt` timestamp
4. **Content Update**: Merge content if provided
5. **File Write**: Atomic write to file system
6. **Index Update**: Update search index entry
7. **Response**: Return success or error

### Document Deletion
Currently not implemented through MCP tools, but can be done via:
- Direct file system operations
- Manual removal from Jane directory
- Index will be rebuilt on next server restart

## Error Handling

### File System Errors
- **Permission denied**: Graceful error with helpful message
- **Disk full**: Caught and reported with storage information
- **Path not found**: Clear error indicating missing directories

### Validation Errors
- **Missing required fields**: Specific field validation messages
- **Invalid document type**: Clear type options provided
- **Path validation**: Directory traversal prevention

### Index Errors
- **Index corruption**: Automatic rebuild on next search
- **Memory issues**: Graceful degradation with warning
- **Concurrent access**: Thread-safe index operations

## Performance Characteristics

### File System Performance
- **Read operations**: O(1) direct file access
- **Write operations**: O(1) file write + O(1) index update
- **Directory listing**: O(n) where n = number of files

### Search Performance
- **Index initialization**: O(n) where n = total documents
- **Search operations**: O(n) linear scan with early termination
- **Memory usage**: ~1KB per document in index

### Scalability Considerations
- **Document limit**: Constrained by available memory for index
- **Concurrent access**: Single-threaded, no concurrent writes
- **Storage growth**: Linear with number of documents

## Configuration and Customization

### Environment Configuration
```bash
# Custom document directory
export JANE_DIR=/path/to/documents

# Enable debug logging
export DEBUG=jane:filesystem
```

### Default Languages
```typescript
const languages = ['javascript', 'typescript', 'python'];
```

### Default Projects
```typescript
const projects = ['project1', 'project2'];
```

### File System Settings
- **Default permissions**: 755 for directories, 644 for files
- **Encoding**: UTF-8 for all text files
- **Backup**: No automatic backup (manual backup recommended)

## Integration Points

### MCP Tools Integration
All document management operations are exposed through MCP tools:
- `create_document`: Creates new documents
- `update_document`: Modifies existing documents
- `get_stdlib`/`get_spec`: Retrieves documents
- `list_stdlibs`/`list_specs`: Lists available documents
- `search`: Searches document index

### MCP Resources Integration
Direct document access via URI patterns:
- `stdlib://{language}/{path}`: Direct stdlib access
- `spec://{project}/{path}`: Direct spec access

### External Tool Integration
- **File watchers**: Could monitor Jane directory for external changes
- **Backup tools**: Can backup entire Jane directory
- **Git integration**: Jane directory can be version controlled

## Future Enhancements

### Planned Improvements
- **Document versioning**: Track document history
- **Concurrent access**: Support multiple writers
- **External storage**: Cloud storage backends
- **Full-text search**: Enhanced search with ranking
- **Document templates**: Standardized document templates
- **Validation schemas**: Configurable document validation
- **Metadata extraction**: Automatic tag generation
- **Content analysis**: Document similarity and recommendations

### Migration Strategies
- **Index format changes**: Automatic migration on startup
- **Document format evolution**: Backward compatibility maintained
- **Storage backend changes**: Export/import utilities
