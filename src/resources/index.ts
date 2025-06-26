import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listLanguages, listProjects, readDocument } from '../utils/filesystem.js';

/**
 * Implements all resources for the Jane server
 * @param server The MCP server instance
 */
export function implementResources(server: McpServer): void {
  // Resource for stdlib documents
  server.registerResource(
    'stdlib',
    new ResourceTemplate('stdlib://{language}/{path}', {
      list: undefined,
      complete: {
        language: async (value) => {
          const languages = await listLanguages();
          return languages.filter(lang => lang.toLowerCase().includes(value.toLowerCase()));
        },
        path: async (value, context) => {
          if (!context?.arguments?.language) return [];
          
          // In a production application, we would implement a more sophisticated
          // auto-completion system for paths. For the MVP, we'll just do basic filtering.
          return ['README.md', 'index.md', 'getting-started.md']
            .filter(p => p.toLowerCase().includes(value.toLowerCase()));
        }
      }
    }),
    {
      title: 'Standard Library Document',
      description: 'Access standard library documents for different programming languages',
      mimeType: 'text/markdown'
    },
    async (uri, extra) => {
      // Get the parameters from the template (TypeScript knows these are available from the template pattern)
      const args = extra.arguments as { language: string; path: string };
      const language = args.language;
      const path = args.path;
      
      // Combine path parts and normalize
      const documentPath = `${language}/${path}`;
      
      // Read the document
      const document = await readDocument('stdlib', documentPath);
      
      if (!document) {
        return {
          contents: [{
            uri: uri.href,
            text: `Document not found: ${documentPath}`
          }],
          isError: true
        };
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: document.content
        }]
      };
    }
  );

  // Resource for spec documents
  server.registerResource(
    'spec',
    new ResourceTemplate('spec://{project}/{path}', {
      list: undefined,
      complete: {
        project: async (value) => {
          const projects = await listProjects();
          return projects.filter(proj => proj.toLowerCase().includes(value.toLowerCase()));
        },
        path: async (value, context) => {
          if (!context?.arguments?.project) return [];
          
          // In a production application, we would implement a more sophisticated
          // auto-completion system for paths. For the MVP, we'll just do basic filtering.
          return ['README.md', 'architecture.md', 'api.md']
            .filter(p => p.toLowerCase().includes(value.toLowerCase()));
        }
      }
    }),
    {
      title: 'Specification Document',
      description: 'Access specification documents for different projects',
      mimeType: 'text/markdown'
    },
    async (uri, extra) => {
      // Get the parameters from the template (TypeScript knows these are available from the template pattern)
      const args = extra.arguments as { project: string; path: string };
      const project = args.project;
      const path = args.path;
      
      // Combine path parts and normalize
      const documentPath = `${project}/${path}`;
      
      // Read the document
      const document = await readDocument('spec', documentPath);
      
      if (!document) {
        return {
          contents: [{
            uri: uri.href,
            text: `Document not found: ${documentPath}`
          }],
          isError: true
        };
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: document.content
        }]
      };
    }
  );
}