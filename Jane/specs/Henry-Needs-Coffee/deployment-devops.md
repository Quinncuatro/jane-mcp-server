---
title: Deployment & DevOps Specification
description: >-
  Deployment pipeline, CI/CD, and DevOps practices for the Henry Needs Coffee
  website
author: Claude Code
tags:
  - deployment
  - netlify
  - cicd
  - devops
createdAt: '2025-07-01T23:16:56.072Z'
updatedAt: '2025-07-01T23:16:56.072Z'
---
# Deployment & DevOps Specification

## Deployment Architecture

### Netlify Configuration
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18
- **Domain**: henryneeds.coffee
- **Auto-deploy**: `main` branch triggers production deploy

### Build Process
1. **Install dependencies**: `npm ci`
2. **TypeScript compilation**: Astro handles automatically
3. **Content processing**: Markdown → HTML via Astro
4. **Asset optimization**: Images, CSS, JS bundling
5. **Static generation**: All pages pre-rendered
6. **Deploy**: Files uploaded to Netlify CDN

## Environments

### Development
- **URL**: `http://localhost:4321`
- **Command**: `npm run dev`
- **Features**: Hot reload, source maps, dev tools

### Production
- **URL**: `https://henryneeds.coffee`
- **Source**: `main` branch auto-deploy
- **Features**: Optimized assets, CDN delivery

### Preview
- **URL**: Auto-generated for PRs
- **Source**: Any branch/PR
- **Purpose**: Review changes before merge

## Git Workflow

### Branch Strategy
- **main**: Production branch, protected
- **feature/***: New features
- **fix/***: Bug fixes
- **docs/***: Documentation updates

### Deployment Flow
```
Local Development → Push to Branch → PR Review → Merge to Main → Auto Deploy
```

### Pre-deployment Checks
- Build succeeds locally (`npm run build`)
- All links and images work
- Content renders correctly
- No TypeScript errors

## Monitoring & Alerts

### Build Monitoring
- **Build Status**: Netlify dashboard
- **Deploy Logs**: Available in Netlify interface
- **Build Time**: Currently ~30-60 seconds
- **Failed Builds**: Email notifications enabled

### Performance Monitoring
- **Core Web Vitals**: Monitor via Netlify Analytics
- **Lighthouse**: Periodic manual checks
- **Load Time**: Target < 2 seconds
- **CDN Performance**: Global edge caching

### Error Handling
- **Build Failures**: Email notifications
- **404 Handling**: Netlify redirects to `/`
- **Content Errors**: TypeScript/Zod validation

## Configuration Files

### netlify.toml
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### package.json scripts
```json
{
  "dev": "astro dev",
  "build": "astro build", 
  "preview": "astro preview"
}
```

## Security & Best Practices

### Repository Security
- No secrets in repository
- Environment variables via Netlify UI
- Dependabot enabled for dependency updates

### Build Security
- Node.js 18 LTS (security updates)
- NPM audit on dependencies
- TypeScript for compile-time safety

### Content Security
- Static generation (no server vulnerabilities)
- Content validation via Zod schemas
- Local asset hosting (no external dependencies)

## Performance Optimization

### Build Optimization
- **Asset bundling**: Automatic via Astro
- **Image optimization**: Manual (recommend automation)
- **CSS optimization**: Critical CSS inlined
- **JavaScript**: Minimal by default

### Deployment Optimization
- **CDN**: Global Netlify edge network
- **Caching**: Long-term caching for assets
- **Compression**: Gzip/Brotli enabled
- **HTTP/2**: Automatic support

## Backup & Recovery

### Content Backup
- **Primary**: Git repository (complete history)
- **Images**: Stored in repository
- **Database**: N/A (static site)

### Disaster Recovery
- **Repository Loss**: Clone from GitHub
- **Netlify Issues**: Rebuild from any Git ref
- **Content Loss**: Restore from Git history
- **Domain Issues**: DNS reconfiguration

## Future Enhancements

### CI/CD Improvements
- **Testing Pipeline**: Add automated testing before deploy
- **Linting**: ESLint/Prettier checks
- **Performance Budget**: Lighthouse CI integration
- **Security Scanning**: Dependency vulnerability checks

### Monitoring Enhancements
- **Error Tracking**: Consider Sentry integration
- **Analytics**: Enhanced visitor analytics
- **Performance**: Real User Monitoring (RUM)
- **Uptime**: External uptime monitoring

### Infrastructure Considerations
- **CDN**: Current Netlify CDN sufficient
- **Scaling**: Static site scales automatically
- **Costs**: Current free tier adequate
- **Backup**: Consider automated external backup
