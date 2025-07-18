import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ensureJaneStructure } from './utils/filesystem.js';
import { documentIndex } from './utils/search.js';
import { implementResources } from './resources/index.js';
import { implementTools } from './tools/index.js';
import { createTestDocument } from './utils/test-helpers.js';
import logger from './utils/logger.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize test documents to ensure the server has content
 */
async function initializeTestDocuments(): Promise<void> {
  logger.info('Checking for test documents...');
  
  // Create test documents for each language
  await createTestDocument(
    'stdlib', 
    'javascript', 
    null, 
    'array-methods.md', 
    'JavaScript Array Methods',
    '# JavaScript Array Methods\n\n' +
    'Common array methods in JavaScript:\n\n' +
    '- `map()`: Creates a new array with the results of calling a function on every element\n' +
    '- `filter()`: Creates a new array with elements that pass a test\n' +
    '- `reduce()`: Applies a function to reduce the array to a single value\n' +
    '- `forEach()`: Executes a function once for each array element'
  );
  
  await createTestDocument(
    'stdlib', 
    'python', 
    null, 
    'list-methods.md', 
    'Python List Methods',
    '# Python List Methods\n\n' +
    'Common list methods in Python:\n\n' +
    '- `append()`: Adds an element to the end of the list\n' +
    '- `extend()`: Adds all elements of a list to another list\n' +
    '- `insert()`: Inserts an item at a given position\n' +
    '- `remove()`: Removes an item from the list'
  );
  
  await createTestDocument(
    'stdlib', 
    'typescript', 
    null, 
    'interfaces.md', 
    'TypeScript Interfaces',
    '# TypeScript Interfaces\n\n' +
    'Interfaces in TypeScript define the structure of objects:\n\n' +
    '```typescript\n' +
    'interface User {\n' +
    '  id: number;\n' +
    '  name: string;\n' +
    '  email?: string; // Optional property\n' +
    '}\n' +
    '```'
  );
  
  // Create test documents for projects
  await createTestDocument(
    'spec', 
    null, 
    'project1', 
    'api.md', 
    'API Documentation',
    '# API Documentation\n\n' +
    'REST API endpoints:\n\n' +
    '## Users\n\n' +
    '- `GET /api/users`: List all users\n' +
    '- `GET /api/users/:id`: Get user by ID\n' +
    '- `POST /api/users`: Create a new user\n' +
    '- `PUT /api/users/:id`: Update a user\n' +
    '- `DELETE /api/users/:id`: Delete a user'
  );
  
  await createTestDocument(
    'spec', 
    null, 
    'project2', 
    'architecture.md', 
    'System Architecture',
    '# System Architecture\n\n' +
    'The system consists of the following components:\n\n' +
    '1. Frontend (React.js)\n' +
    '2. Backend API (Node.js/Express)\n' +
    '3. Database (PostgreSQL)\n' +
    '4. Authentication Service (OAuth2)'
  );
  
  logger.success('Test documents initialized');
}

/**
 * Initialize and configure the Jane MCP server
 * @returns The configured McpServer instance
 */
export async function createServer(): Promise<McpServer> {
  // Create server instance
  const server = new McpServer({
    name: 'jane',
    version: '1.0.0',
    description: 'Knowledge management server for stdlib and specs'
  });

  // Log environment information for debugging
  logger.startup('Jane MCP Server Starting');
  logger.header('Environment Information');
  logger.info(`Node version: ${process.version}`);
  logger.info(`Platform: ${process.platform}-${process.arch}`);
  logger.info(`Current working directory: ${process.cwd()}`);
  logger.info(`Script directory: ${__dirname}`);
  
  // Ensure the Jane directory structure exists
  logger.header('Directory Setup');
  const structureCreated = await ensureJaneStructure();
  
  if (!structureCreated) {
    logger.warning('Failed to create Jane directory structure. Document operations may fail.');
  } else {
    logger.success('Jane directory structure verified');
  }
  
  // Create some test documents if needed
  await initializeTestDocuments();
  
  // Initialize the document index
  logger.info('Initializing document index...');
  await documentIndex.initialize();
  logger.success('Document index initialized');
  
  // Scan and index all existing documents
  logger.info('Scanning existing documents...');
  try {
    // Import here to avoid circular dependencies
    const { scanAndIndexDocuments } = await import('./utils/document-scanner.js');
    const scanResults = await scanAndIndexDocuments();
    
    // Log detailed results
    logger.success(
      `Document scan complete: ${scanResults.indexed} indexed, ` +
      `${scanResults.skipped} unchanged, ${scanResults.failed} failed`
    );
    
    // If any documents failed, log a warning with the count
    if (scanResults.failed > 0) {
      logger.warning(`${scanResults.failed} documents failed to index. Check logs for details.`);
    }
  } catch (error) {
    logger.error(`Error scanning documents: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Register resources for stdlib and specs
  logger.info('Registering document resources...');
  implementResources(server);
  logger.success('Resources registered');
  
  // Register tools for interacting with documents
  logger.info('Registering document tools...');
  implementTools(server);
  logger.success('Tools registered');
  
  return server;
}