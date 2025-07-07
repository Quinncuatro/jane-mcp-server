---
title: Jane MCP Server - Testing Strategy
description: >-
  Comprehensive testing strategy including unit tests, integration tests, and
  quality assurance
tags:
  - testing
  - quality-assurance
  - unit-tests
  - integration-tests
  - vitest
createdAt: '2025-06-30T22:05:21.725Z'
updatedAt: '2025-06-30T22:05:21.725Z'
---
# Jane MCP Server - Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Jane MCP server, covering unit tests, integration tests, performance testing, and quality assurance practices to ensure reliable operation and maintainability.

## Testing Philosophy

### Core Principles
- **Test-Driven Development**: Write tests before implementation when possible
- **Comprehensive Coverage**: Cover all critical paths and edge cases
- **Fast Feedback**: Quick test execution for rapid development cycles
- **Isolated Testing**: Tests should be independent and repeatable
- **Real-World Scenarios**: Tests should reflect actual usage patterns

### Testing Pyramid
1. **Unit Tests (70%)**: Fast, isolated component testing
2. **Integration Tests (20%)**: Component interaction testing
3. **End-to-End Tests (10%)**: Full workflow validation

## Test Framework Configuration

### Primary Framework: Vitest
**Configuration**: `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', 'tests/']
    }
  },
});
```

### Test Environment
- **Node.js Environment**: Tests run in Node.js context
- **Global Test Functions**: `describe`, `it`, `expect` available globally
- **Coverage Reporting**: V8 coverage provider for accurate metrics
- **Watch Mode**: Automatic test re-running during development

## Unit Testing Strategy

### Test Organization
Tests are organized by component and functionality:
```
tests/
├── frontmatter.test.ts      # Frontmatter parsing tests
├── filesystem.test.ts       # File system operations
├── server.test.ts          # Server creation and setup
├── jane-diagnostics.ts     # Diagnostic utilities
├── test-doc-creation.ts    # Document creation testing
└── test-mcp-client.cjs     # MCP client integration
```

### Unit Test Categories

#### 1. Frontmatter Processing (`frontmatter.test.ts`)
Tests for YAML frontmatter parsing and generation:

```typescript
describe('Frontmatter Utilities', () => {
  describe('parseFrontmatter', () => {
    it('should parse valid frontmatter with all fields', () => {
      const content = `---
title: "Test Document"
description: "Test description"
author: "Test Author"
createdAt: "2023-01-01T00:00:00Z"
updatedAt: "2023-01-02T00:00:00Z"
tags:
  - test
  - markdown
---

# Test Content

This is test content.`;

      const result = parseFrontmatter(content);
      expect(result.data.title).toBe('Test Document');
      expect(result.data.tags).toEqual(['test', 'markdown']);
      expect(result.content.trim()).toBe('# Test Content\n\nThis is test content.');
    });

    it('should handle missing optional fields', () => {
      const content = `---
title: "Minimal Document"
createdAt: "2023-01-01T00:00:00Z"
updatedAt: "2023-01-01T00:00:00Z"
---

Content only.`;

      const result = parseFrontmatter(content);
      expect(result.data.title).toBe('Minimal Document');
      expect(result.data.description).toBeUndefined();
      expect(result.data.author).toBeUndefined();
      expect(result.data.tags).toBeUndefined();
    });
  });

  describe('generateFrontmatter', () => {
    it('should generate valid YAML frontmatter', () => {
      const meta = {
        title: 'Generated Document',
        description: 'Auto-generated test document',
        author: 'Test Suite',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['generated', 'test']
      };

      const frontmatter = generateFrontmatter(meta);
      expect(frontmatter).toContain('title: "Generated Document"');
      expect(frontmatter).toContain('- generated');
      expect(frontmatter).toContain('- test');
    });
  });
});
```

#### 2. File System Operations (`filesystem.test.ts`)
Tests for document CRUD operations and path management:

