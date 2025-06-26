import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ensureJaneStructure } from './utils/filesystem.js';
import { documentIndex } from './utils/search.js';
import { implementResources } from './resources/index.js';
import { implementTools } from './tools/index.js';

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
  
  // Initialize the document index
  await documentIndex.initialize();
  
  // Register resources for stdlib and specs
  implementResources(server);
  
  // Register tools for interacting with documents
  implementTools(server);
  
  return server;
}