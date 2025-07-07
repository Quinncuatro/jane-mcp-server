---
title: Development Workflow Specification
description: 'Git workflow, code review, and development practices'
author: Claude Code
tags:
  - workflow
  - git
  - development
  - code-review
createdAt: '2025-07-01T23:19:24.615Z'
updatedAt: '2025-07-01T23:19:24.615Z'
---
# Development Workflow Specification

## Git Workflow

### Branch Strategy
```
main (production)
├── feature/add-search
├── fix/mobile-nav-bug  
├── docs/update-readme
└── content/new-blog-post
```

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes  
- `docs/description` - Documentation
- `content/description` - Content updates
- `refactor/description` - Code improvements

### Workflow Steps
1. **Create branch** from main
2. **Make changes** locally
3. **Test thoroughly** 
4. **Push branch** to GitHub
5. **Create PR** with description
6. **Review process**
7. **Merge to main** (triggers deploy)

## Commit Standards

### Commit Message Format
```
type(scope): brief description

Optional longer explanation of what and why.

- Specific changes if helpful
- Reference issues: Closes #123
```

### Commit Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting changes
- `refactor` - Code refactoring
- `content` - Content updates
- `chore` - Maintenance tasks

### Examples
```bash
feat(blog): add search functionality

fix(mobile): resolve navigation menu bug on iOS
Fixes dropdown not closing on mobile Safari

docs: update installation instructions

content: add new blog post about Astro islands
```

## Code Review Process

### PR Requirements
- **Clear description** of changes
- **Local testing** completed
- **Build succeeds** locally
- **No TypeScript errors**
- **Content renders correctly**

### Review Checklist
- [ ] Code follows style standards
- [ ] TypeScript types are correct
- [ ] Content validates against schemas
- [ ] Images are optimized
- [ ] Documentation updated if needed
- [ ] No console errors
- [ ] Responsive design works

### Review Guidelines
- **Be constructive** in feedback
- **Test suggestions** when possible
- **Ask questions** for clarification
- **Approve quickly** for simple changes
- **Request changes** with specific feedback

## Development Environment

### Setup Requirements
```bash
# Prerequisites
node --version  # v18.x
npm --version   # 9.x+

# Project setup
git clone <repository>
cd henry-needs-coffee
npm install
npm run dev
```

### Development Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run preview  # Preview production build
npm test         # Run tests (future)
```

### Environment Variables
Currently no environment variables required for development.

## Testing Workflow

### Pre-commit Testing
```bash
# Manual testing checklist
npm run build    # ✅ Build succeeds
npm run preview  # ✅ Production build works
# ✅ Navigate through site
# ✅ Check responsive design
# ✅ Verify new content renders
# ✅ Test terminal animations
```

### Content Testing
- **Frontmatter validation**: Zod schemas catch errors
- **Link checking**: Manual verification of links
- **Image loading**: Verify all images display
- **Mobile testing**: Check responsive design

## Release Process

### Deployment Flow
```
Local Development → PR → Review → Merge → Auto Deploy
```

### Pre-release Checklist
- [ ] All tests pass locally
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Performance impact considered

### Post-release Verification
1. **Check deployment**: Netlify build succeeded
2. **Smoke test**: Verify site loads correctly
3. **Content check**: New content displays properly
4. **Performance check**: No significant regressions

## Collaboration Guidelines

### Communication
- **PR descriptions**: Clear explanation of changes
- **Issue tracking**: Use GitHub issues for bugs/features
- **Code comments**: Explain complex logic
- **Documentation**: Update specs as code evolves

### Code Ownership
- **Main branch**: Protected, requires review
- **Architecture decisions**: Document in specs
- **Breaking changes**: Discuss before implementation
- **Dependencies**: Consider impact before adding

## Emergency Procedures

### Hotfix Process
1. **Create hotfix branch** from main
2. **Make minimal fix**
3. **Test thoroughly**
4. **Fast-track review**
5. **Deploy immediately**
6. **Follow up** with proper testing

### Rollback Process
```bash
# If needed, rollback via Netlify
# 1. Go to Netlify deploys
# 2. Find last working deploy
# 3. Click "Publish deploy"
# 4. Fix issue in separate PR
```

## Development Best Practices

### Code Quality
- **TypeScript strict mode**: Catch errors early
- **Component composition**: Reusable, testable components
- **Performance awareness**: Consider impact of changes
- **Accessibility**: WCAG compliance by default

### Content Quality
- **Consistent formatting**: Follow markdown standards
- **SEO optimization**: Proper titles and descriptions
- **Image optimization**: Compress before committing
- **Link verification**: Check all external links

### Documentation
- **Update specs**: Keep documentation current
- **Code comments**: Explain non-obvious logic
- **Commit messages**: Clear change descriptions
- **PR descriptions**: Explain context and decisions

## Tool Configuration

### VS Code Settings (Recommended)
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "files.associations": {
    "*.astro": "astro"
  }
}
```

### Git Configuration
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
git config push.default simple
git config pull.rebase true
```

This workflow ensures code quality while maintaining development velocity.
