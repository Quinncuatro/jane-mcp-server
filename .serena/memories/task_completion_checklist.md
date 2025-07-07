# Jane MCP Server - Task Completion Checklist

## Before Submitting Any Code Changes

### 1. Code Quality Checks
- [ ] Run `npm run lint` and fix all linting errors
- [ ] Ensure TypeScript compilation succeeds with `npm run build`
- [ ] Verify no TypeScript errors in IDE/editor

### 2. Testing Requirements
- [ ] Run full test suite with `npm test` and ensure all tests pass
- [ ] Add tests for any new functionality
- [ ] Update existing tests if modifying behavior
- [ ] Run diagnostics with `npx tsx tests/jane-diagnostics.ts` to verify system health

### 3. Functional Verification
- [ ] Test MCP server startup with `npm start`
- [ ] Verify document operations work correctly
- [ ] Check that Jane directory structure is created properly
- [ ] Test search functionality if modified

### 4. Documentation Updates
- [ ] Update README.md if adding new features or changing setup
- [ ] Update tool descriptions if modifying MCP tools
- [ ] Update CLAUDE.md if changing project structure or major functionality

### 5. Docker & Deployment (if applicable)
- [ ] Test Docker build with `docker build -t jane-test .`
- [ ] Verify container runs correctly with `docker run -i jane-test`
- [ ] Test docker-compose setup if modifying configuration

### 6. Git & Version Control
- [ ] Commit with descriptive messages following project patterns
- [ ] Ensure no sensitive data (keys, passwords) in commits
- [ ] Tag releases appropriately if making version changes

## Development Workflow Best Practices
- Always test locally before committing
- Use feature branches for significant changes
- Keep commits focused and atomic
- Update version numbers in package.json for releases
- Document breaking changes in commit messages

## Common Issues to Check
- Path resolution working across different environments
- File permissions on Jane directory structure
- MCP protocol compliance for tools and resources
- Error handling and proper logging
- Memory usage with large document sets