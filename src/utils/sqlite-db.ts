import Database, { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Use import.meta.url to get the current file's path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DatabaseManager class for handling SQLite database connections and operations
 * Manages connection lifecycle, schema application, and provides access to the database instance
 */
class DatabaseManager {
  private db: DatabaseType | null = null;
  private dbPath: string;
  private schemaPath: string;

  /**
   * Create a new DatabaseManager instance
   * @param {string} dbPath - Path to the SQLite database file
   * @param {string} schemaPath - Path to the schema SQL file
   */
  constructor(dbPath?: string, schemaPath?: string) {
    // Default database path is in the project root
    this.dbPath = dbPath || path.join(process.cwd(), 'jane-documents.db');
    
    // Default schema path is in the migrations directory
    this.schemaPath = schemaPath || path.join(__dirname, 'migrations', 'schema.sql');
  }

  /**
   * Initialize the database connection
   * Creates the database file if it doesn't exist and applies the schema
   * @returns {Promise<DatabaseType>} - The database instance
   */
  async initialize(): Promise<DatabaseType> {
    try {
      // Ensure the directory exists
      const dbDir = path.dirname(this.dbPath);
      await fs.ensureDir(dbDir);

      // Create database connection
      this.db = new Database(this.dbPath);
      
      // Configure pragmas for performance
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('foreign_keys = ON');
      
      // Apply schema
      await this.applySchema();
      
      return this.db;
    } catch (error) {
      console.error(`Database initialization error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Apply the database schema from the SQL file
   * @returns {Promise<void>}
   */
  async applySchema(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Read the schema SQL file
      const schemaSql = await fs.readFile(this.schemaPath, 'utf8');
      
      // Execute the schema SQL statements
      this.db.exec(schemaSql);
    } catch (error) {
      console.error(`Error applying database schema: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get the database instance
   * @returns {DatabaseType} - The database instance
   * @throws {Error} If database is not initialized
   */
  getDatabase(): DatabaseType {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Check if the database is initialized
   * @returns {boolean} - True if database is initialized
   */
  isInitialized(): boolean {
    return this.db !== null;
  }

  /**
   * Close the database connection
   * @returns {Promise<void>}
   */
  async close(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
      } catch (error) {
        console.error(`Error closing database: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    }
  }
}

// Export singleton instance
const dbManager = new DatabaseManager();
export default dbManager;