import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import logger from './utils/logger.js';

/**
 * Create and start an HTTP server for Jane MCP
 * This enables remote connections to the MCP server
 * 
 * @param server - The configured MCP server instance
 * @param port - The port number to listen on
 */
export function startHttpServer(server: McpServer, port: number = 9001): void {
  const app = express();
  app.use(express.json());
  
  logger.header('HTTP Server Setup');
  logger.info(`Setting up HTTP server for remote connections on port ${port}...`);

  // Store transports by session ID
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  // MCP POST endpoint
  app.post('/mcp', async (req, res) => {
    logger.debug(`Received MCP request: ${JSON.stringify(req.body)}`);

    try {
      // Check for existing session ID
      const sessionId = req.headers['mcp-session-id'] as string;
      let transport: StreamableHTTPServerTransport;
      
      if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        const eventStore = new InMemoryEventStore();
        
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          eventStore, // Enable resumability
          onsessioninitialized: (sid) => {
            // Store the transport by session ID when session is initialized
            logger.info(`Session initialized with ID: ${sid}`);
            transports[sid] = transport;
          }
        });
        
        // Set up onclose handler to clean up transport when closed
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            logger.info(`Transport closed for session ${sid}, removing from transports map`);
            delete transports[sid];
          }
        };
        
        // Connect the transport to the MCP server BEFORE handling the request
        await server.connect(transport);
        await transport.handleRequest(req.body, req, res);
        return; // Already handled
      } else {
        // Invalid request - no session ID or not initialization request
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
        return;
      }
      
      // Handle the request with existing transport
      await transport.handleRequest(req.body, req, res);
    } catch (error) {
      logger.error(`Error handling MCP request: ${error instanceof Error ? error.message : String(error)}`);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });
  
  // Handle GET requests for SSE streams
  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    
    // Check for Last-Event-ID header for resumability
    const lastEventId = req.headers['last-event-id'];
    if (lastEventId) {
      logger.info(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
    } else {
      logger.info(`Establishing new SSE stream for session ${sessionId}`);
    }
    
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  });
  
  // Handle DELETE requests for session termination
  app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string;
    
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    
    logger.info(`Received session termination request for session ${sessionId}`);
    
    try {
      const transport = transports[sessionId];
      await transport.handleRequest(req, res);
    } catch (error) {
      logger.error(`Error handling session termination: ${error instanceof Error ? error.message : String(error)}`);
      if (!res.headersSent) {
        res.status(500).send('Error processing session termination');
      }
    }
  });
  
  // Add a basic health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      name: 'jane-mcp-server',
      version: '1.0.0',
      transportCount: Object.keys(transports).length
    });
  });
  
  // Start the server
  app.listen(port, '0.0.0.0', () => {
    logger.success(`Jane MCP HTTP Server listening on port ${port}`);
  });
  
  // Handle server shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down HTTP server...');
    
    // Close all active transports to properly clean up resources
    for (const sessionId in transports) {
      try {
        logger.info(`Closing transport for session ${sessionId}`);
        await transports[sessionId].close();
        delete transports[sessionId];
      } catch (error) {
        logger.error(`Error closing transport for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    logger.info('HTTP server shutdown complete');
  });
}