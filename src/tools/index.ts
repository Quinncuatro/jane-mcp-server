import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  DocumentType
} from '../types.js';
import {
  readDocument,
  writeDocument,
  updateDocument,
  listDocuments,
  listLanguages,
  listProjects
} from '../utils/filesystem.js';
import { documentIndex } from '../utils/search.js';

/**
 * Implements all tools for the Jane server
 * @param server The MCP server instance
 */
export function implementTools(server: McpServer): void {
  // Tool to get a stdlib document
  server.registerTool(
    'get_stdlib',
    {
      title: 'Get Standard Library Document',
      description: 'Retrieve a standard library document for a specific language',
      inputSchema: {
        language: z.string().describe('The programming language (e.g., javascript, typescript, python)'),
        path: z.string().describe('The path to the stdlib document within the language directory')
      }
    },
    async ({ language, path }) => {
      // Combine path parts and normalize
      const documentPath = `${language}/${path}`;
      
      // Read the document
      const document = await readDocument('stdlib', documentPath);
      
      if (!document) {
        return {
          content: [{
            type: 'text',
            text: `Document not found: ${documentPath}`
          }],
          isError: true
        };
      }
      
      const formattedOutput = `# ${document.meta.title || 'Untitled'}\n\n${document.content}`;
      
      return {
        content: [{
          type: 'text',
          text: formattedOutput
        }]
      };
    }
  );

  // Tool to get a spec document
  server.registerTool(
    'get_spec',
    {
      title: 'Get Specification Document',
      description: 'Retrieve a specification document for a specific project',
      inputSchema: {
        project: z.string().describe('The project name'),
        path: z.string().describe('The path to the spec document within the project directory')
      }
    },
    async ({ project, path }) => {
      // Combine path parts and normalize
      const documentPath = `${project}/${path}`;
      
      // Read the document
      const document = await readDocument('spec', documentPath);
      
      if (!document) {
        return {
          content: [{
            type: 'text',
            text: `Document not found: ${documentPath}`
          }],
          isError: true
        };
      }
      
      const formattedOutput = `# ${document.meta.title || 'Untitled'}\n\n${document.content}`;
      
      return {
        content: [{
          type: 'text',
          text: formattedOutput
        }]
      };
    }
  );

  // Tool to list stdlib documents
  server.registerTool(
    'list_stdlibs',
    {
      title: 'List Standard Library Documents',
      description: 'List available standard library documents, optionally filtered by language',
      inputSchema: {
        language: z.string().optional().describe('Optional language filter')
      }
    },
    async ({ language }) => {
      if (language) {
        // List documents for a specific language
        const documents = await listDocuments('stdlib', language);
        
        if (documents.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No stdlib documents found for language: ${language}`
            }]
          };
        }
        
        const formattedOutput = documents
          .map(path => path.replace(`${language}/`, ''))
          .join('\\n');
        
        return {
          content: [{
            type: 'text',
            text: `Available stdlib documents for ${language}:\\n${formattedOutput}`
          }]
        };
      } else {
        // List all available languages
        const languages = await listLanguages();
        
        if (languages.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No stdlib languages found'
            }]
          };
        }
        
        const formattedOutput = languages.join('\\n');
        
        return {
          content: [{
            type: 'text',
            text: `Available stdlib languages:\\n${formattedOutput}`
          }]
        };
      }
    }
  );

  // Tool to list spec documents
  server.registerTool(
    'list_specs',
    {
      title: 'List Specification Documents',
      description: 'List available specification documents, optionally filtered by project',
      inputSchema: {
        project: z.string().optional().describe('Optional project filter')
      }
    },
    async ({ project }) => {
      if (project) {
        // List documents for a specific project
        const documents = await listDocuments('spec', project);
        
        if (documents.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No spec documents found for project: ${project}`
            }]
          };
        }
        
        const formattedOutput = documents
          .map(path => path.replace(`${project}/`, ''))
          .join('\\n');
        
        return {
          content: [{
            type: 'text',
            text: `Available spec documents for ${project}:\\n${formattedOutput}`
          }]
        };
      } else {
        // List all available projects
        const projects = await listProjects();
        
        if (projects.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No spec projects found'
            }]
          };
        }
        
        const formattedOutput = projects.join('\\n');
        
        return {
          content: [{
            type: 'text',
            text: `Available spec projects:\\n${formattedOutput}`
          }]
        };
      }
    }
  );

  // Tool to search documents
  server.registerTool(
    'search',
    {
      title: 'Search Documents',
      description: 'Search for documents by content or metadata',
      inputSchema: {
        query: z.string().describe('The search query'),
        type: z.enum(['stdlib', 'spec']).optional().describe('Optional document type filter'),
        language: z.string().optional().describe('Optional language filter (for stdlib)'),
        project: z.string().optional().describe('Optional project filter (for specs)'),
        includeContent: z.boolean().optional().default(false).describe('Whether to include full content in results')
      }
    },
    async ({ query, type, language, project, includeContent }) => {
      const results = await documentIndex.search(query, {
        type,
        language,
        project,
        includeContent
      });
      
      if (results.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No results found for query: ${query}`
          }]
        };
      }
      
      const formattedResults = results.map(result => {
        const doc = result.document;
        const meta = doc.meta;
        let output = `## ${meta.title}\n`;
        output += `**Path:** ${doc.type}://${doc.path}\n`;
        
        if (meta.description) {
          output += `**Description:** ${meta.description}\n`;
        }
        
        if (meta.tags && meta.tags.length > 0) {
          output += `**Tags:** ${meta.tags.join(', ')}\n`;
        }
        
        if (result.matches && result.matches.length > 0) {
          output += '\n**Matches:**\n';
          output += result.matches.map(m => `> ${m}`).join('\n');
        }
        
        if (includeContent && doc.content) {
          output += '\n\n**Content:**\n';
          output += doc.content;
        }
        
        return output;
      }).join('\n\n---\n\n');
      
      return {
        content: [{
          type: 'text',
          text: `Found ${results.length} results for "${query}":\n\n${formattedResults}`
        }]
      };
    }
  );

  // Tool to create a document
  server.registerTool(
    'create_document',
    {
      title: 'Create Document',
      description: 'Create a new document with frontmatter metadata',
      inputSchema: {
        type: z.enum(['stdlib', 'spec']).describe('Document type'),
        language: z.string().optional().describe('Required for stdlib documents'),
        project: z.string().optional().describe('Required for spec documents'),
        path: z.string().describe('Path within the language/project directory'),
        title: z.string().describe('Document title'),
        description: z.string().optional().describe('Document description'),
        author: z.string().optional().describe('Document author'),
        tags: z.array(z.string()).optional().describe('Document tags'),
        content: z.string().describe('Document content (markdown)')
      }
    },
    async ({ type, language, project, path, title, description, author, tags, content }) => {
      // Validate path based on document type
      let documentPath: string;
      if (type === 'stdlib') {
        if (!language) {
          return {
            content: [{
              type: 'text',
              text: 'Language is required for stdlib documents'
            }],
            isError: true
          };
        }
        documentPath = `${language}/${path}`;
      } else {
        // type === 'spec'
        if (!project) {
          return {
            content: [{
              type: 'text',
              text: 'Project is required for spec documents'
            }],
            isError: true
          };
        }
        documentPath = `${project}/${path}`;
      }
      
      // Check if document already exists
      const existingDoc = await readDocument(type, documentPath);
      if (existingDoc) {
        return {
          content: [{
            type: 'text',
            text: `Document already exists at ${type}://${documentPath}`
          }],
          isError: true
        };
      }
      
      // Create the document with metadata
      const result = await writeDocument(
        type,
        documentPath,
        content,
        {
          title,
          description,
          author,
          tags,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      
      if (!result.success) {
        console.error(`Document creation failed for ${type}://${documentPath}: ${result.error || 'Unknown error'}`);
        return {
          content: [{
            type: 'text',
            text: `Failed to create document at ${type}://${documentPath}: ${result.error || 'Path resolution or permission issue'}`
          }],
          isError: true
        };
      }
      
      // Read the created document to update the index
      const newDoc = await readDocument(type, documentPath);
      if (newDoc) {
        await documentIndex.addOrUpdateDocument(newDoc);
      }
      
      return {
        content: [{
          type: 'text',
          text: `Document created successfully at ${type}://${documentPath}`
        }]
      };
    }
  );

  // Tool to update a document
  server.registerTool(
    'update_document',
    {
      title: 'Update Document',
      description: 'Update an existing document\'s content and/or metadata',
      inputSchema: {
        type: z.enum(['stdlib', 'spec']).describe('Document type'),
        language: z.string().optional().describe('Required for stdlib documents'),
        project: z.string().optional().describe('Required for spec documents'),
        path: z.string().describe('Path within the language/project directory'),
        title: z.string().optional().describe('Document title'),
        description: z.string().optional().describe('Document description'),
        author: z.string().optional().describe('Document author'),
        tags: z.array(z.string()).optional().describe('Document tags'),
        content: z.string().optional().describe('Document content (markdown)'),
        updateMeta: z.boolean().optional().default(true).describe('Whether to update metadata')
      }
    },
    async ({ type, language, project, path, title, description, author, tags, content, updateMeta }) => {
      // Validate path based on document type
      let documentPath: string;
      if (type === 'stdlib') {
        if (!language) {
          return {
            content: [{
              type: 'text',
              text: 'Language is required for stdlib documents'
            }],
            isError: true
          };
        }
        documentPath = `${language}/${path}`;
      } else {
        // type === 'spec'
        if (!project) {
          return {
            content: [{
              type: 'text',
              text: 'Project is required for spec documents'
            }],
            isError: true
          };
        }
        documentPath = `${project}/${path}`;
      }
      
      // Check if document exists
      const existingDoc = await readDocument(type, documentPath);
      if (!existingDoc) {
        return {
          content: [{
            type: 'text',
            text: `Document not found at ${type}://${documentPath}`
          }],
          isError: true
        };
      }
      
      // Update the document
      const updatedDoc = await updateDocument(
        type,
        documentPath,
        {
          content: content !== undefined ? content : undefined,
          meta: updateMeta ? {
            title: title !== undefined ? title : undefined,
            description: description !== undefined ? description : undefined,
            author: author !== undefined ? author : undefined,
            tags: tags !== undefined ? tags : undefined,
            updatedAt: new Date().toISOString()
          } : undefined
        }
      );
      
      if (!updatedDoc) {
        return {
          content: [{
            type: 'text',
            text: `Failed to update document at ${type}://${documentPath}`
          }],
          isError: true
        };
      }
      
      // Update the document index
      await documentIndex.addOrUpdateDocument(updatedDoc);
      
      return {
        content: [{
          type: 'text',
          text: `Document updated successfully at ${type}://${documentPath}`
        }]
      };
    }
  );
}