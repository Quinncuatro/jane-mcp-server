import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ensureJaneStructure } from './utils/filesystem.js';
import { documentIndex } from './utils/search.js';
import { implementResources } from './resources/index.js';
import { implementTools } from './tools/index.js';
import { createTestDocument } from './utils/test-helpers.js';

/**
 * Initialize test documents to ensure the server has content
 */
async function initializeTestDocuments(): Promise<void> {
  console.error('Checking for test documents...');
  
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
  
  console.error('Test documents initialized');
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

  // Ensure the Jane directory structure exists
  await ensureJaneStructure();
  
  // Create some test documents if needed
  await initializeTestDocuments();
  
  // Initialize the document index
  await documentIndex.initialize();
  
  // Register resources for stdlib and specs
  implementResources(server);
  
  // Register tools for interacting with documents
  implementTools(server);
  
  return server;
}