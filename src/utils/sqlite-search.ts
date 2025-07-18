import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { Document, DocumentType, SearchResult } from '../types.js';
import { fileURLToPath } from 'url';
import logger from './logger.js';

// Get the directory name of the current module for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Options for the SQLite Document Index
 */
interface SQLiteDocumentIndexOptions {
  dbPath?: string;
}

/**
 * SQLite-based document index implementation
 * This provides a persistent storage layer for document indexing and searching
 */
export class SQLiteDocumentIndex {
  private db: Database.Database | null = null;
  private initialized = false;
  private dbPath: string;

  /**
   * Create a new SQLite document index
   */
  constructor(options?: SQLiteDocumentIndexOptions) {
    this.dbPath = options?.dbPath || path.join(__dirname, '../../document-index.db');
    logger.info(`Using SQLite database at: ${this.dbPath}`);
  }

  /**
   * Initialize the database, creating tables if they don't exist
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.info(`Initializing SQLite document index at: ${this.dbPath}`);

      // Create parent directory if it doesn't exist
      const dbDir = path.dirname(this.dbPath);
      await fs.ensureDir(dbDir);

      // Open database connection
      this.db = new Database(this.dbPath);

      // Enable foreign key constraints
      this.db.pragma('foreign_keys = ON');
      
      // Enable WAL journal mode for better concurrent performance
      this.db.pragma('journal_mode = WAL');

      // Enable FTS5 tokenization
      this.db.function('highlight', (text: string, query: string): string => {
        if (!text || !query) return text || '';
        
        const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        if (terms.length === 0) return text;
        
        // Simple highlighting implementation
        let result = text;
        terms.forEach(term => {
          // Case insensitive replace with highlighting markers
          const regex = new RegExp(`(${term})`, 'gi');
          result = result.replace(regex, '**$1**');
        });
        
        return result;
      });

      // Create document table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          path TEXT NOT NULL,
          content TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          author TEXT,
          created_at TEXT,
          updated_at TEXT,
          meta_json TEXT,
          UNIQUE (type, path)
        );
      `);

      // Create tags table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS document_tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          document_id INTEGER NOT NULL,
          tag TEXT NOT NULL,
          UNIQUE (document_id, tag),
          FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
        );
      `);

      // Drop FTS table if it exists to recreate it with proper schema
      this.db.exec(`DROP TABLE IF EXISTS documents_fts;`);
      
      // Create FTS index
      this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
          content, 
          title, 
          description, 
          tags
        );
      `);
      
      // Rebuild the FTS index with existing documents
      this.db.exec(`
        INSERT INTO documents_fts (rowid, content, title, description, tags)
        SELECT 
          d.id, 
          d.content, 
          d.title, 
          IFNULL(d.description, ''), 
          (SELECT GROUP_CONCAT(tag, ' ') FROM document_tags WHERE document_id = d.id)
        FROM documents d;
      `);

      this.initialized = true;
      logger.info('SQLite document index initialized successfully');
    } catch (error) {
      logger.error(`Error initializing SQLite document index: ${error instanceof Error ? error.message : String(error)}`);
      // Even in case of error, mark as initialized to prevent repeated failures
      this.initialized = true;
      throw error; // Rethrow to ensure tests fail properly
    }
  }

  /**
   * Add or update a document in the index
   */
  async addOrUpdateDocument(doc: Document): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Begin transaction
      this.db.exec('BEGIN TRANSACTION');

      // Prepare document data
      const { path: docPath, type, content, meta } = doc;
      const metaJSON = JSON.stringify(meta);
      const tagsStr = meta.tags?.join(' ') || '';

      // Check if document already exists
      const existingDoc = this.db.prepare('SELECT id FROM documents WHERE type = ? AND path = ?')
        .get(type, docPath) as { id: number } | undefined;

      let documentId: number;

