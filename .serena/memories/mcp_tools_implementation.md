# Jane MCP Server - MCP Tools Implementation

## Overview of 7 MCP Tools

Jane implements 7 MCP tools for document management, each with specific schemas and error handling.

### 1. `get_stdlib` 
**Purpose**: Retrieve standard library document for a specific language
**Parameters**:
- `language` (string): Programming language (javascript, typescript, python, etc.)
- `path` (string): Path to document within language directory
**Returns**: Document with title and content
**Implementation**: `src/tools/index.ts:31-56`

### 2. `get_spec`
**Purpose**: Retrieve specification document for a specific project  
**Parameters**:
- `project` (string): Project name
- `path` (string): Path to document within project directory
**Returns**: Document with title and content
**Implementation**: `src/tools/index.ts:70-95`

### 3. `list_stdlibs`
**Purpose**: List available standard library documents or languages
**Parameters**:
- `language` (optional string): Filter by specific language
**Returns**: Array of document paths or available languages
**Implementation**: `src/tools/index.ts:108-154`

### 4. `list_specs`
**Purpose**: List available specification documents or projects
**Parameters**:
- `project` (optional string): Filter by specific project
**Returns**: Array of document paths or available projects  
**Implementation**: `src/tools/index.ts:167-213`

### 5. `search`
**Purpose**: Search documents by content or metadata
**Parameters**:
- `query` (string): Search query
- `type` (optional): Filter by 'stdlib' or 'spec'
- `language` (optional): Filter stdlib by language
- `project` (optional): Filter specs by project
- `includeContent` (optional boolean): Include full content in results
**Returns**: Array of search results with metadata and optional content
**Implementation**: `src/tools/index.ts:230-280`

### 6. `create_document`
**Purpose**: Create new document with frontmatter metadata
**Parameters**:
- `type` (string): 'stdlib' or 'spec'
- `language` (string): Required for stdlib documents
- `project` (string): Required for spec documents
- `path` (string): Path within language/project directory
- `title` (string): Document title
- `description` (optional): Document description
- `author` (optional): Document author
- `tags` (optional array): Document tags
- `content` (string): Markdown content
**Returns**: Success message with document path
**Implementation**: `src/tools/index.ts:301-379`

### 7. `update_document`
**Purpose**: Update existing document content and/or metadata
**Parameters**: Same as create_document but all fields except type/language/project/path are optional
- `updateMeta` (optional boolean): Whether to update metadata (default true)
**Returns**: Success message
**Implementation**: `src/tools/index.ts:401-476`

## Error Handling Patterns
- All tools use try-catch blocks with proper error logging
- User-friendly error messages returned to MCP client
- Detailed error information logged to console for debugging
- Validation of required parameters using zod schemas
- Graceful handling of file system errors

## Schema Validation
- Input schemas defined using zod for runtime type checking
- Required vs optional parameters clearly defined
- Type coercion and validation before processing
- Consistent error messages for invalid inputs