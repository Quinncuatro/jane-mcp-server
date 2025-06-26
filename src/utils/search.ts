import { Document, DocumentType, SearchResult } from '../types.js';
import { listDocuments, readDocument } from './filesystem.js';

/**
 * Simple in-memory document index 
 * This is a lightweight solution for the MVP; could be replaced with a proper search index later
 */
class DocumentIndex {
  private documents: Document[] = [];
  private initialized = false;
  
  /**
   * Load all documents into memory
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Load stdlib documents
    const stdlibPaths = await listDocuments('stdlib');
    for (const path of stdlibPaths) {
      const doc = await readDocument('stdlib', path);
      if (doc) this.documents.push(doc);
    }
    
    // Load spec documents
    const specPaths = await listDocuments('spec');
    for (const path of specPaths) {
      const doc = await readDocument('spec', path);
      if (doc) this.documents.push(doc);
    }
    
    this.initialized = true;
  }
  
  /**
   * Add or update a document in the index
   */
  addOrUpdateDocument(doc: Document): void {
    const index = this.documents.findIndex(
      d => d.path === doc.path && d.type === doc.type
    );
    
    if (index >= 0) {
      this.documents[index] = doc;
    } else {
      this.documents.push(doc);
    }
  }
  
  /**
   * Remove a document from the index
   */
  removeDocument(type: DocumentType, path: string): void {
    this.documents = this.documents.filter(
      d => !(d.type === type && d.path === path)
    );
  }
  
  /**
   * Search for documents matching the query
   */
  search(
    query: string,
    options: {
      type?: DocumentType;
      language?: string;
      project?: string;
      includeContent?: boolean;
    } = {}
  ): SearchResult[] {
    const { type, language, project, includeContent = false } = options;
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    return this.documents
      .filter(doc => {
        // Apply filters
        if (type && doc.type !== type) return false;
        
        if (language && doc.type === 'stdlib') {
          const parts = doc.path.split('/');
          if (parts[0] !== language) return false;
        }
        
        if (project && doc.type === 'spec') {
          const parts = doc.path.split('/');
          if (parts[0] !== project) return false;
        }
        
        // Check for query matches in content and metadata
        const textToSearch = [
          doc.meta.title,
          doc.meta.description || '',
          doc.content,
          ...(doc.meta.tags || []),
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => textToSearch.includes(term));
      })
      .map(doc => {
        const result: SearchResult = {
          document: {
            ...doc,
            // Optionally strip content if not needed
            content: includeContent ? doc.content : ''
          }
        };
        
        // Extract matching context
        if (includeContent) {
          const matches: string[] = [];
          const lines = doc.content.split('\n');
          
          for (const term of searchTerms) {
            for (const line of lines) {
              if (line.toLowerCase().includes(term)) {
                matches.push(line.trim());
                break;
              }
            }
          }
          
          if (matches.length > 0) {
            result.matches = matches;
          }
        }
        
        return result;
      })
      .sort((a, b) => {
        // Simple relevance scoring by title match
        const aHasTitle = searchTerms.some(term => 
          a.document.meta.title.toLowerCase().includes(term)
        );
        const bHasTitle = searchTerms.some(term => 
          b.document.meta.title.toLowerCase().includes(term)
        );
        
        if (aHasTitle && !bHasTitle) return -1;
        if (!aHasTitle && bHasTitle) return 1;
        
        // Fall back to alphabetical by title
        return a.document.meta.title.localeCompare(b.document.meta.title);
      });
  }
}

// Singleton instance for the application
export const documentIndex = new DocumentIndex();