```typescript
describe('Filesystem Operations', () => {
  beforeEach(async () => {
    // Setup test environment
    await ensureJaneStructure();
  });

  afterEach(async () => {
    // Cleanup test files
    await cleanupTestFiles();
  });

  describe('Document Creation', () => {
    it('should create stdlib document with proper structure', async () => {
      const document = {
        title: 'Test Library Function',
        description: 'Testing document creation',
        content: '# Test Library Function\n\nTest content.'
      };

      await writeDocument('stdlib', 'javascript', 'test.md', document);
      
      const filePath = path.join(JANE_DIR, 'stdlib', 'javascript', 'test.md');
      expect(await fs.pathExists(filePath)).toBe(true);
      
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('title: "Test Library Function"');
      expect(content).toContain('# Test Library Function');
    });

    it('should create spec document with project structure', async () => {
      const document = {
        title: 'Test Specification',
        description: 'Testing spec creation',
        content: '# Test Specification\n\nSpec content.'
      };

      await writeDocument('spec', 'testproject', 'spec.md', document);
      
      const filePath = path.join(JANE_DIR, 'specs', 'testproject', 'spec.md');
      expect(await fs.pathExists(filePath)).toBe(true);
    });
  });

  describe('Document Reading', () => {
    it('should read and parse existing document', async () => {
      // First create a document
      const originalDoc = {
        title: 'Original Document',
        description: 'For reading test',
        content: '# Original Content'
      };
      await writeDocument('stdlib', 'python', 'original.md', originalDoc);

      // Then read it back
      const readDoc = await readDocument('stdlib', 'python', 'original.md');
      expect(readDoc.title).toBe('Original Document');
      expect(readDoc.meta.description).toBe('For reading test');
      expect(readDoc.content).toContain('# Original Content');
    });

    it('should throw error for non-existent document', async () => {
      await expect(readDocument('stdlib', 'python', 'nonexistent.md'))
        .rejects.toThrow();
    });
  });

  describe('Path Resolution', () => {
    it('should resolve stdlib paths correctly', () => {
      const path = getDocumentPath('stdlib', 'javascript', 'test.md');
      expect(path).toContain('stdlib/javascript/test.md');
    });

    it('should resolve spec paths correctly', () => {
      const path = getDocumentPath('spec', 'myproject', 'spec.md');
      expect(path).toContain('specs/myproject/spec.md');
    });

    it('should prevent directory traversal', () => {
      expect(() => getDocumentPath('stdlib', 'javascript', '../../../etc/passwd'))
        .toThrow();
    });
  });
});
```

#### 3. Server Creation (`server.test.ts`)
Tests for MCP server initialization and configuration:

```typescript
describe('Server Creation', () => {
  it('should create server with correct capabilities', async () => {
    const server = await createServer();
    expect(server).toBeDefined();
    // Test server capabilities
  });

  it('should initialize document index', async () => {
    const server = await createServer();
    // Test that document index is properly initialized
  });

  it('should register all required tools', async () => {
    const server = await createServer();
    // Test that all 7 tools are registered
  });
});
```

### Test Utilities

#### Test Helper Functions (`src/utils/test-helpers.ts`)
```typescript
export function createTestDocument(type: 'stdlib' | 'spec') {
  return {
    title: `Test ${type} Document`,
    description: `Test document for ${type}`,
    author: 'Test Suite',
    tags: ['test', type],
    content: `# Test ${type} Document\n\nTest content for ${type} documents.`
  };
}

export async function cleanupTestFiles() {
  // Remove test files and reset environment
}

export function generateTestData(count: number) {
  // Generate test documents for bulk testing
}
```

## Integration Testing

### MCP Protocol Testing

#### MCP Client Integration (`test-mcp-client.cjs`)
Tests full MCP protocol compliance:

```javascript
const testSequence = async () => {
  const client = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js']
  });

  try {
    // Test server initialization
    await client.connect();
    
    // Test tools/list
    const toolsResponse = await client.request({
      method: 'tools/list',
      params: {}
    });
    
    expect(toolsResponse.tools).toBeDefined();
    expect(toolsResponse.tools.length).toBe(7);
    
    // Test individual tools
    for (const tool of toolsResponse.tools) {
      console.log(`Testing tool: ${tool.name}`);
      await testTool(client, tool);
    }
    
    // Test resources
    await testResources(client);
    
  } finally {
    await client.disconnect();
  }
};

async function testTool(client, tool) {
  switch (tool.name) {
    case 'list_stdlibs':
      const result = await client.request({
        method: 'tools/call',
        params: {
          name: 'list_stdlibs',
          arguments: {}
        }
      });
      expect(result.content[0].text).toContain('Available languages');
      break;
      
    case 'search':
      const searchResult = await client.request({
        method: 'tools/call',
        params: {
          name: 'search',
          arguments: {
            query: 'test',
            includeContent: false
          }
        }
      });
      expect(searchResult.content).toBeDefined();
      break;
  }
}
```

### Document Operations Testing (`test-doc-creation.ts`)
Integration tests for complete document workflows:

```typescript
async function testDocumentOperations() {
  console.log('Testing document creation workflow...');
  
  // Test stdlib document creation
  const stdlibDoc = await createTestDocument('stdlib');
  await writeDocument('stdlib', 'javascript', 'integration-test.md', stdlibDoc);
  
  // Verify document exists
  const readDoc = await readDocument('stdlib', 'javascript', 'integration-test.md');
  assert(readDoc.title === stdlibDoc.title);
  
  // Test document update
  const updatedDoc = {
    ...stdlibDoc,
    title: 'Updated Integration Test',
    tags: ['test', 'updated', 'integration']
  };
  await updateDocument('stdlib', 'javascript', 'integration-test.md', updatedDoc);
  
  // Verify update
  const updatedReadDoc = await readDocument('stdlib', 'javascript', 'integration-test.md');
  assert(updatedReadDoc.title === 'Updated Integration Test');
  
  // Test search functionality
  const searchResults = await documentIndex.search('integration test');
  assert(searchResults.length > 0);
  
  console.log('✅ Document operations test passed');
}
```

## Diagnostic Testing

### System Diagnostics (`jane-diagnostics.ts`)
Comprehensive system health checks:

```typescript
async function runDiagnostics() {
  console.log('🔧 Running Jane MCP Server Diagnostics');
  
  // Test 1: Environment checks
  await testEnvironment();
  
  // Test 2: Jane directory structure
  await testJaneStructure();
  
  // Test 3: Document operations
  await testDocumentOperations();
  
  // Test 4: Search functionality
  await testSearchFunctionality();
  
  // Test 5: MCP protocol compliance
  await testMCPProtocol();
  
  console.log('✅ All diagnostics passed');
}

