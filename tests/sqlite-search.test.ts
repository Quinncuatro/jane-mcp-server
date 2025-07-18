import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import { Document, DocumentType, SearchResult } from '../src/types.js';

// Import the SQLiteDocumentIndex class that doesn't exist yet
// This import will fail until the implementation is created
import { SQLiteDocumentIndex } from '../src/utils/sqlite-search.js';

// Create a temporary database file for testing
const TEST_DB_PATH = path.join(process.cwd(), 'test-document-index.db');

// Test document fixtures
const testDocuments: Document[] = [
  {
    path: 'javascript/array-methods.md',
    type: 'stdlib',
    content: '# JavaScript Array Methods\n\n## map()\nThe map() method creates a new array populated with the results of calling a provided function on every element in the calling array.\n\n## filter()\nThe filter() method creates a new array with all elements that pass the test implemented by the provided function.',
    meta: {
      title: 'JavaScript Array Methods',
      description: 'Reference for JavaScript array methods',
      tags: ['array', 'methods', 'javascript'],
      createdAt: new Date('2023-01-01').toISOString(),
      updatedAt: new Date('2023-01-10').toISOString()
    }
  },
  {
    path: 'typescript/interfaces.md',
    type: 'stdlib',
    content: '# TypeScript Interfaces\n\nInterfaces define the shape of an object. They can be used to define the structure of objects, define function types, or to enforce a class to implement certain properties and methods.',
    meta: {
      title: 'TypeScript Interfaces',
      description: 'Guide to TypeScript interfaces',
      tags: ['typescript', 'interfaces'],
      createdAt: new Date('2023-02-01').toISOString(),
      updatedAt: new Date('2023-02-10').toISOString()
    }
  },
  {
    path: 'python/list-methods.md',
    type: 'stdlib',
    content: '# Python List Methods\n\n## append()\nAdds an element to the end of the list.\n\n## extend()\nExtends the list by appending all the items from the iterable.',
    meta: {
      title: 'Python List Methods',
      description: 'Reference for Python list methods',
      tags: ['python', 'list', 'methods'],
      createdAt: new Date('2023-03-01').toISOString(),
      updatedAt: new Date('2023-03-10').toISOString()
    }
  },
  {
    path: 'project1/api.md',
    type: 'spec',
    content: '# API Specification\n\n## Endpoints\n\n### GET /users\nReturns a list of all users in the system.\n\n### POST /users\nCreate a new user.',
    meta: {
      title: 'API Specification',
      description: 'Project 1 API documentation',
      tags: ['api', 'endpoints', 'documentation'],
      createdAt: new Date('2023-04-01').toISOString(),
      updatedAt: new Date('2023-04-10').toISOString()
    }
  },
  {
    path: 'project2/architecture.md',
    type: 'spec',
    content: '# System Architecture\n\n## Components\n\n### Database\nThe system uses SQLite for persistent storage.\n\n### API Server\nA Node.js Express server that handles API requests.',
    meta: {
      title: 'System Architecture',
      description: 'Project 2 system architecture overview',
      tags: ['architecture', 'components'],
      createdAt: new Date('2023-05-01').toISOString(),
      updatedAt: new Date('2023-05-10').toISOString()
    }
  }
];

