/**
 * Document type indicating whether it's a stdlib or spec document
 */
export type DocumentType = 'stdlib' | 'spec';

/**
 * Document metadata from frontmatter
 */
export interface DocumentMeta {
  title: string;
  description?: string;
  author?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  tags?: string[];
  [key: string]: any;
}

/**
 * Complete document with content and metadata
 */
export interface Document {
  path: string;         // File path relative to the Jane directory
  type: DocumentType;   // stdlib or spec
  content: string;      // The markdown content
  meta: DocumentMeta;   // Extracted metadata from frontmatter
}

/**
 * Search result containing document info and match details
 */
export interface SearchResult {
  document: Document;
  matches?: string[];   // Optional excerpts showing matches
  score?: number;       // Optional relevance score
}