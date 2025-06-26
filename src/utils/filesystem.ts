import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { Document, DocumentType, DocumentMeta } from '../types.js';
import { parseFrontmatter, generateFrontmatter } from './frontmatter.js';
import { fileURLToPath } from 'url';
import logger from './logger.js';

// Get the directory name of the current module for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Find the Jane directory with robust path resolution
 * Tries multiple potential locations and supports environment variable override
 * @returns The resolved path to the Jane directory
 */
export function findJaneDirectory(): string {
  // Try environment variable if set (highest priority)
  if (process.env.JANE_DIR) {
    logger.info(`Using JANE_DIR from environment: ${process.env.JANE_DIR}`);
    return process.env.JANE_DIR;
  }

  // Potential base directories in order of preference
  const potentialBases = [
    process.cwd(),                      // Current working directory
    path.resolve(__dirname, '../../'),  // Two levels up from utils (project root)
    path.resolve(process.cwd(), '../'), // Parent of current directory
  ];

  // Try each base directory
  for (const base of potentialBases) {
    const janePath = path.resolve(base, 'Jane');
    logger.debug(`Checking for Jane directory at: ${janePath}`);
    
    try {
      // Check if directory exists
      if (fs.existsSync(janePath)) {
        logger.success(`Found existing Jane directory at: ${janePath}`);
        return janePath;
      }
    } catch (error) {
      logger.warning(`Error checking path ${janePath}: ${error instanceof Error ? error.message : String(error)}`);
      // Continue to next potential path
    }
  }

  // Default to project root relative to the script location
  const defaultPath = path.resolve(__dirname, '../../Jane');
  logger.info(`No existing Jane directory found, defaulting to: ${defaultPath}`);
  return defaultPath;
}

// Base directory for Jane documents
export const JANE_DIR = findJaneDirectory();
export const STDLIB_DIR = path.join(JANE_DIR, 'stdlib');
export const SPECS_DIR = path.join(JANE_DIR, 'specs');

// Log Jane directories for troubleshooting
logger.info(`Jane directories:`);
logger.info(`  JANE_DIR: ${JANE_DIR}`);
logger.info(`  STDLIB_DIR: ${STDLIB_DIR}`);
logger.info(`  SPECS_DIR: ${SPECS_DIR}`);

/**
 * Get the absolute path for a document
 * @param type Document type (stdlib or spec)
 * @param subpath The path within the type directory
 * @returns The absolute path
 */
