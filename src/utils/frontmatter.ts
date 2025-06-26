import matter from 'gray-matter';
import { DocumentMeta } from '../types.js';

/**
 * Parse frontmatter and content from a markdown string
 * @param markdown The markdown string to parse
 * @returns Object containing parsed metadata and content
 */
export function parseFrontmatter(markdown: string): { meta: DocumentMeta; content: string } {
  const { data, content } = matter(markdown);
  
  // Ensure title is present
  const meta: DocumentMeta = {
    title: data.title || 'Untitled Document',
    ...data,
  };
  
  // Keep dates as strings if they're provided that way
  // (We don't want to convert them to Date objects automatically)
  
  return { meta, content };
}

/**
 * Generate markdown with frontmatter
 * @param meta Document metadata
 * @param content Document content
 * @returns Markdown string with frontmatter
 */
export function generateFrontmatter(meta: DocumentMeta, content: string): string {
  // Ensure updatedAt is set to current date
  const updatedMeta = {
    ...meta,
    updatedAt: new Date().toISOString()
  };
  
  // If createdAt isn't set, set it to the current date
  if (!updatedMeta.createdAt) {
    updatedMeta.createdAt = updatedMeta.updatedAt;
  }
  
  // Sanitize metadata by removing undefined values
  // to prevent YAML serialization errors
  const sanitizedMeta: DocumentMeta = {
    title: updatedMeta.title || 'Untitled Document'
  };
  
  Object.entries(updatedMeta).forEach(([key, value]) => {
    if (value !== undefined) {
      sanitizedMeta[key] = value;
    }
  });
  
  return matter.stringify(content, sanitizedMeta);
}