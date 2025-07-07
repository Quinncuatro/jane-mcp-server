---
title: Jane MCP Server - Development Workflow
description: 'Development setup, workflow, testing, and debugging guide for Jane MCP server'
tags:
  - development
  - workflow
  - setup
  - testing
  - debugging
createdAt: '2025-06-30T22:01:13.329Z'
updatedAt: '2025-06-30T22:01:13.329Z'
---
# Jane MCP Server - Development Workflow

## Overview

This document outlines the complete development workflow for the Jane MCP server, including environment setup, development practices, testing procedures, and debugging techniques.

## Prerequisites

### System Requirements
- **Node.js**: Version 18 or later
- **npm**: Version 8 or later (comes with Node.js)
- **Git**: For version control
- **TypeScript**: Installed globally or via npm scripts

### Optional Tools
- **MCP Inspector**: For interactive testing (`@modelcontextprotocol/inspector`)
- **Claude Desktop**: For integration testing
- **Docker**: For containerized testing and deployment

## Initial Setup

### 1. Repository Setup
```bash
# Clone the repository
git clone <repository-url>
cd jane-mcp-server

# Install dependencies
npm install

# Verify installation
npm run build
npm test
```

### 2. Development Environment
```bash
# Create environment file (optional)
cp .env.example .env

# Set custom Jane directory (optional)
export JANE_DIR=/path/to/your/documents

# Verify setup
npm run dev
```

### 3. IDE Configuration

#### VS Code Settings
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "editor.formatOnSave": true,
  "eslint.enable": true
}
```

#### Recommended Extensions
- ESLint
- TypeScript and JavaScript Language Features
- Prettier (if using)
- MCP Tools (if available)

## Development Commands

### Core Commands
```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint
```

### Utility Commands
```bash
# Run diagnostics
npx tsx tests/jane-diagnostics.ts

# Test document operations
npx tsx tests/test-doc-creation.ts

# Test MCP client interaction
node tests/test-mcp-client.cjs

# Clean build artifacts
rm -rf dist/
```

## Development Workflow

### 1. Feature Development

#### Branch Strategy
```bash
# Create feature branch
git checkout -b feature/new-tool

# Make changes
# ... development work ...

# Test changes
npm test
npm run lint

# Commit changes
git add .
git commit -m "feat: add new tool for document versioning"

# Push and create PR
git push origin feature/new-tool
```

#### Code Organization
- **New tools**: Add to `src/tools/index.ts`
- **New resources**: Add to `src/resources/index.ts`
- **Utilities**: Add to appropriate `src/utils/` file
- **Tests**: Add to `tests/` directory with `.test.ts` suffix

### 2. Testing Workflow

#### Unit Testing
```bash
# Run specific test file
npx vitest run tests/filesystem.test.ts

# Run tests matching pattern
npx vitest run --reporter=verbose --grep="frontmatter"

# Watch mode for TDD
npx vitest --watch
```

#### Integration Testing
```bash
# Test MCP server startup
npm run dev
# In another terminal:
npx @modelcontextprotocol/inspector node dist/index.js

# Test with Claude Desktop
# Add server to Claude Desktop config and test tools
```

#### Manual Testing
```bash
# Test document operations
npx tsx tests/test-doc-creation.ts

# Test path resolution
npx tsx tests/path-test.ts

# Run comprehensive diagnostics
npx tsx tests/jane-diagnostics.ts
```

### 3. Code Quality

#### Pre-commit Checklist
- [ ] `npm run lint` passes without errors
- [ ] `npm test` passes all tests
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors in IDE
- [ ] New code has appropriate tests

#### Code Style Guidelines
- Use TypeScript strict mode
- Prefer async/await over Promise chains
- Use descriptive variable and function names
- Add JSDoc comments for public APIs
- Handle errors gracefully with user-friendly messages

## Testing Strategy

### Unit Tests
Located in `tests/` directory, using Vitest framework.

#### Test Categories
- **Frontmatter parsing**: `frontmatter.test.ts`
- **File system operations**: `filesystem.test.ts`
- **Server creation**: `server.test.ts`

#### Writing Tests
```typescript
import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../src/utils/frontmatter.js';

