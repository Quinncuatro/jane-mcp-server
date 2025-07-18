import { vi, describe, test, expect } from 'vitest';
import { createServer } from '../src/server.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock dependencies
vi.mock('../src/utils/filesystem.js', () => {
  return {
    ensureJaneStructure: vi.fn().mockResolvedValue(undefined),
    listLanguages: vi.fn().mockResolvedValue(['javascript', 'typescript', 'python']),
    listProjects: vi.fn().mockResolvedValue(['project1', 'project2']),
    writeDocument: vi.fn().mockResolvedValue({ success: true })
  };
});

vi.mock('../src/utils/search.js', () => {
  return {
    documentIndex: {
      initialize: vi.fn().mockResolvedValue(undefined)
    }
  };
});

vi.mock('../src/resources/index.js', () => {
  return {
    implementResources: vi.fn()
  };
});

vi.mock('../src/tools/index.js', () => {
  return {
    implementTools: vi.fn()
  };
});

import { documentIndex } from '../src/utils/search.js';
import { ensureJaneStructure } from '../src/utils/filesystem.js';

describe('Server Creation', () => {
  test('should create and configure server correctly', async () => {
    const server = await createServer();
    
    // Ensure Jane directory structure is created
    expect(ensureJaneStructure).toHaveBeenCalled();
    
    // Document index should be initialized
    expect(documentIndex.initialize).toHaveBeenCalled();
    
    // Server should be an instance of McpServer
    expect(server).toBeInstanceOf(McpServer);
    
    // Since serverInfo is not a public property, we can simply verify server is created
    expect(server).toBeDefined();
  });
});