async function testEnvironment() {
  console.log('📋 Testing environment...');
  
  // Check Node.js version
  const nodeVersion = process.version;
  assert(nodeVersion >= 'v18.0.0', `Node.js 18+ required, got ${nodeVersion}`);
  
  // Check file system permissions
  const janeDir = findJaneDirectory();
  const testFile = path.join(janeDir, '.diagnostic-test');
  
  try {
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
    console.log('✅ File system permissions OK');
  } catch (error) {
    throw new Error(`File system permissions issue: ${error.message}`);
  }
}
```

## Performance Testing

### Load Testing
```typescript
describe('Performance Tests', () => {
  it('should handle multiple concurrent document reads', async () => {
    const promises = [];
    
    for (let i = 0; i < 50; i++) {
      promises.push(readDocument('stdlib', 'javascript', 'test.md'));
    }
    
    const startTime = Date.now();
    await Promise.all(promises);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
  });

  it('should handle large search queries efficiently', async () => {
    // Create many test documents
    for (let i = 0; i < 100; i++) {
      await writeDocument('stdlib', 'javascript', `test-${i}.md`, {
        title: `Test Document ${i}`,
        content: `Content for document ${i} with searchable text`
      });
    }
    
    const startTime = Date.now();
    const results = await documentIndex.search('searchable text');
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(500); // Should complete in under 500ms
    expect(results.length).toBeGreaterThan(0);
  });
});
```

### Memory Testing
```typescript
describe('Memory Usage Tests', () => {
  it('should not leak memory during document operations', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Perform many document operations
    for (let i = 0; i < 1000; i++) {
      const doc = createTestDocument('stdlib');
      await writeDocument('stdlib', 'javascript', `memory-test-${i}.md`, doc);
      await readDocument('stdlib', 'javascript', `memory-test-${i}.md`);
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (less than 50MB for 1000 operations)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

## Test Execution

### Running Tests

#### Development Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/frontmatter.test.ts

# Run tests with coverage
npx vitest run --coverage
```

#### Continuous Integration
```bash
# Run tests with minimal output
npm test -- --reporter=minimal

# Run tests with coverage and export
npm test -- --coverage --reporter=lcov
```

#### Integration Testing
```bash
# Run MCP client integration test
node tests/test-mcp-client.cjs

# Run document operation tests
npx tsx tests/test-doc-creation.ts

# Run comprehensive diagnostics
npx tsx tests/jane-diagnostics.ts
```

### Test Coverage Goals

#### Coverage Targets
- **Overall Coverage**: 85%+
- **Function Coverage**: 90%+
- **Branch Coverage**: 80%+
- **Line Coverage**: 85%+

#### Critical Paths (100% Coverage Required)
- Document CRUD operations
- MCP tool implementations
- Frontmatter parsing/generation
- Path resolution and validation
- Error handling

## Quality Assurance

### Code Quality Checks

#### Pre-commit Validation
```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Test execution
npm test

# Build verification
npm run build
```

#### Automated Quality Gates
- All tests must pass
- Code coverage must meet targets
- No linting errors
- No TypeScript errors
- Successful build

### Test Data Management

#### Test Fixtures
```typescript
// tests/fixtures/documents.ts
export const testDocuments = {
  stdlib: {
    javascript: {
      'array-methods.md': {
        title: 'JavaScript Array Methods',
        description: 'Common array methods',
        content: '# Array Methods\n\n...'
      }
    }
  },
  specs: {
    'test-project': {
      'api.md': {
        title: 'API Specification',
        description: 'REST API docs',
        content: '# API Spec\n\n...'
      }
    }
  }
};
```

#### Test Environment Isolation
- Tests use temporary directories
- Test data is cleaned up after each test
- No interference between test runs
- Deterministic test outcomes

## Continuous Testing

### Test Automation

#### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Performance Monitoring
- Track test execution time trends
- Monitor memory usage patterns
- Alert on performance regressions
- Regular performance benchmarking

## Testing Best Practices

### Test Writing Guidelines
1. **Descriptive Names**: Test names should clearly describe what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **Single Responsibility**: Each test should verify one specific behavior
4. **Independent Tests**: Tests should not depend on the execution order
5. **Meaningful Assertions**: Use specific assertions that provide clear failure messages

### Debugging Failed Tests
1. **Verbose Output**: Use detailed logging in test failures
2. **Snapshot Testing**: Capture and compare complex outputs
3. **Debugging Mode**: Run individual tests with debugger attached
4. **Test Data Inspection**: Preserve test data for manual inspection

### Maintenance
- Regular review and update of test cases
- Removal of obsolete tests
- Addition of tests for new features and bug fixes
- Periodic performance test baseline updates
