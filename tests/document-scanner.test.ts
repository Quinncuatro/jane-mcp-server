import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import { scanAndIndexDocuments } from '../src/utils/document-scanner';

// Mock dependencies
vi.mock('../src/utils/filesystem.js', () => ({
  listDocuments: vi.fn(),
  readDocument: vi.fn(),
  getDocumentPath: vi.fn(),
  JANE_DIR: '/mock/jane'
}));

// Mock fs-extra properly with a default export
const mockStat = vi.fn();
const mockPathExists = vi.fn();
vi.mock('fs-extra', () => ({
  default: {
    stat: mockStat,
    pathExists: mockPathExists
  },
  stat: mockStat,
  pathExists: mockPathExists
}));

vi.mock('../src/utils/search.js', () => ({
  documentIndex: {
    initialize: vi.fn(),
    addOrUpdateDocument: vi.fn(),
    getAllDocumentsMetadata: vi.fn(),
    getDocumentMetadata: vi.fn(),
    removeDocument: vi.fn()
  }
}));

vi.mock('../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  }
}));

import { listDocuments, readDocument, getDocumentPath } from '../src/utils/filesystem.js';
import { documentIndex } from '../src/utils/search.js';

describe('Document Scanner', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mocks
    vi.mocked(getDocumentPath).mockImplementation((type, docPath) => 
      `/mock/jane/${type}/${docPath}`);
    
    mockStat.mockResolvedValue({
      mtime: new Date('2023-01-01T12:00:00Z')
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should scan and index new documents that are not in the database', async () => {
    // Setup empty database (no existing documents)
    vi.mocked(documentIndex.getAllDocumentsMetadata).mockResolvedValue(new Map());
    
    // Mock document listings
    vi.mocked(listDocuments).mockImplementation(async (type) => {
      if (type === 'stdlib') {
        return ['javascript/array.md', 'python/list.md'];
      } else {
        return ['project1/api.md'];
      }
    });

    // Mock document reading
    vi.mocked(readDocument).mockImplementation(async (type, path) => {
      return {
        type,
        path,
        content: `# Test content for ${path}`,
        meta: { 
          title: `Test ${path}`, 
          tags: ['test'],
          updatedAt: new Date('2023-01-01T12:00:00Z').toISOString()
        }
      };
    });

    const result = await scanAndIndexDocuments();

    // Verify correct documents were indexed
    expect(result.indexed).toBe(3);
    expect(result.skipped).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.errors.length).toBe(0);

    // Verify listings were called for both document types
    expect(listDocuments).toHaveBeenCalledWith('stdlib');
    expect(listDocuments).toHaveBeenCalledWith('spec');
    
    // Verify documents were read
    expect(readDocument).toHaveBeenCalledWith('stdlib', 'javascript/array.md');
    expect(readDocument).toHaveBeenCalledWith('stdlib', 'python/list.md');
    expect(readDocument).toHaveBeenCalledWith('spec', 'project1/api.md');
    
    // Verify documents were added to index
    expect(documentIndex.addOrUpdateDocument).toHaveBeenCalledTimes(3);
  });

  it('should skip unchanged documents that are already in the database', async () => {
    // Setup database with existing documents
    const existingDocs = new Map([
      ['stdlib://javascript/array.md', {
        id: 1,
        type: 'stdlib',
        updatedAt: '2023-01-02T12:00:00Z'  // Newer than file's mtime
      }],
      ['stdlib://python/list.md', {
        id: 2,
        type: 'stdlib',
        updatedAt: '2022-12-01T12:00:00Z'  // Older than file's mtime
      }],
      ['spec://project1/api.md', {
        id: 3,
        type: 'spec',
        updatedAt: '2023-01-01T12:00:00Z'  // Same as file's mtime
      }]
    ]);
    
    vi.mocked(documentIndex.getAllDocumentsMetadata).mockResolvedValue(existingDocs);
    
    // Mock document listings
    vi.mocked(listDocuments).mockImplementation(async (type) => {
      if (type === 'stdlib') {
        return ['javascript/array.md', 'python/list.md'];
      } else {
        return ['project1/api.md'];
      }
    });

    // Mock document reading
    vi.mocked(readDocument).mockImplementation(async (type, path) => {
      return {
        type,
        path,
        content: `# Test content for ${path}`,
        meta: { 
          title: `Test ${path}`, 
          tags: ['test'],
          updatedAt: new Date('2023-01-01T12:00:00Z').toISOString()
        }
      };
    });

    const result = await scanAndIndexDocuments();

    // First document should be skipped (DB newer), second updated (DB older), third skipped (same timestamp)
    expect(result.indexed).toBe(1);
    expect(result.skipped).toBe(2);
    expect(result.failed).toBe(0);
    
    // Only python/list.md should be updated (DB older than file)
    expect(documentIndex.addOrUpdateDocument).toHaveBeenCalledTimes(1);
    expect(readDocument).toHaveBeenCalledWith('stdlib', 'python/list.md');
  });

  it('should handle errors during document listing', async () => {
    // Setup empty database
    vi.mocked(documentIndex.getAllDocumentsMetadata).mockResolvedValue(new Map());
    
    // Mock document listings to fail for stdlib
    vi.mocked(listDocuments).mockImplementation(async (type) => {
      if (type === 'stdlib') {
        throw new Error('Listing failed');
      } else {
        return ['project1/api.md'];
      }
    });

    // Mock document reading
    vi.mocked(readDocument).mockImplementation(async (type, path) => {
      return {
        type,
        path,
        content: `# Test content for ${path}`,
        meta: { title: `Test ${path}`, tags: ['test'] }
      };
    });

    const result = await scanAndIndexDocuments();

    // Only spec documents should be indexed
    expect(result.indexed).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].message).toBe('Listing failed');
    
    // Verify spec document was still processed
    expect(documentIndex.addOrUpdateDocument).toHaveBeenCalledTimes(1);
  });

  it('should handle errors during document reading', async () => {
    // Setup empty database
    vi.mocked(documentIndex.getAllDocumentsMetadata).mockResolvedValue(new Map());
    
    // Mock document listings
    vi.mocked(listDocuments).mockImplementation(async () => {
      return ['doc1.md', 'doc2.md'];
    });

    // Mock document reading to fail for first document
    vi.mocked(readDocument).mockImplementation(async (type, path) => {
      if (path === 'doc1.md') {
        return null;
      } else {
        return {
          type,
          path,
          content: `# Test content for ${path}`,
          meta: { title: `Test ${path}`, tags: ['test'] }
        };
      }
    });

    const result = await scanAndIndexDocuments();

    // Only one document should be indexed
    expect(result.indexed).toBe(2);
    expect(result.failed).toBe(2);
    expect(result.errors.length).toBe(2);
    
    // Verify only the second document was added to index
    expect(documentIndex.addOrUpdateDocument).toHaveBeenCalledTimes(2);
  });

  it('should handle errors during file stat retrieval', async () => {
    // Setup empty database
    vi.mocked(documentIndex.getAllDocumentsMetadata).mockResolvedValue(new Map());
    
    // Mock document listings
    vi.mocked(listDocuments).mockImplementation(async () => {
      return ['good.md', 'bad.md'];
    });

    // Mock fs.stat to fail for the second file
    mockStat.mockImplementation(async (filepath: string) => {
      if (filepath.includes('bad.md')) {
        throw new Error('Stat failed');
      }
      return {
        mtime: new Date('2023-01-01T12:00:00Z')
      } as any;
    });

    // Mock document reading
    vi.mocked(readDocument).mockImplementation(async (type, path) => {
      return {
        type,
        path,
        content: `# Test content for ${path}`,
        meta: { title: `Test ${path}`, tags: ['test'] }
      };
    });

    const result = await scanAndIndexDocuments();

    // One document should fail, one should succeed
    expect(result.indexed).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].message).toContain('Stat failed');
    
    // Verify only the good document was added to index
    expect(documentIndex.addOrUpdateDocument).toHaveBeenCalledTimes(1);
  });
});