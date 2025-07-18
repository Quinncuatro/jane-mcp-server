import { Document, DocumentType } from '../types.js';
import { listDocuments, readDocument } from './filesystem.js';
import { documentIndex } from './search.js';
import logger from './logger.js';
import fs from 'fs-extra';
import path from 'path';
import { getDocumentPath } from './filesystem.js';

/**
 * Scans and indexes all existing documents in the Jane directory
 * This ensures that all documents on disk are properly indexed in SQLite
 * Optimized to only index documents that are new or have been modified since last indexing
 */
export async function scanAndIndexDocuments(): Promise<{ 
  indexed: number;
  skipped: number;
  failed: number;
  errors: Error[];
}> {
  logger.info('Starting document scan and index operation...');
  
  const results = {
    indexed: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Error[]
  };

  try {
    // Get all documents already in the database for efficient lookups
    const existingDocuments = await documentIndex.getAllDocumentsMetadata();
    logger.info(`Found ${existingDocuments.size} documents in database`);
    
    // Process both document types
    const documentTypes: DocumentType[] = ['stdlib', 'spec'];
    
    for (const type of documentTypes) {
      logger.info(`Scanning ${type} documents...`);
      
      try {
        // Get all document paths for this type
        const paths = await listDocuments(type);
        logger.info(`Found ${paths.length} ${type} documents to scan`);
        
        // Process each document
        for (const docPath of paths) {
          try {
            // Check if document already exists in database
            const documentKey = `${type}://${docPath}`;
            const existingDoc = existingDocuments.get(documentKey);
            
            // Get the file's last modified time
            const fullPath = getDocumentPath(type, docPath);
            const fileStats = await fs.stat(fullPath);
            const fileModified = fileStats.mtime.toISOString();
            
            // Skip if document exists and hasn't been modified
            if (existingDoc && existingDoc.updatedAt && existingDoc.updatedAt >= fileModified) {
              results.skipped++;
              logger.debug(`Skipped unchanged document: ${documentKey} (DB: ${existingDoc.updatedAt}, File: ${fileModified})`);
              continue;
            }
            
            // Document is new or has been modified, read and index it
            const document = await readDocument(type, docPath);
            
            if (document) {
              await documentIndex.addOrUpdateDocument(document);
              results.indexed++;
              logger.debug(`Indexed document: ${documentKey} (${existingDoc ? 'updated' : 'new'})`);
            } else {
              // Document read failed
              results.failed++;
              const error = new Error(`Failed to read document: ${documentKey}`);
              results.errors.push(error);
              logger.error(error.message);
            }
          } catch (error) {
            // Document processing error
            results.failed++;
            const processError = error instanceof Error ? error : new Error(String(error));
            results.errors.push(processError);
            logger.error(`Error processing document ${type}://${docPath}: ${processError.message}`);
          }
        }
      } catch (error) {
        // Document listing error
        const listError = error instanceof Error ? error : new Error(String(error));
        results.errors.push(listError);
        logger.error(`Error listing ${type} documents: ${listError.message}`);
      }
    }
    
    // Check for documents in database that no longer exist in the filesystem
    // This would handle deletions, but is commented out to avoid unintended document removal
    // We can enable this in a future version if needed
    /*
    for (const [documentKey, metadata] of existingDocuments.entries()) {
      const [type, ...pathParts] = documentKey.split('://');
      const docPath = pathParts.join('://');
      
      try {
        const fullPath = getDocumentPath(type as DocumentType, docPath);
        const exists = await fs.pathExists(fullPath);
        
        if (!exists) {
          // Document exists in database but not in filesystem
          await documentIndex.removeDocument(type as DocumentType, docPath);
          logger.info(`Removed deleted document from index: ${documentKey}`);
        }
      } catch (error) {
        logger.error(`Error checking deleted document ${documentKey}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    */
    
  } catch (error) {
    const scanError = error instanceof Error ? error : new Error(String(error));
    results.errors.push(scanError);
    logger.error(`Error during document scanning: ${scanError.message}`);
  }
  
  logger.info(
    `Document scan complete. Indexed: ${results.indexed}, ` +
    `Skipped: ${results.skipped}, Failed: ${results.failed}`
  );
  return results;
}