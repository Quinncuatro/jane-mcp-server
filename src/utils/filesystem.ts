import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { Document, DocumentType, DocumentMeta } from '../types.js';
import { parseFrontmatter, generateFrontmatter } from './frontmatter.js';

// Base directory for Jane documents
export const JANE_DIR = path.resolve(process.cwd(), 'Jane');
export const STDLIB_DIR = path.join(JANE_DIR, 'stdlib');
export const SPECS_DIR = path.join(JANE_DIR, 'specs');

/**
 * Get the absolute path for a document
 * @param type Document type (stdlib or spec)
 * @param subpath The path within the type directory
 * @returns The absolute path
 */
export function getDocumentPath(type: DocumentType, subpath: string): string {
  const baseDir = type === 'stdlib' ? STDLIB_DIR : SPECS_DIR;
  return path.join(baseDir, subpath);
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
    return null;
  }
}

/**
 * Write a document to the file system
 * @param type Document type (stdlib or spec)
 * @param subpath The path within the type directory
 * @param content The markdown content
 * @param meta Document metadata
 * @returns True if successful
 */
export async function writeDocument(
  type: DocumentType,
  subpath: string,
  content: string,
  meta: DocumentMeta
): Promise<boolean> {
  const fullPath = getDocumentPath(type, subpath);
  
  try {
    // Create directory if it doesn't exist
    await fs.ensureDir(path.dirname(fullPath));
    
    // Generate markdown with frontmatter
    const markdown = generateFrontmatter(meta, content);
    
    // Write to file
    await fs.writeFile(fullPath, markdown, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing document:', error);
    return false;
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
    // Find all markdown files in the directory (and subdirectories)
    const files = await glob('**/*.md', {
      cwd: searchPath,
      absolute: false
    });
    
    // If we're searching in a subpath, prepend it to each result
    return subpath
      ? files.map(file => path.join(subpath, file))
      : files;
  } catch (error) {
    console.error('Error listing documents:', error);
    return [];
  }
}

/**
 * List all languages in the stdlib directory
 * @returns Array of language names
 */
export async function listLanguages(): Promise<string[]> {
  try {
    const entries = await fs.readdir(STDLIB_DIR, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
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
    const entries = await fs.readdir(SPECS_DIR, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch (error) {
    console.error('Error listing projects:', error);
    return [];
  }
}

/**
 * Ensure the Jane directory structure exists
 */
export async function ensureJaneStructure(): Promise<void> {
  try {
    await fs.ensureDir(STDLIB_DIR);
    await fs.ensureDir(SPECS_DIR);
    
    // Create default language directories if they don't exist
    await fs.ensureDir(path.join(STDLIB_DIR, 'javascript'));
    await fs.ensureDir(path.join(STDLIB_DIR, 'typescript'));
    await fs.ensureDir(path.join(STDLIB_DIR, 'python'));
    
    // Create default project directories if they don't exist
    await fs.ensureDir(path.join(SPECS_DIR, 'project1'));
    await fs.ensureDir(path.join(SPECS_DIR, 'project2'));
  } catch (error) {
    console.error('Error ensuring Jane structure:', error);
  }
}