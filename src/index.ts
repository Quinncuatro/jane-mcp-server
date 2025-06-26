import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

/**
 * Main entry point for Jane MCP server
 */
async function main() {
  try {
    console.error('Starting Jane MCP server...');
    
    // Create the server
    const server = await createServer();
    
    // Set up stdio transport for local tools
    console.error('Connecting to stdin/stdout transport...');
    const transport = new StdioServerTransport();
    
    // Connect the server to the transport
    await server.connect(transport);
    
    console.error('Jane MCP server is running...');
    
    // The server will keep running until the process is terminated
  } catch (error) {
    console.error('Error starting Jane MCP server:', error);
    process.exit(1);
  }
}

// Run the application
main();