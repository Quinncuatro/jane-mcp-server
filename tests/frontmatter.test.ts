import { describe, test, expect } from 'vitest';
import { parseFrontmatter, generateFrontmatter } from '../src/utils/frontmatter.js';
import { DocumentMeta } from '../src/types.js';

describe('Frontmatter Utilities', () => {
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
      
      // Converting dates to proper format, since they might be parsed as Date objects
      expect(result.meta).toMatchObject({
        title: 'Test Document',
        description: 'This is a test document',
        author: 'Test Author',
        tags: ['test', 'document']
      });
      
      // Check that dates were parsed (exact format might vary)
      expect(result.meta.createdAt).toBeDefined();
      expect(result.meta.updatedAt).toBeDefined();
      
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

    test('should handle markdown without frontmatter', () => {
      const markdown = '# Just content\n\nNo frontmatter here.';
      
      const result = parseFrontmatter(markdown);
      
      expect(result.meta.title).toBe('Untitled Document');
      expect(result.content).toBe('# Just content\n\nNo frontmatter here.');
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
      
      // Check that result contains the metadata
      expect(result).toContain('title: Generated Document');
      expect(result).toContain('description: This is a generated document');
      expect(result).toContain('tags:');
      expect(result).toContain('- generated');
      expect(result).toContain('- test');
      
      // Check that it includes updated dates
      expect(result).toContain('updatedAt:');
      expect(result).toContain('createdAt:');
      
      // Check that the content is included
      expect(result).toContain('# Content\n\nThis is the content.');
    });

    test('should keep existing createdAt date if provided', () => {
      const meta: DocumentMeta = {
        title: 'Document',
        createdAt: '2023-01-01T00:00:00Z'
      };
      
      const content = 'Content';
      
      const result = generateFrontmatter(meta, content);
      
      expect(result).toMatch(/createdAt: ['"]?2023-01-01T00:00:00Z['"]?/);
      expect(result).toContain('updatedAt:'); // Should have a new updated date
    });
  });
});