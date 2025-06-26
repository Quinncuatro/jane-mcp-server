import { Document, DocumentType, SearchResult } from '../types.js';
import { listDocuments, readDocument, listLanguages, listProjects } from './filesystem.js';

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
    
    console.error('Initializing document index...');
    this.documents = [];
    
    try {
      // Get list of languages first
      const languages = await listLanguages();
      console.error(`Found ${languages.length} languages: ${languages.join(', ')}`);
      
      // Load stdlib documents for each language
      for (const language of languages) {
        const langDocPaths = await listDocuments('stdlib', language);
        console.error(`Found ${langDocPaths.length} stdlib documents in ${language} to index`);
        
        for (const path of langDocPaths) {
          const doc = await readDocument('stdlib', path);
          if (doc) {
            this.documents.push(doc);
            console.error(`Indexed stdlib document: ${path}`);
          }
        }
      }
      
      // Get list of projects first
      const projects = await listProjects();
      console.error(`Found ${projects.length} projects: ${projects.join(', ')}`);
      
      // Load spec documents for each project
      for (const project of projects) {
        const projDocPaths = await listDocuments('spec', project);
        console.error(`Found ${projDocPaths.length} spec documents in ${project} to index`);
        
        for (const path of projDocPaths) {
          const doc = await readDocument('spec', path);
          if (doc) {
            this.documents.push(doc);
            console.error(`Indexed spec document: ${path}`);
          }
        }
      }
      
      console.error(`Document index initialized with ${this.documents.length} total documents`);
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing document index:', error);
      // Still mark as initialized to prevent repeated failures
      this.initialized = true;
    }
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
      console.error(`Updated document in index: ${doc.type}://${doc.path}`);
    } else {
      this.documents.push(doc);
      console.error(`Added new document to index: ${doc.type}://${doc.path}`);
    }
  }
  
  /**
   * Remove a document from the index
   */
  removeDocument(type: DocumentType, path: string): void {
    const initialCount = this.documents.length;
    this.documents = this.documents.filter(
      d => !(d.type === type && d.path === path)
    );
    
    if (initialCount !== this.documents.length) {
      console.error(`Removed document from index: ${type}://${path}`);
    }
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
    
    // Log search parameters
    console.error(`Search query: "${query}" (Options: ${JSON.stringify(options)})`);
    console.error(`Available documents: ${this.documents.length}`);
    
    // Handle wildcard searches
    if (query === '*' || query === '') {
      console.error('Processing wildcard search - returning all documents that match filters');
      
      // For wildcard, just apply filters without content matching
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
          
          return true;
        })
        .map(doc => ({
          document: {
            ...doc,
            content: includeContent ? doc.content : ''
          }
        }))
        .sort((a, b) => a.document.meta.title.localeCompare(b.document.meta.title));
    }
    
    // Regular search
    const searchTerms = query.toLowerCase().split(/\s+/);
    console.error(`Search terms: ${searchTerms.join(', ')}`);
    
    const results = this.documents
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
    
    console.error(`Search found ${results.length} matching documents`);
    return results;
  }
}

// Singleton instance for the application
export const documentIndex = new DocumentIndex();