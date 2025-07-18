/**
 * Jane Document System Diagnostics
 * 
 * This script performs diagnostic tests on Jane's document system:
 * - Checks environment information
 * - Verifies directory structure and permissions
 * - Tests document creation and retrieval operations
 * - Validates path resolution
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { 
  DocumentType, 
  DocumentMeta 
} from '../src/types.js';
import { 
  findJaneDirectory,
  JANE_DIR, 
  STDLIB_DIR, 
  SPECS_DIR, 
  ensureJaneStructure,
  getDocumentPath, 
  writeDocument, 
  readDocument,
  listDocuments,
  listLanguages,
  listProjects
} from '../src/utils/filesystem.js';
import { documentIndex } from '../src/utils/search.js';

/**
 * Console log with color support
 */
const log = {
  info: (message: string) => console.log(`\x1b[36m${message}\x1b[0m`),     // Cyan
  success: (message: string) => console.log(`\x1b[32m${message}\x1b[0m`),  // Green
  warning: (message: string) => console.log(`\x1b[33m${message}\x1b[0m`),  // Yellow
  error: (message: string) => console.log(`\x1b[31m${message}\x1b[0m`),    // Red
  header: (message: string) => console.log(`\n\x1b[1m\x1b[36m--- ${message} ---\x1b[0m`) // Bold Cyan
};

