# Jane MCP Server - Development Commands

## Essential Development Commands

### Build & Development
- `npm run build` - Compile TypeScript to JavaScript in `dist/` directory
- `npm run dev` - Run in development mode with ts-node (no compilation needed)
- `npm start` - Start the compiled server from `dist/index.js`

### Testing
- `npm test` - Run the complete test suite with vitest
- `npm run test:watch` - Run tests in watch mode for development
- `npx tsx tests/jane-diagnostics.ts` - Run comprehensive diagnostics
- `npx tsx tests/test-doc-creation.ts` - Test basic document operations

### Code Quality
- `npm run lint` - Run ESLint on TypeScript files in `src/`
- ESLint rules: TypeScript recommended + custom rules for console usage and unused vars

### Docker Operations
- `docker-compose up -d` - Start containerized Jane server
- `docker logs jane-mcp-server` - View container logs
- `docker exec jane-mcp-server node -e "console.log('test')"` - Test container

### System Commands (Linux)
- `find ./Jane -type d | sort` - List directory structure
- `find ./Jane -name "*.md" | sort` - List all document files
- `ls -la Jane/` - Check Jane directory permissions
- `git status` - Check repository status
- `git log --oneline -10` - View recent commits

### Environment Variables
- `JANE_DIR=/path/to/documents npm start` - Set explicit document location
- `NODE_ENV=production` - Set production environment
- `JANE_DATA_DIR=/host/path` - Set host path for Docker volume mount

### MCP Integration Testing
- Run Jane server: `npm start`
- Test with Claude Desktop by adding to MCP config
- Test direct MCP communication with `tests/test-mcp-client.cjs`