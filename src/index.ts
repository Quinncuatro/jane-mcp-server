import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import logger from './utils/logger.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main entry point for Jane MCP server
 */
async function main() {
  try {
    // Create the server
    const server = await createServer();
    
    // Set up stdio transport for local tools
    logger.info('Connecting to stdin/stdout transport...');
    const transport = new StdioServerTransport();
    
    // Connect the server to the transport
    await server.connect(transport);
    
    logger.startup('Jane MCP server is running and ready for connections');
    
    // The server will keep running until the process is terminated
  } catch (error) {
    logger.error('Error starting Jane MCP server:');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the application
main();