describe('SQLiteDocumentIndex', () => {
  let index: SQLiteDocumentIndex;

  // Set up before each test
  beforeEach(async () => {
    // Create a new instance with the test database path
    index = new SQLiteDocumentIndex({ dbPath: TEST_DB_PATH });
    
    // Initialize the index (creates tables, etc.)
    await index.initialize();

    // Add test documents
    for (const doc of testDocuments) {
      await index.addOrUpdateDocument(doc);
    }
  });

  // Clean up after each test
  afterEach(async () => {
    // Close the database connection
    await index.close();

    // Remove the test database file
    if (fs.existsSync(TEST_DB_PATH)) {
      await fs.unlink(TEST_DB_PATH);
    }
  });

  describe('Initialization', () => {
    test('should create a new database file if it does not exist', async () => {
      // Delete the database file if it exists
      if (fs.existsSync(TEST_DB_PATH)) {
        await fs.unlink(TEST_DB_PATH);
      }

      // Create a new index
      const newIndex = new SQLiteDocumentIndex({ dbPath: TEST_DB_PATH });
      await newIndex.initialize();

      // Check if the database file was created
      expect(fs.existsSync(TEST_DB_PATH)).toBe(true);

      // Clean up
      await newIndex.close();
    });

    test('should use existing database if it exists', async () => {
      // Create a new index that should use the existing database
      const newIndex = new SQLiteDocumentIndex({ dbPath: TEST_DB_PATH });
      await newIndex.initialize();

      // Search should return existing documents
      const results = await newIndex.search('*');
      expect(results.length).toBe(5);

      // Clean up
      await newIndex.close();
    });
  });

  describe('Document Management', () => {
    test('should add a new document to the index', async () => {
      const newDoc: Document = {
        path: 'go/slices.md',
        type: 'stdlib',
        content: '# Go Slices\n\nSlices are a key data type in Go, giving a more powerful interface to sequences than arrays.',
        meta: {
          title: 'Go Slices',
          description: 'Guide to Go slices',
          tags: ['go', 'slices'],
          createdAt: new Date('2023-06-01').toISOString(),
          updatedAt: new Date('2023-06-10').toISOString()
        }
      };

      // Add the new document
      await index.addOrUpdateDocument(newDoc);

      // Search for the new document
      const results = await index.search('go slices');
      
      // Check if the document was added
      expect(results.length).toBe(1);
      expect(results[0].document.path).toBe('go/slices.md');
    });

    test('should update an existing document', async () => {
      // Get the document to update
      const docToUpdate = { ...testDocuments[0] };
      
      // Modify the content and metadata
      docToUpdate.content = '# Updated JavaScript Array Methods\n\nThis content has been updated.';
      docToUpdate.meta.title = 'Updated JavaScript Array Methods';
      docToUpdate.meta.updatedAt = new Date().toISOString();

      // Update the document
      await index.addOrUpdateDocument(docToUpdate);

      // Search for the updated document
      const results = await index.search('Updated JavaScript', { includeContent: true });
      
      // Check if the document was updated
      expect(results.length).toBe(1);
      expect(results[0].document.meta.title).toBe('Updated JavaScript Array Methods');
      expect(results[0].document.content).toContain('This content has been updated');
    });

    test('should remove a document from the index', async () => {
      // Remove a document
      await index.removeDocument('stdlib', 'javascript/array-methods.md');

      // Search for all documents
      const results = await index.search('*');
      
      // Check if the document was removed
      expect(results.length).toBe(4);
      expect(results.some(r => r.document.path === 'javascript/array-methods.md')).toBe(false);
    });
  });

  describe('Search Functionality', () => {
    test('should return all documents for wildcard search', async () => {
      const results = await index.search('*');
      
      // Check if all documents are returned
      expect(results.length).toBe(5);
    });

    test('should return empty string for content when includeContent is false', async () => {
      const results = await index.search('*', { includeContent: false });
      
      // Check if content is empty
      expect(results[0].document.content).toBe('');
    });

    test('should return content when includeContent is true', async () => {
      const results = await index.search('*', { includeContent: true });
      
      // Check if content is included
      expect(results[0].document.content).not.toBe('');
    });

    test('should filter by document type', async () => {
      const results = await index.search('*', { type: 'stdlib' });
      
      // Check if only stdlib documents are returned
      expect(results.length).toBe(3);
      expect(results.every(r => r.document.type === 'stdlib')).toBe(true);
    });

    test('should filter by language for stdlib documents', async () => {
      const results = await index.search('*', { language: 'javascript' });
      
      // Check if only javascript documents are returned
      expect(results.length).toBe(1);
      expect(results[0].document.path.startsWith('javascript/')).toBe(true);
    });

    test('should filter by project for spec documents', async () => {
      const results = await index.search('*', { project: 'project1' });
      
      // Check if only project1 documents are returned
      expect(results.length).toBe(1);
      expect(results[0].document.path.startsWith('project1/')).toBe(true);
    });

    test('should search for terms in document content', async () => {
      const results = await index.search('map filter', { includeContent: true });
      
      // Check if documents containing both 'map' and 'filter' are returned
      expect(results.length).toBe(1);
      expect(results[0].document.path).toBe('javascript/array-methods.md');
    });

    test('should search for terms in document metadata', async () => {
      const results = await index.search('api documentation');
      
      // Check if documents with 'api' and 'documentation' in metadata are returned
      expect(results.length).toBe(1);
      expect(results[0].document.path).toBe('project1/api.md');
    });

    test('should include match context when includeContent is true', async () => {
      const results = await index.search('SQLite', { includeContent: true });
      
      // Check if matches are included
      expect(results.length).toBe(1);
      expect(results[0].matches).toBeDefined();
      expect(results[0].matches?.[0]).toContain('SQLite');
    });

    test('should apply multiple filters simultaneously', async () => {
      const results = await index.search('methods', { 
        type: 'stdlib',
        language: 'python',
        includeContent: true
      });
      
      // Check if filtered results are returned
      expect(results.length).toBe(1);
      expect(results[0].document.type).toBe('stdlib');
      expect(results[0].document.path.startsWith('python/')).toBe(true);
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle empty database gracefully', async () => {
      // Close the current connection and delete the database
      await index.close();
      if (fs.existsSync(TEST_DB_PATH)) {
        await fs.unlink(TEST_DB_PATH);
      }

      // Create a new empty index
      const emptyIndex = new SQLiteDocumentIndex({ dbPath: TEST_DB_PATH });
      await emptyIndex.initialize();

      // Search in empty database
      const results = await emptyIndex.search('*');
      
      // Check if empty results are returned
      expect(results.length).toBe(0);

      // Clean up
      await emptyIndex.close();
    });

    test('should handle special characters in search queries', async () => {
      // Search with special characters
      const results = await index.search('API & Endpoints');
      
      // The search should work without throwing errors
      expect(results).toBeDefined();
    });

    test('should handle large number of documents', async () => {
      // Add 100 more documents to test performance with larger dataset
      for (let i = 0; i < 100; i++) {
        const newDoc: Document = {
          path: `test/doc${i}.md`,
          type: i % 2 === 0 ? 'stdlib' : 'spec',
          content: `# Test Document ${i}\n\nThis is test document ${i}.`,
          meta: {
            title: `Test Document ${i}`,
            description: `Description for test document ${i}`,
            tags: ['test'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };

        await index.addOrUpdateDocument(newDoc);
      }

      // Search in the larger dataset
      const startTime = Date.now();
      const results = await index.search('Test Document 50');
      const endTime = Date.now();

      // The search should return results and complete in a reasonable time
      expect(results.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should take less than 1 second
    });
  });
});