export function getDocumentPath(type: DocumentType, subpath: string): string {
  const baseDir = type === 'stdlib' ? STDLIB_DIR : SPECS_DIR;
  const fullPath = path.join(baseDir, subpath);
  
  // Log detailed path resolution information
  logger.debug(`Resolving path for ${type}://${subpath}`);
  logger.debug(`Base directory: ${baseDir}`);
  logger.debug(`Full path: ${fullPath}`);
  
  // Check if the path exists (for informational purposes)
  try {
    const exists = fs.existsSync(fullPath);
    logger.debug(`Path exists: ${exists ? '✓' : '✗'}`);
    
    // Check parent directory
    const parentDir = path.dirname(fullPath);
    const parentExists = fs.existsSync(parentDir);
    logger.debug(`Parent directory (${parentDir}) exists: ${parentExists ? '✓' : '✗'}`);
  } catch (error) {
    logger.warning(`Error checking path existence: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return fullPath;
}

/**
 * Read a document from the file system
 * @param type Document type (stdlib or spec)
 * @param subpath The path within the type directory
 * @returns The document or null if not found
 */
export async function readDocument(type: DocumentType, subpath: string): Promise<Document | null> {
  const fullPath = getDocumentPath(type, subpath);
  
  try {
    const content = await fs.readFile(fullPath, 'utf8');
    const { meta, content: markdownContent } = parseFrontmatter(content);
    
    return {
      path: subpath,
      type,
      content: markdownContent,
      meta
    };
  } catch (error) {
    console.error(`Error reading document at ${fullPath}:`, error);
    return null;
  }
}

/**
 * Write a document to the file system
 * @param type Document type (stdlib or spec)
 * @param subpath The path within the type directory
 * @param content The markdown content
 * @param meta Document metadata
 * @returns True if successful, with error message if failed
 */
export async function writeDocument(
  type: DocumentType,
  subpath: string,
  content: string,
  meta: DocumentMeta
): Promise<{success: boolean; error?: string}> {
  const fullPath = getDocumentPath(type, subpath);
  
  // Validate parameters
  if (!type || !subpath || !content) {
    const errorMsg = 'Missing required parameters (type, subpath, or content)';
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }
  
  try {
    // Validate base directories exist
    const baseDir = type === 'stdlib' ? STDLIB_DIR : SPECS_DIR;
    if (!await fs.pathExists(baseDir)) {
      const errorMsg = `Base directory does not exist: ${baseDir}`;
      console.error(errorMsg);
      
      // Try to create the Jane structure
      console.error('Attempting to create Jane structure...');
      const created = await ensureJaneStructure();
      if (!created) {
        return { success: false, error: 'Failed to create document directory structure' };
      }
    }
    
    // Create parent directory if it doesn't exist
    const dirPath = path.dirname(fullPath);
    console.error(`Ensuring directory exists: ${dirPath}`);
    
    try {
      await fs.ensureDir(dirPath);
      
      // Verify directory was created
      const dirExists = await fs.pathExists(dirPath);
      if (!dirExists) {
        const errorMsg = `Failed to create directory: ${dirPath}`;
        console.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (dirError) {
      console.error(`Error creating directory ${dirPath}:`, dirError);
      return { 
        success: false, 
        error: `Failed to create directory: ${dirError instanceof Error ? dirError.message : String(dirError)}` 
      };
    }
    
    // Generate markdown with frontmatter
    let markdown;
    try {
      markdown = generateFrontmatter(meta, content);
    } catch (fmError) {
      console.error('Error generating frontmatter:', fmError);
      return { 
        success: false, 
        error: `Failed to generate frontmatter: ${fmError instanceof Error ? fmError.message : String(fmError)}` 
      };
    }
    
    // Write to file
    console.error(`Writing document to: ${fullPath}`);
    try {
      await fs.writeFile(fullPath, markdown, 'utf8');
      console.error(`Successfully wrote document to: ${fullPath}`);
      return { success: true };
    } catch (writeError) {
      console.error(`Error writing file ${fullPath}:`, writeError);
      return { 
        success: false, 
        error: `Failed to write file: ${writeError instanceof Error ? writeError.message : String(writeError)}` 
      };
    }
  } catch (error) {
    const errorMsg = `Error writing document to ${fullPath}: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Update an existing document
 * @param type Document type (stdlib or spec)
 * @param subpath The path within the type directory
 * @param updates Updates to apply (content and/or metadata)
 * @returns The updated document or null if failed
 */
export async function updateDocument(
  type: DocumentType,
  subpath: string,
  updates: { content?: string; meta?: Partial<DocumentMeta> }
): Promise<Document | null> {
  // Read existing document
  const doc = await readDocument(type, subpath);
  if (!doc) return null;
  
  // Apply updates
  const updatedContent = updates.content !== undefined ? updates.content : doc.content;
  const updatedMeta = updates.meta ? { ...doc.meta, ...updates.meta, updatedAt: new Date().toISOString() } : doc.meta;
  
  // Write updated document
  const success = await writeDocument(type, subpath, updatedContent, updatedMeta);
  if (!success) return null;
  
  return {
    path: subpath,
    type,
    content: updatedContent,
    meta: updatedMeta
  };
}

/**
 * List documents of a specified type
 * @param type Document type (stdlib or spec)
 * @param subpath Optional subpath to filter results
 * @returns Array of document paths
 */
export async function listDocuments(type: DocumentType, subpath: string = ''): Promise<string[]> {
  const baseDir = type === 'stdlib' ? STDLIB_DIR : SPECS_DIR;
  const searchPath = path.join(baseDir, subpath);
  
  try {
    // Check if directory exists
    const dirExists = await fs.pathExists(searchPath);
    if (!dirExists) {
      console.error(`Directory does not exist: ${searchPath}`);
      await ensureJaneStructure(); // Ensure the directory structure exists
      return [];
    }

    // Find all markdown files in the directory (and subdirectories)
    const files = await glob('**/*.md', {
      cwd: searchPath,
      absolute: false
    });
    
    console.error(`Found ${files.length} markdown files in ${searchPath}`);
    
    // If we're searching in a subpath, prepend it to each result
    return subpath
      ? files.map(file => path.join(subpath, file))
      : files;
  } catch (error) {
    console.error(`Error listing documents in ${searchPath}:`, error);
    return [];
  }
}

/**
 * List all languages in the stdlib directory
 * @returns Array of language names
 */
export async function listLanguages(): Promise<string[]> {
  try {
    // Check if directory exists
    const dirExists = await fs.pathExists(STDLIB_DIR);
    if (!dirExists) {
      console.error(`Directory does not exist: ${STDLIB_DIR}`);
      await ensureJaneStructure();
    }

    const entries = await fs.readdir(STDLIB_DIR, { withFileTypes: true });
    const languages = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    console.error(`Found languages: ${languages.join(', ')}`);
    return languages;
  } catch (error) {
    console.error('Error listing languages:', error);
    return [];
  }
}

/**
 * List all projects in the specs directory
 * @returns Array of project names
 */
export async function listProjects(): Promise<string[]> {
  try {
    // Check if directory exists
    const dirExists = await fs.pathExists(SPECS_DIR);
    if (!dirExists) {
      console.error(`Directory does not exist: ${SPECS_DIR}`);
      await ensureJaneStructure();
    }

    const entries = await fs.readdir(SPECS_DIR, { withFileTypes: true });
    const projects = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    console.error(`Found projects: ${projects.join(', ')}`);
    return projects;
  } catch (error) {
    console.error('Error listing projects:', error);
    return [];
  }
}

/**
 * Ensure the Jane directory structure exists
 * @returns Promise that resolves to boolean indicating success
 */
export async function ensureJaneStructure(): Promise<boolean> {
  try {
    logger.info(`Creating Jane directory structure at: ${JANE_DIR}`);
    
    // Ensure parent Jane directory exists
    try {
      logger.info(`Creating main Jane directory: ${JANE_DIR}`);
      await fs.ensureDir(JANE_DIR);
      
      // Verify it was created
      const janeExists = await fs.pathExists(JANE_DIR);
      if (!janeExists) {
        logger.error(`Failed to create Jane directory at: ${JANE_DIR}`);
        return false;
      }
      
      // Check if it's writable
      try {
        const testFile = path.join(JANE_DIR, '.write-test');
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
        logger.success(`Jane directory is writable: ${JANE_DIR}`);
      } catch (writeError) {
        logger.error(`Jane directory is not writable: ${JANE_DIR} - ${writeError instanceof Error ? writeError.message : String(writeError)}`);
        return false;
      }
    } catch (dirError) {
      logger.error(`Error creating Jane directory: ${JANE_DIR} - ${dirError instanceof Error ? dirError.message : String(dirError)}`);
      return false;
    }
    
    // Ensure stdlib directory exists
    try {
      logger.info(`Creating stdlib directory: ${STDLIB_DIR}`);
      await fs.ensureDir(STDLIB_DIR);
    } catch (stdlibError) {
      logger.error(`Error creating stdlib directory: ${STDLIB_DIR} - ${stdlibError instanceof Error ? stdlibError.message : String(stdlibError)}`);
      return false;
    }
    
    // Ensure specs directory exists
    try {
      logger.info(`Creating specs directory: ${SPECS_DIR}`);
      await fs.ensureDir(SPECS_DIR);
    } catch (specsError) {
      logger.error(`Error creating specs directory: ${SPECS_DIR} - ${specsError instanceof Error ? specsError.message : String(specsError)}`);
      return false;
    }
    
    // Create default language directories in stdlib
    const languages = ['javascript', 'typescript', 'python'];
    for (const lang of languages) {
      try {
        const langDir = path.join(STDLIB_DIR, lang);
        logger.info(`Creating language directory: ${langDir}`);
        await fs.ensureDir(langDir);
      } catch (langError) {
        logger.warning(`Error creating language directory for ${lang} - ${langError instanceof Error ? langError.message : String(langError)}`);
        // Continue with other languages
      }
    }
    
    // Create default project directories in specs
    const projects = ['project1', 'project2'];
    for (const proj of projects) {
      try {
        const projDir = path.join(SPECS_DIR, proj);
        logger.info(`Creating project directory: ${projDir}`);
        await fs.ensureDir(projDir);
      } catch (projError) {
        logger.warning(`Error creating project directory for ${proj} - ${projError instanceof Error ? projError.message : String(projError)}`);
        // Continue with other projects
      }
    }

    logger.success('Jane directory structure created successfully.');
    return true;
  } catch (error) {
    logger.error(`Error ensuring Jane structure: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}