async function runDiagnostics() {
  log.header('JANE DOCUMENT SYSTEM DIAGNOSTICS');
  
  // 1. Environment Information
  log.header('ENVIRONMENT INFORMATION');
  log.info(`Node.js version: ${process.version}`);
  log.info(`Platform: ${process.platform}-${process.arch}`);
  log.info(`Current working directory: ${process.cwd()}`);
  log.info(`Script directory: ${__dirname}`);
  
  // 2. Jane Directory Path Resolution
  log.header('PATH RESOLUTION');
  log.info(`Jane directory resolution result: ${JANE_DIR}`);
  log.info(`Stdlib directory: ${STDLIB_DIR}`);
  log.info(`Specs directory: ${SPECS_DIR}`);
  
  // 3. Directory Existence Check
  log.header('DIRECTORY STRUCTURE');
  const janeExists = await fs.pathExists(JANE_DIR);
  const stdlibExists = await fs.pathExists(STDLIB_DIR);
  const specsExists = await fs.pathExists(SPECS_DIR);
  
  log.info(`Jane directory exists: ${janeExists ? 'Yes ✓' : 'No ✗'}`);
  log.info(`Stdlib directory exists: ${stdlibExists ? 'Yes ✓' : 'No ✗'}`);
  log.info(`Specs directory exists: ${specsExists ? 'Yes ✓' : 'No ✗'}`);
  
  if (!janeExists || !stdlibExists || !specsExists) {
    log.warning('Some directories do not exist. Attempting to create structure...');
    const created = await ensureJaneStructure();
    if (created) {
      log.success('Successfully created Jane directory structure');
    } else {
      log.error('Failed to create Jane directory structure');
      return;
    }
  }
  
  // 4. Directory Permissions
  log.header('DIRECTORY PERMISSIONS');
  try {
    const janeStats = fs.statSync(JANE_DIR);
    const stdlibStats = fs.statSync(STDLIB_DIR);
    const specsStats = fs.statSync(SPECS_DIR);
    
    log.info(`Jane directory: ${janeStats.mode.toString(8)}`);
    log.info(`Stdlib directory: ${stdlibStats.mode.toString(8)}`);
    log.info(`Specs directory: ${specsStats.mode.toString(8)}`);
    
    // Test write permission
    const testFile = path.join(JANE_DIR, '.permission-test');
    try {
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      log.success('Write permission test: Success ✓');
    } catch (error) {
      log.error(`Write permission test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    log.error(`Permission check failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // 5. Path Resolution Test
  log.header('PATH RESOLUTION TEST');
  const stdlibPath = getDocumentPath('stdlib', 'test-lang/test-file.md');
  const specPath = getDocumentPath('spec', 'test-proj/test-file.md');
  
  log.info(`Resolved stdlib path: ${stdlibPath}`);
  log.info(`Resolved spec path: ${specPath}`);
  
  // 6. Document Creation Test
  log.header('DOCUMENT CREATION TEST');
  const testMeta: DocumentMeta = {
    title: 'Diagnostic Test Document',
    description: 'Document created by Jane diagnostics',
    author: 'Jane Diagnostics',
    tags: ['diagnostic', 'test'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const testContent = '# Diagnostic Test Document\n\nThis document was created by the Jane diagnostics script.';
  
  // Test stdlib document creation
  try {
    log.info('Creating test stdlib document...');
    const stdlibResult = await writeDocument('stdlib', 'diagnostics/test.md', testContent, testMeta);
    
    if (stdlibResult.success) {
      log.success('Stdlib document creation: Success ✓');
    } else {
      log.error(`Stdlib document creation failed: ${stdlibResult.error}`);
    }
  } catch (error) {
    log.error(`Stdlib document creation error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Test spec document creation
  try {
    log.info('Creating test spec document...');
    const specResult = await writeDocument('spec', 'diagnostics/test.md', testContent, testMeta);
    
    if (specResult.success) {
      log.success('Spec document creation: Success ✓');
    } else {
      log.error(`Spec document creation failed: ${specResult.error}`);
    }
  } catch (error) {
    log.error(`Spec document creation error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // 7. Document Reading Test
  log.header('DOCUMENT READING TEST');
  try {
    log.info('Reading test stdlib document...');
    const stdlibDoc = await readDocument('stdlib', 'diagnostics/test.md');
    
    if (stdlibDoc) {
      log.success('Stdlib document reading: Success ✓');
      log.info(`Document title: ${stdlibDoc.meta.title}`);
    } else {
      log.error('Stdlib document reading failed: Document not found');
    }
  } catch (error) {
    log.error(`Stdlib document reading error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  try {
    log.info('Reading test spec document...');
    const specDoc = await readDocument('spec', 'diagnostics/test.md');
    
    if (specDoc) {
      log.success('Spec document reading: Success ✓');
      log.info(`Document title: ${specDoc.meta.title}`);
    } else {
      log.error('Spec document reading failed: Document not found');
    }
  } catch (error) {
    log.error(`Spec document reading error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // 8. Document Listing Test
  log.header('DOCUMENT LISTING TEST');
  try {
    log.info('Listing languages...');
    const languages = await listLanguages();
    log.info(`Found languages: ${languages.join(', ')}`);
    
    if (languages.includes('diagnostics')) {
      log.success('Test language found in listing ✓');
    } else {
      log.error('Test language not found in listing');
    }
  } catch (error) {
    log.error(`Language listing error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  try {
    log.info('Listing projects...');
    const projects = await listProjects();
    log.info(`Found projects: ${projects.join(', ')}`);
    
    if (projects.includes('diagnostics')) {
      log.success('Test project found in listing ✓');
    } else {
      log.error('Test project not found in listing');
    }
  } catch (error) {
    log.error(`Project listing error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // 9. Index Test
  log.header('DOCUMENT INDEX TEST');
  try {
    log.info('Initializing document index...');
    await documentIndex.initialize();
    log.success('Document index initialized ✓');
    
    log.info('Searching for diagnostic document...');
    const results = await documentIndex.search('diagnostic', { includeContent: true });
    log.info(`Search results: ${results.length}`);
    
    if (results.length > 0) {
      log.success('Document found in index ✓');
    } else {
      log.error('Document not found in index');
    }
  } catch (error) {
    log.error(`Index test error: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  log.header('DIAGNOSTICS COMPLETE');
}

// Run the diagnostics
runDiagnostics().catch(error => {
  console.error('Diagnostics failed:', error);
});