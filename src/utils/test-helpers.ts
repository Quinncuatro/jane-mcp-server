import { DocumentType, DocumentMeta } from '../types.js';
import { writeDocument } from './filesystem.js';
import { documentIndex } from './search.js';

/**
 * Helper function to create a test document
 * This is useful for ensuring there are documents in the index for testing
 */
export async function createTestDocument(
  type: DocumentType,
  language: string | null,
  project: string | null,
  filename: string,
  title: string,
  content: string = 'This is a test document.'
): Promise<boolean> {
  // Validate type-specific parameters
  let documentPath: string;
  if (type === 'stdlib') {
    if (!language) {
      console.error('Language is required for stdlib documents');
      return false;
    }
    documentPath = `${language}/${filename}`;
  } else {
    // type === 'spec'
    if (!project) {
      console.error('Project is required for spec documents');
      return false;
    }
    documentPath = `${project}/${filename}`;
  }
  
  // Create metadata
  const meta: DocumentMeta = {
    title,
    description: `Test document for ${type} ${type === 'stdlib' ? language : project}`,
    author: 'Claude',
    tags: ['test'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Write the document to disk
  const result = await writeDocument(
    type,
    documentPath,
    content,
    meta
  );
  
  if (result.success) {
    // Force the document index to reload
    await documentIndex.initialize();
    console.error(`Test document created at ${type}://${documentPath}`);
  } else {
    console.error(`Failed to create test document at ${type}://${documentPath}: ${result.error || 'Unknown error'}`);
  }
  
  return result.success;
}