describe('parseFrontmatter', () => {
  it('should parse valid frontmatter', () => {
    const content = '---\ntitle: Test\n---\nContent';
    const result = parseFrontmatter(content);
    expect(result.data.title).toBe('Test');
    expect(result.content).toBe('Content');
  });
});
```

### Integration Tests
Testing complete workflows through the MCP interface.

#### MCP Client Testing
```javascript
// tests/test-mcp-client.cjs
const testSequence = async () => {
  // Test tool listing
  const tools = await client.request({
    method: 'tools/list'
  });
  
  // Test tool execution
  const result = await client.request({
    method: 'tools/call',
    params: {
      name: 'list_stdlibs',
      arguments: {}
    }
  });
};
```

### Manual Testing Procedures

#### 1. Server Startup Testing
```bash
# Test clean startup
npm start
# Should see: "Jane MCP server is running and ready for connections"

# Test with custom Jane directory
JANE_DIR=/tmp/test-jane npm start

# Test path resolution
npx tsx tests/path-test.ts
```

#### 2. Tool Testing
```bash
# Start MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js

# Test each tool manually:
# - list_stdlibs
# - list_specs
# - search
# - get_stdlib
# - get_spec
# - create_document
# - update_document
```

#### 3. Document Operations Testing
```bash
# Test document creation
npx tsx tests/test-doc-creation.ts

# Verify Jane directory structure
find Jane/ -type f -name "*.md" | head -10

# Test search functionality
# Use MCP Inspector to call search tool
```

## Debugging

### Development Debugging

#### Console Logging
The server uses a custom logger with colored output:
```typescript
import { logger } from './utils/logger.js';

logger.info('Debug information');
logger.warning('Warning message');
logger.error('Error occurred');
logger.success('Operation completed');
```

#### Debug Environment
```bash
# Enable verbose logging
DEBUG=jane:* npm run dev

# Run with Node.js inspector
node --inspect dist/index.js

# Use TypeScript debugger
npx tsx --inspect src/index.ts
```

### MCP Protocol Debugging

#### Inspector Tool
```bash
# Start inspector for interactive debugging
npx @modelcontextprotocol/inspector node dist/index.js

# Test individual tools and resources
# View JSON-RPC messages in real-time
```

#### Manual MCP Testing
```javascript
// Create simple MCP client for testing
const client = new StdioClientTransport({
  command: 'node',
  args: ['dist/index.js']
});

// Send raw MCP messages
const response = await client.request({
  method: 'tools/list'
});
```

### Common Issues and Solutions

#### 1. Jane Directory Not Found
```bash
# Check current working directory
pwd

# Verify Jane directory exists
ls -la Jane/

# Set explicit Jane directory
export JANE_DIR=$(pwd)/Jane
npm start
```

#### 2. TypeScript Compilation Errors
```bash
# Clear TypeScript cache
rm -rf dist/ node_modules/.cache/

# Reinstall dependencies
npm ci

# Check TypeScript configuration
npx tsc --noEmit
```

#### 3. MCP Connection Issues
```bash
# Test server startup
timeout 10s npm start
echo $? # Should be 124 (timeout) for successful startup

# Check stdin/stdout
echo '{"jsonrpc":"2.0","method":"ping","id":1}' | npm start
```

#### 4. Document Index Issues
```bash
# Clear and rebuild index
rm -rf Jane/.index 2>/dev/null || true
npm start # Index will rebuild automatically
```

## Performance Optimization

### Development Performance
- Use `npm run dev` for hot reload during development
- Run tests in watch mode: `npm run test:watch`
- Use TypeScript incremental compilation
- Enable source maps for debugging

### Runtime Performance
- Monitor memory usage of document index
- Profile search operations with large document sets
- Test with realistic document volumes

## Continuous Integration

### GitHub Actions (Example)
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

### Pre-commit Hooks (Example)
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm test"
    }
  }
}
```

## Release Process

### Version Management
```bash
# Update version
npm version patch|minor|major

# Build release
npm run build

# Tag release
git tag v1.0.1
git push origin v1.0.1
```

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped appropriately
- [ ] Git tag created
- [ ] Docker image built (if applicable)

## Troubleshooting

### Development Environment Issues

#### Node.js Version Mismatch
```bash
# Check Node.js version
node --version

# Use nvm to switch versions
nvm use 18
nvm install 18
```

#### Permission Issues
```bash
# Fix Jane directory permissions
chmod -R 755 Jane/

# Create Jane directory if missing
mkdir -p Jane/{stdlib,specs}
```

#### Package Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Runtime Issues

#### Server Won't Start
1. Check Node.js version compatibility
2. Verify all dependencies installed
3. Check for port conflicts
4. Review error logs

#### MCP Client Connection Fails
1. Verify server is responding on stdio
2. Check JSON-RPC message format
3. Test with MCP Inspector
4. Review client configuration

#### Document Operations Fail
1. Check Jane directory exists and is writable
2. Verify document path format
3. Check file permissions
4. Review error logs for specific issues