      if (existingDoc) {
        // Update existing document
        documentId = existingDoc.id;
        logger.debug(`Updating document in SQLite index: ${type}://${docPath}`);
        
        const updateStmt = this.db.prepare(`
          UPDATE documents
          SET
            content = ?,
            title = ?,
            description = ?,
            author = ?,
            created_at = ?,
            updated_at = ?,
            meta_json = ?
          WHERE id = ?
        `);
        
        updateStmt.run(
          content,
          meta.title,
          meta.description || null,
          meta.author || null,
          meta.createdAt ? String(meta.createdAt) : null,
          meta.updatedAt ? String(meta.updatedAt) : null,
          metaJSON,
          documentId
        );

        // Delete existing tags
        this.db.prepare('DELETE FROM document_tags WHERE document_id = ?').run(documentId);

        // Delete existing FTS entry
        this.db.prepare('DELETE FROM documents_fts WHERE rowid = ?').run(documentId);
      } else {
        // Insert new document
        logger.debug(`Adding new document to SQLite index: ${type}://${docPath}`);
        
        const insertStmt = this.db.prepare(`
          INSERT INTO documents (
            type, path, content, title, description, author, created_at, updated_at, meta_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = insertStmt.run(
          type,
          docPath,
          content,
          meta.title,
          meta.description || null,
          meta.author || null,
          meta.createdAt ? String(meta.createdAt) : null,
          meta.updatedAt ? String(meta.updatedAt) : null,
          metaJSON
        );

        documentId = result.lastInsertRowid as number;
      }

      // Insert tags
      if (meta.tags && meta.tags.length > 0) {
        const insertTagStmt = this.db.prepare('INSERT INTO document_tags (document_id, tag) VALUES (?, ?)');
        for (const tag of meta.tags) {
          insertTagStmt.run(documentId, tag);
        }
      }

      // Insert into FTS index
      const insertFtsStmt = this.db.prepare(`
        INSERT INTO documents_fts (
          rowid, content, title, description, tags
        ) VALUES (?, ?, ?, ?, ?)
      `);
      
      insertFtsStmt.run(
        documentId,
        content,
        meta.title,
        meta.description || '',
        tagsStr
      );

      // Commit transaction
      this.db.exec('COMMIT');
      logger.debug(`Document index operation completed for: ${type}://${docPath}`);
    } catch (error) {
      // Rollback transaction on error
      if (this.db) {
        this.db.exec('ROLLBACK');
      }
      logger.error(`Error adding/updating document in SQLite index: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Remove a document from the index
   */
  async removeDocument(type: DocumentType, path: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Begin transaction
      this.db.exec('BEGIN TRANSACTION');
      
      // First, find the document ID
      const docIdResult = this.db.prepare('SELECT id FROM documents WHERE type = ? AND path = ?')
        .get(type, path) as { id: number } | undefined;
      
      if (docIdResult) {
        const docId = docIdResult.id;
        
        // Delete from FTS index first
        this.db.prepare('DELETE FROM documents_fts WHERE rowid = ?').run(docId);
        
        // Delete tags
        this.db.prepare('DELETE FROM document_tags WHERE document_id = ?').run(docId);
        
        // Delete the document
        const deleteStmt = this.db.prepare('DELETE FROM documents WHERE id = ?');
        deleteStmt.run(docId);
        
        logger.debug(`Removed document from SQLite index: ${type}://${path}`);
      } else {
        logger.debug(`Document not found in SQLite index: ${type}://${path}`);
      }
      
      // Commit transaction
      this.db.exec('COMMIT');
    } catch (error) {
      // Rollback transaction on error
      if (this.db) {
        this.db.exec('ROLLBACK');
      }
      logger.error(`Error removing document from SQLite index: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Search for documents matching the query
   */
  async search(
    query: string,
    options: {
      type?: DocumentType;
      language?: string;
      project?: string;
      includeContent?: boolean;
    } = {}
  ): Promise<SearchResult[]> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const { type, language, project, includeContent = false } = options;
    logger.debug(`Search query: "${query}" (Options: ${JSON.stringify(options)})`);

    try {
      // Handle wildcard searches
      if (query === '*' || query === '') {
        logger.debug('Processing wildcard search - returning all documents that match filters');
        
        let sql = `
          SELECT 
            d.id, d.type, d.path, ${includeContent ? 'd.content' : "''"} as content,
            d.title, d.description, d.author, d.created_at, d.updated_at, d.meta_json,
            (SELECT GROUP_CONCAT(tag) FROM document_tags WHERE document_id = d.id) as tags
          FROM documents d
        `;

        const whereConditions: string[] = [];
        const params: any[] = [];

        // Apply type filter
        if (type) {
          whereConditions.push('d.type = ?');
          params.push(type);
        }

        // Apply language filter for stdlib documents
        if (language) {
          whereConditions.push("(d.type = 'stdlib' AND d.path LIKE ?)");
          params.push(`${language}/%`);
        }

        // Apply project filter for spec documents
        if (project) {
          whereConditions.push("(d.type = 'spec' AND d.path LIKE ?)");
          params.push(`${project}/%`);
        }

        // Add WHERE clause if we have conditions
        if (whereConditions.length > 0) {
          sql += ' WHERE ' + whereConditions.join(' AND ');
        }

        // Order by title
        sql += ' ORDER BY d.title';

        // Execute query
        const rows = this.db.prepare(sql).all(...params) as any[];
        const results = this.rowsToSearchResults(rows, true);
        
        // Filter out content if not requested
        if (!includeContent) {
          results.forEach(result => {
            result.document.content = '';
          });
        }
        
        return results;
      }

      // Regular search
      const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      
      // For empty search (shouldn't happen due to check above, but just in case)
      if (searchTerms.length === 0) {
        return this.search('*', options);
      }

      // Simpler search approach: query documents directly
      let sql = `
        SELECT 
          d.id, d.type, d.path, d.content,
          d.title, d.description, d.author, d.created_at, d.updated_at, d.meta_json,
          (SELECT GROUP_CONCAT(tag) FROM document_tags WHERE document_id = d.id) as tags
        FROM documents d
        WHERE 1=1
      `;
      
      const whereConditions: string[] = [];
      const params: any[] = [];
      
      // Build content search conditions
      const contentConditions = searchTerms.map(() => {
        return "(d.content LIKE ? OR d.title LIKE ? OR d.description LIKE ? OR EXISTS (SELECT 1 FROM document_tags dt WHERE dt.document_id = d.id AND dt.tag LIKE ?))";
      });
      
      if (contentConditions.length > 0) {
        whereConditions.push(contentConditions.join(' AND '));
        searchTerms.forEach(term => {
          const likePattern = `%${term}%`;
          params.push(likePattern, likePattern, likePattern, likePattern);
        });
      }
      
      // Apply type filter
      if (type) {
        whereConditions.push('d.type = ?');
        params.push(type);
      }

      // Apply language filter for stdlib documents
      if (language) {
        whereConditions.push("(d.type = 'stdlib' AND d.path LIKE ?)");
        params.push(`${language}/%`);
      }

      // Apply project filter for spec documents
      if (project) {
        whereConditions.push("(d.type = 'spec' AND d.path LIKE ?)");
        params.push(`${project}/%`);
      }

      // Add WHERE clause
      if (whereConditions.length > 0) {
        sql += ' AND ' + whereConditions.join(' AND ');
      }
      
      // Order by most matches in content and title
      sql += ' ORDER BY d.title';
      
      logger.debug(`Using simple SQL search: ${sql}`);
      
      // Execute query
      const rows = this.db.prepare(sql).all(...params) as any[];
      
      // Create a map for highlight matches
      const matchesById = new Map();
      
      // If content is included, find matching lines for context
      if (includeContent) {
        rows.forEach(row => {
          const matchInfo: any = { rowid: row.id };
          
          // Find matches in content
          if (row.content) {
            const lines = row.content.split('\n');
            let matchedLine = '';
            
            // Find first line containing any search term
            for (const line of lines) {
              const lowerLine = line.toLowerCase();
              if (searchTerms.some(term => lowerLine.includes(term.toLowerCase()))) {
                matchedLine = line;
                break;
              }
            }
            
            if (matchedLine) {
              // Highlight the terms in the matched line
              let highlightedLine = matchedLine;
              searchTerms.forEach(term => {
                const regex = new RegExp(`(${term})`, 'gi');
                highlightedLine = highlightedLine.replace(regex, '**$1**');
              });
              matchInfo.content_match = highlightedLine;
            }
          }
          
          // Find matches in title
          if (row.title) {
            const lowerTitle = row.title.toLowerCase();
            if (searchTerms.some(term => lowerTitle.includes(term.toLowerCase()))) {
              let highlightedTitle = row.title;
              searchTerms.forEach(term => {
                const regex = new RegExp(`(${term})`, 'gi');
                highlightedTitle = highlightedTitle.replace(regex, '**$1**');
              });
              matchInfo.title_match = highlightedTitle;
            }
          }
          
          // Find matches in description
          if (row.description) {
            const lowerDesc = row.description.toLowerCase();
            if (searchTerms.some(term => lowerDesc.includes(term.toLowerCase()))) {
              let highlightedDesc = row.description;
              searchTerms.forEach(term => {
                const regex = new RegExp(`(${term})`, 'gi');
                highlightedDesc = highlightedDesc.replace(regex, '**$1**');
              });
              matchInfo.desc_match = highlightedDesc;
            }
          }
          
          matchesById.set(row.id, matchInfo);
        });
      }
      
      // Process results to extract match context
      const results = this.rowsToSearchResults(rows, true, searchTerms, matchesById);
      
      // Filter out content if not requested
      if (!includeContent) {
        results.forEach(result => {
          result.document.content = '';
        });
      }
      
      logger.debug(`Search found ${results.length} matching documents`);
      
      return results;
    } catch (error) {
      logger.error(`Error searching in SQLite index: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Convert database rows to SearchResult objects
   */
  private rowsToSearchResults(
    rows: any[],
    includeContent: boolean,
    searchTerms: string[] = [],
    matchesById: Map<number, any> = new Map()
  ): SearchResult[] {
    return rows.map(row => {
      // Parse metadata
      let meta: any;
      try {
        meta = JSON.parse(row.meta_json || '{}');
      } catch (e) {
        // Fallback to constructing metadata from individual fields
        meta = {
          title: row.title,
          description: row.description,
          author: row.author,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }

      // Add tags if they exist
      if (row.tags) {
        meta.tags = row.tags.split(',');
      }

      const document: Document = {
        path: row.path,
        type: row.type as DocumentType,
        content: includeContent ? row.content : '',
        meta
      };

      const result: SearchResult = { document };

      // Extract matching context if content is included and we have search terms
      if (includeContent && searchTerms.length > 0 && row.content) {
        const matches: string[] = [];
        
        // Use match highlights from FTS if available
        const matchInfo = matchesById.get(row.id);
        if (matchInfo) {
          if (matchInfo.content_match) {
            const lines = matchInfo.content_match.split('\n');
            for (const line of lines) {
              if (line.includes('**')) {
                matches.push(line.trim());
                break;
              }
            }
          }
          
          if (matchInfo.title_match && matchInfo.title_match.includes('**')) {
            matches.push(`Title: ${matchInfo.title_match}`);
          }
          
          if (matchInfo.desc_match && matchInfo.desc_match.includes('**')) {
            matches.push(`Description: ${matchInfo.desc_match}`);
          }
        }
        
        // If we don't have matches from FTS, do a simple line-based search
        if (matches.length === 0) {
          const lines = row.content.split('\n');
          for (const term of searchTerms) {
            for (const line of lines) {
              if (line.toLowerCase().includes(term.toLowerCase())) {
                // Add highlighted version of the matching line
                if (this.db) {
                  const highlightedLine = this.db.prepare('SELECT highlight(?, ?) as result')
                    .get(line.trim(), term) as { result: string };
                  if (highlightedLine) {
                    matches.push(highlightedLine.result);
                    break;
                  }
                } else {
                  matches.push(line.trim());
                  break;
                }
              }
            }
          }
        }
        
        if (matches.length > 0) {
          result.matches = matches;
        }
      }
      
      // Add score if available
      if (row.rank !== undefined) {
        result.score = row.rank;
      }

      return result;
    });
  }

  /**
   * Get document metadata from the database
   * Used to check if a document exists and get its update timestamp
   * @param type The document type (stdlib or spec)
   * @param path The document path
   * @returns Document metadata or null if not found
   */
  async getDocumentMetadata(type: DocumentType, path: string): Promise<{
    id: number;
    updatedAt: string | null;
  } | null> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Query for document metadata
      const result = this.db.prepare(
        'SELECT id, updated_at FROM documents WHERE type = ? AND path = ?'
      ).get(type, path) as { id: number; updated_at: string | null } | undefined;
      
      if (result) {
        return {
          id: result.id,
          updatedAt: result.updated_at
        };
      }
      return null;
    } catch (error) {
      logger.error(`Error getting document metadata: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Get all documents in the database as a map
   * @returns Map of document paths to metadata
   */
  async getAllDocumentsMetadata(): Promise<Map<string, {
    id: number;
    type: DocumentType;
    updatedAt: string | null;
  }>> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const documentsMap = new Map<string, {
      id: number;
      type: DocumentType;
      updatedAt: string | null;
    }>();

    try {
      // Query for all documents metadata
      const results = this.db.prepare(
        'SELECT id, type, path, updated_at FROM documents'
      ).all() as { id: number; type: DocumentType; path: string; updated_at: string | null }[];
      
      for (const doc of results) {
        // Use type+path as key for efficient lookups
        const key = `${doc.type}://${doc.path}`;
        documentsMap.set(key, {
          id: doc.id,
          type: doc.type,
          updatedAt: doc.updated_at
        });
      }
      
      return documentsMap;
    } catch (error) {
      logger.error(`Error getting all documents metadata: ${error instanceof Error ? error.message : String(error)}`);
      return new Map();
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
        this.initialized = false;
        logger.debug('SQLite document index closed');
      } catch (error) {
        logger.error(`Error closing SQLite document index: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}

// Singleton instance for the application
export const documentIndex = new SQLiteDocumentIndex();