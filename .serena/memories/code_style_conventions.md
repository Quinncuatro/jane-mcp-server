# Jane MCP Server - Code Style & Conventions

## TypeScript Configuration
- **Target**: ES2022 with NodeNext module resolution
- **Strict Mode**: Enabled with `noImplicitAny: false` for flexibility
- **Module System**: ES Modules with .js extensions in imports
- **Output**: `dist/` directory with declaration files and source maps
- **Isolated Modules**: Required for better TypeScript performance

## ESLint Rules & Style
- **Base**: ESLint recommended + TypeScript recommended
- **Console Logging**: Only `console.error` and `console.warn` allowed (uses custom logger instead)
- **Unused Variables**: Error level, but allow args prefixed with underscore
- **Explicit Return Types**: Not required (type inference preferred)
- **Any Types**: Warning level (allowed but discouraged)

## Code Organization Patterns
- **File Extensions**: Use `.ts` for source, `.js` for compiled output
- **Import Style**: ES modules with explicit `.js` extensions for local files
- **Error Handling**: Always use try-catch with proper error logging via custom logger
- **Async Operations**: Prefer async/await over Promises for readability

## Naming Conventions
- **Files**: kebab-case (e.g., `filesystem.ts`, `test-helpers.ts`)
- **Functions**: camelCase (e.g., `createServer`, `ensureJaneStructure`)
- **Classes**: PascalCase (e.g., `DocumentIndex`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `JANE_DIR`, `STDLIB_DIR`)
- **Types/Interfaces**: PascalCase (e.g., `Document`, `DocumentMeta`)

## Logging & Debugging
- **Custom Logger**: Uses colored output with different levels (info, success, warning, error, header, startup)
- **Error Messages**: Always include context and use logger instead of console
- **Debug Information**: Environment info logged on startup (Node version, platform, paths)

## Document Format Standards
- **Frontmatter**: YAML format with required fields (title, description, createdAt, updatedAt)
- **Content**: Markdown format following CommonMark specification
- **File Structure**: Language/project subdirectories with meaningful filenames
- **Metadata**: Consistent field naming (camelCase for programmatic access)

## Testing Patterns
- **Framework**: Vitest with globals enabled
- **Test Files**: `.test.ts` suffix for unit tests, descriptive names for integration tests
- **Test Structure**: Describe blocks for grouping, descriptive test names
- **Mocking**: Use vi.mock for external dependencies
- **Test Environment**: Node environment for file system operations