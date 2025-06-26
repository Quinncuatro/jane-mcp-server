import { vi, describe, test, expect } from 'vitest';
import { parseFrontmatter, generateFrontmatter } from '../src/utils/frontmatter.js';
import { DocumentMeta } from '../src/types.js';

// Just test the frontmatter parsing and generation directly
describe('Frontmatter Helper Functions', () => {
  describe('parseFrontmatter', () => {
    test('should parse frontmatter and content correctly', () => {
      const markdown = `---
title: Test Document
description: This is a test document
author: Test Author
tags:
  - test
  - document
createdAt: 2023-01-01T12:00:00Z
updatedAt: 2023-01-02T12:00:00Z
---

# Content

This is the document content.`;

      const result = parseFrontmatter(markdown);
      
      // Check that metadata is correctly parsed
      expect(result.meta).toMatchObject({
        title: 'Test Document',
        description: 'This is a test document',
        author: 'Test Author',
        tags: ['test', 'document']
      });
      
      // Check that dates were parsed
      expect(result.meta.createdAt).toBeDefined();
      expect(result.meta.updatedAt).toBeDefined();
      
      // Check that content is correctly extracted
      expect(result.content).toBe('\n# Content\n\nThis is the document content.');
    });

    test('should provide default title if missing', () => {
      const markdown = `---
description: No title here
---

Content`;

      const result = parseFrontmatter(markdown);
      
      expect(result.meta.title).toBe('Untitled Document');
      expect(result.meta.description).toBe('No title here');
    });
  });

  describe('generateFrontmatter', () => {
    test('should combine meta and content correctly', () => {
      const meta: DocumentMeta = {
        title: 'Generated Document',
        description: 'This is a generated document',
        tags: ['generated', 'test']
      };
      
      const content = '# Content\n\nThis is the content.';
      
      const result = generateFrontmatter(meta, content);
      
      // Check that the result contains metadata and content
      expect(result).toContain('title: Generated Document');
      expect(result).toContain('description: This is a generated document');
      expect(result).toContain('tags:');
      expect(result).toContain('- generated');
      expect(result).toContain('- test');
      expect(result).toContain('# Content');
      expect(result).toContain('This is the content.');
    });

    test('should set createdAt and updatedAt dates', () => {
      const meta: DocumentMeta = {
        title: 'Document'
      };
      
      const content = 'Content';
      
      const result = generateFrontmatter(meta, content);
      
      expect(result).toContain('createdAt:');
      expect(result).toContain('updatedAt:');
    });
  });
});