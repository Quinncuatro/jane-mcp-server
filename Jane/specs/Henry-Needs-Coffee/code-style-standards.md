---
title: Henry Needs Coffee - Code Style & Standards
description: >-
  Comprehensive code style and standards specification for the Henry Needs
  Coffee project, covering TypeScript, Astro components, CSS, and documentation
  standards.
author: Claude Code
tags:
  - code-style
  - standards
  - typescript
  - astro
  - css
  - documentation
createdAt: '2025-07-01T23:15:56.549Z'
updatedAt: '2025-07-01T23:15:56.549Z'
---
# Henry Needs Coffee - Code Style & Standards

## Overview

This document establishes consistent coding standards for the Henry Needs Coffee project to ensure maintainability, readability, and team collaboration. All code should follow these standards to maintain consistency across the codebase.

## General Principles

### Core Values
1. **Consistency**: Code should look like it was written by a single person
2. **Readability**: Code should be self-documenting and easy to understand
3. **Maintainability**: Code should be easy to modify and extend
4. **Performance**: Code should be efficient and optimized
5. **Accessibility**: Code should support all users and devices

### Code Review Standards
- All code changes require review before merging
- Code must pass all automated checks (linting, formatting, tests)
- Documentation must be updated with code changes
- Performance impact should be considered for all changes

## TypeScript Standards

### Configuration
```json
// tsconfig.json - Use Astro's strict configuration
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

### Type Definitions
```typescript
// ✅ Good: Clear interface definitions
interface Props {
  title: string;
  description?: string;
  activeNav: 'home' | 'blog' | 'digital-garden' | 'resume' | 'talks-and-pods' | 'contact';
  commandPrompt?: string;
  typingSpeed?: number;
}

// ✅ Good: Proper type imports
import type { CollectionEntry } from 'astro:content';

// ✅ Good: Generic type usage
type BlogPost = CollectionEntry<'blog'>;
type GardenEntry = CollectionEntry<'garden'>;
```

### Naming Conventions
```typescript
// ✅ Good: PascalCase for interfaces and types
interface ComponentProps { }
type BlogPostData = { };

// ✅ Good: camelCase for variables and functions  
const pageTitle = 'Home';
const formatDate = (date: Date) => { };

// ✅ Good: SCREAMING_SNAKE_CASE for constants
const MAX_EXCERPT_LENGTH = 150;
const DEFAULT_TYPING_SPEED = 10;

// ✅ Good: Descriptive boolean prefixes
const isLoading = false;
const hasError = true;
const shouldRender = true;
```

### Function Standards
```typescript
// ✅ Good: Clear function signatures with JSDoc
/**
 * Format a date using the standard blog/article format
 * @param date - The date to format
 * @returns Formatted date (e.g., "June 9, 2025")
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ✅ Good: Arrow functions for simple operations
const padZero = (n: number): string | number => n < 10 ? "0" + n : n;

// ✅ Good: Async/await over promises
async function loadContent(): Promise<BlogPost[]> {
  const posts = await getCollection('blog');
  return posts.filter(post => !post.data.draft);
}
```

### Error Handling
```typescript
// ✅ Good: Proper error handling
try {
  const entry = await getEntry('blog', slug);
  if (!entry) {
    throw new Error(`Blog post not found: ${slug}`);
  }
  return entry;
} catch (error) {
  console.error('Failed to load blog post:', error);
  throw error;
}

// ✅ Good: Type-safe error handling
function parseDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}
```

## Astro Component Standards

### Component Structure
```astro
---
// ✅ Good: Clear component structure
import ComponentName from '../components/ComponentName.astro';
import { utilityFunction } from '../utils/utilities.js';

// Props interface at the top
interface Props {
  title: string;
  isActive?: boolean;
}

// Destructure props with defaults
const { 
  title, 
  isActive = false 
} = Astro.props;

// Component logic
const formattedTitle = title.toUpperCase();
---

<!-- ✅ Good: Semantic HTML structure -->
<article class="component-wrapper" data-active={isActive}>
  <h1>{formattedTitle}</h1>
  <slot />
</article>

<style>
  /* ✅ Good: Component-specific styles */
  .component-wrapper {
    padding: var(--space-md);
  }
  
  .component-wrapper[data-active="true"] {
    background-color: var(--color-primary);
  }
</style>
```

### Props and Interfaces
```astro
---
// ✅ Good: Comprehensive Props interface
interface Props {
  // Required props first
  title: string;
  content: string;
  
  // Optional props with defaults
  className?: string;
  isVisible?: boolean;
  size?: 'small' | 'medium' | 'large';
  
  // Event handlers (if needed)
  onClick?: () => void;
}

// ✅ Good: Props destructuring with clear defaults
const { 
  title,
  content,
  className = '',
  isVisible = true,
  size = 'medium',
  onClick
} = Astro.props;
---
```

### Slot Usage
```astro
---
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!-- ✅ Good: Named slots for flexible composition -->
<div class="layout">
  <header>
    <slot name="header">
      <h1>{title}</h1>
    </slot>
  </header>
  
  <main>
    <slot />
  </main>
  
  <aside>
    <slot name="sidebar" />
  </aside>
</div>
```

### Component Imports
```astro
---
// ✅ Good: Organized imports
// External libraries first
import { getCollection } from 'astro:content';

// Layout components
import Layout from '../layouts/Layout.astro';
import TerminalLayout from '../layouts/TerminalLayout.astro';

// UI components (alphabetical)
import Footer from '../components/Footer.astro';
import Header from '../components/Header.astro';
import NavBar from '../components/NavBar.astro';

// Utilities
import { formatDate } from '../utils/dateUtils.js';
---
```

## CSS Standards

### CSS Custom Properties (Design System)
```css
/* ✅ Good: Organized CSS variables */
:root {
  /* Color System - Organized by purpose */
  --color-primary: #355366;
  --color-primary-dark: #274050;
  --color-primary-light: #87b4c5;
  --color-secondary: #005096;
  
  /* Background Colors */
  --color-bg: #355366;
  --color-card-bg: #1e1e1e;
  --color-terminal-bg: #222222;
  
  /* Text Colors */
  --color-text: #ffffff;
  --color-text-muted: #888888;
  --color-text-light: #cccccc;
  
  /* Typography Scale */
  --font-family-mono: Menlo, Monaco, "Consolas", "Courier New", "Courier";
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  
  /* Spacing Scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  /* Layout */
  --container-width: 1200px;
  --border-radius: 4px;
}
```

### CSS Naming Conventions (BEM-inspired)
```css
/* ✅ Good: Consistent naming patterns */
.terminal-window { }
.terminal-window__header { }
.terminal-window__content { }
.terminal-window--fullscreen { }

/* ✅ Good: Component-based naming */
.typing-effect { }
.typing-effect__cursor { }
.typing-effect__text { }
.typing-effect--active { }

/* ✅ Good: Utility classes */
.u-text-center { text-align: center; }
.u-margin-top-lg { margin-top: var(--space-lg); }
.u-hidden { display: none; }
```

### CSS Organization
```css
/* ✅ Good: CSS organization within components */
<style>
  /* 1. Layout */
  .component {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  
  /* 2. Typography */
  .component h1 {
    font-size: var(--font-size-xl);
    font-family: var(--font-family-mono);
  }
  
  /* 3. Colors */
  .component {
    background-color: var(--color-terminal-bg);
    color: var(--color-text);
  }
  
  /* 4. Responsive (mobile-first) */
  @media (min-width: 768px) {
    .component {
      flex-direction: row;
    }
  }
  
  /* 5. States */
  .component:hover {
    background-color: var(--color-primary-dark);
  }
  
  .component.is-active {
    border-color: var(--color-primary);
  }
</style>
```

### Responsive Design Standards
```css
/* ✅ Good: Mobile-first approach */
.terminal-window {
  /* Mobile styles (default) */
  padding: var(--space-sm);
  font-size: var(--font-size-sm);
}

/* Tablet styles */
@media (min-width: 768px) {
  .terminal-window {
    padding: var(--space-md);
    font-size: var(--font-size-md);
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .terminal-window {
    padding: var(--space-lg);
    max-width: var(--container-width);
    margin: 0 auto;
  }
}
```

## JavaScript/TypeScript Utility Standards

### File Organization
```javascript
// ✅ Good: File header with purpose
/**
 * Date utility functions
 * Handles date formatting and terminal-style date display
 */

// ✅ Good: Clear exports
export { formatDate, getTerminalDateFormat, padZero };

// ✅ Good: Function organization
// Main functions first
export function formatDate(date) { }
export function getTerminalDateFormat() { }

// Helper functions last
function padZero(n) { }
```

### Function Documentation
```javascript
/**
 * Create an excerpt from content text
 * @param {string} content - The full content text
 * @param {number} maxLength - Maximum length of excerpt (default: 150)
 * @param {string} suffix - Text to append when truncated (default: '...')
 * @returns {string} Formatted excerpt
 * @example
 * createExcerpt('Long content here', 50)
 * // Returns: 'Long content here...'
 */
export function createExcerpt(content, maxLength = 150, suffix = '...') {
  if (content.length <= maxLength) {
    return content;
  }
  
  return content.substring(0, maxLength).trim() + suffix;
}
```

### Error Handling Standards
```javascript
// ✅ Good: Defensive programming
export function formatDate(date) {
  if (!date) {
    throw new Error('Date parameter is required');
  }
  
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    throw new Error(`Invalid date provided: ${date}`);
  }
}

// ✅ Good: Graceful fallbacks
export function createExcerpt(content, maxLength = 150) {
  // Handle edge cases gracefully
  if (typeof content !== 'string') {
    console.warn('createExcerpt: content must be a string, got:', typeof content);
    return '';
  }
  
  if (maxLength < 1) {
    console.warn('createExcerpt: maxLength must be positive, got:', maxLength);
    return content;
  }
  
  // Main logic
  if (content.length <= maxLength) {
    return content;
  }
  
  return content.substring(0, maxLength).trim() + '...';
}
```

## Content and Markdown Standards

### Frontmatter Standards
```yaml
---
# ✅ Good: Consistent frontmatter structure
title: "Clear, Descriptive Title"           # Required: String
category: "Technology"                       # Optional: String
date: "2025-07-01"                          # Required: YYYY-MM-DD format
type: "blog"                                # Default: "blog" | "garden"
desc: "Clear description for SEO and previews"  # Required: String
draft: false                                # Optional: Boolean, default false
---
```

### Markdown Content Standards
```markdown
# Main Title (H1 - Only One Per Document)

Brief introduction paragraph that sets context for the content.

## Section Heading (H2)

Content with proper paragraph breaks. Each paragraph should focus on a single idea or concept.

### Subsection (H3)

When you need deeper hierarchy, use H3. Avoid going deeper than H3 unless absolutely necessary.

#### Code Examples

Use descriptive language tags for code blocks:

```typescript
// ✅ Good: Clear code with comments
interface BlogPostProps {
  title: string;
  content: string;
}
```

```bash
# ✅ Good: Shell commands with comments
npm run build  # Build for production
npm run dev    # Start development server
```

#### Lists

- Use bullet points for unordered lists
- Keep items parallel in structure
- Use consistent punctuation

1. Use numbered lists for sequences
2. Each item should be actionable or logical
3. Maintain consistent formatting

#### Links and References

- [Descriptive link text](https://example.com) for external links
- Use relative links for internal content: [Other Post](./other-post)
- Reference images with descriptive alt text
```

### Image Standards
```markdown
<!-- ✅ Good: Descriptive alt text and organized paths -->
![Terminal window showing command output](../assets/blog-images/post-name/terminal-screenshot.jpg)

<!-- ✅ Good: Organized image directory structure -->
src/assets/blog-images/
├── driving-claude-code-part-1/
│   ├── claude-code-interface.jpg
│   └── workflow-diagram.png
└── website-1-signal-boost/
    └── signal-boost-yaml-render.jpg
```

## Documentation Standards

### JSDoc Standards
```javascript
/**
 * Format a date for display in blog posts
 * 
 * Takes a Date object or date string and returns a formatted string
 * suitable for display in blog post headers and content.
 * 
 * @param {Date|string} date - The date to format
 * @throws {Error} When date parameter is invalid
 * @returns {string} Formatted date string (e.g., "July 1, 2025")
 * 
 * @example
 * // Format a Date object
 * formatDate(new Date('2025-07-01'))
 * // Returns: "July 1, 2025"
 * 
 * @example
 * // Format a date string
 * formatDate('2025-07-01')
 * // Returns: "July 1, 2025"
 * 
 * @since 1.0.0
 */
export function formatDate(date) {
  // Implementation...
}
```

### README Standards
```markdown
# Project Name

Brief description of what the project does and who it's for.

## Quick Start

```bash
# The absolute minimum to get started
npm install
npm run dev
```

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

## Installation

Step-by-step installation instructions.

## Usage

Common usage examples with code samples.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Contributing

Guidelines for contributing to the project.

## License

License information.
```

### Component Documentation
```astro
---
/**
 * TypingEffect Component
 * 
 * Animates typing text in a terminal-style interface. Simulates the appearance
 * of text being typed character by character, creating an authentic terminal
 * experience for the site's retro computing theme.
 * 
 * @component
 * @example
 * <TypingEffect command="whoami" typingSpeed={15}>
 *   <p>Content that appears after typing animation</p>
 * </TypingEffect>
 */

interface Props {
  /** The command text to animate typing for */
  command: string;
  /** Delay before typing starts in milliseconds (default: 300) */
  initialDelay?: number;
  /** Typing speed modifier - higher values = faster typing (default: 10) */
  typingSpeed?: number;
}

const { 
  command, 
  initialDelay = 300, 
  typingSpeed = 10 
} = Astro.props;
---
```

## File and Directory Standards

### Naming Conventions
```
src/
├── components/
│   ├── Header.astro              # PascalCase for components
│   ├── TypingEffect.astro        # Descriptive, not abbreviated
│   └── PostCard.astro            # Clear purpose
├── layouts/
│   ├── Layout.astro              # Base layout
│   ├── TerminalLayout.astro      # Specific purpose
│   └── BlogPostLayout.astro      # Content-specific
├── utils/
│   ├── dateUtils.js              # camelCase for utilities
│   ├── stringUtils.js            # Grouped by functionality
│   └── collectionUtils.js        # Descriptive purpose
├── content/
│   ├── blog/
│   │   ├── my-first-post.md      # kebab-case for content
│   │   └── learning-astro.md     # Descriptive slugs
│   └── garden/
│       ├── tilling-the-soil.md   # Creative but clear
│       └── website-to-dos.md     # Descriptive purpose
└── assets/
    ├── astro.svg                 # lowercase for assets
    └── blog-images/
        └── post-name/            # Match content slug
            ├── screenshot.jpg    # Descriptive names
            └── diagram.png       # Clear purpose
```

### File Organization Rules
1. **Group by feature**: Related files should be grouped together
2. **Clear hierarchy**: Directory structure should reflect content hierarchy
3. **Consistent naming**: Follow established patterns throughout
4. **No deep nesting**: Avoid directories more than 3 levels deep
5. **Descriptive names**: Names should indicate purpose and content

## Code Quality Standards

### Linting and Formatting (Recommended)
```json
// .eslintrc.json (Future implementation)
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:astro/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

```json
// .prettierrc (Future implementation)
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [
    {
      "files": "*.astro",
      "options": {
        "parser": "astro"
      }
    }
  ]
}
```

### Performance Standards
```javascript
// ✅ Good: Efficient data operations
const publishedPosts = await getCollection('blog', ({ data }) => !data.draft);
const sortedPosts = publishedPosts.sort((a, b) => 
  b.data.date.valueOf() - a.data.date.valueOf()
);

// ✅ Good: Lazy loading for heavy operations
const processedContent = await import('../utils/heavyProcessor.js')
  .then(module => module.processContent(content));

// ✅ Good: Memoization for expensive calculations
const memoizedCalculation = useMemo(() => 
  expensiveCalculation(data), [data]
);
```

### Accessibility Standards
```astro
---
// ✅ Good: Semantic HTML and accessibility
---
<article class="blog-post" role="article">
  <header>
    <h1 id="post-title">{title}</h1>
    <time datetime={date.toISOString()}>{formatDate(date)}</time>
  </header>
  
  <main aria-labelledby="post-title">
    <slot />
  </main>
  
  <nav aria-label="Post navigation">
    <a href="/blog" aria-label="Back to blog listing">← Back to Blog</a>
  </nav>
</article>

<style>
  /* ✅ Good: Focus management */
  .blog-post a:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  
  /* ✅ Good: Sufficient contrast ratios */
  .blog-post {
    color: var(--color-text); /* Ensure 4.5:1 contrast ratio */
  }
</style>
```

## Version Control Standards

### Commit Message Format
```
type(scope): brief description

Optional longer description explaining what and why.

- List specific changes if helpful
- Reference issue numbers if applicable

Closes #123
```

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Branch Naming
```
feature/add-search-functionality
fix/mobile-navigation-bug
docs/update-readme
refactor/simplify-date-utils
```

## Security Standards

### Content Security
```javascript
// ✅ Good: Validate user input (if any)
function validateSlug(slug) {
  if (typeof slug !== 'string') {
    throw new Error('Slug must be a string');
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('Invalid slug format');
  }
  
  return slug;
}

// ✅ Good: Sanitize content when necessary
function sanitizeContent(content) {
  // Use appropriate sanitization library
  return DOMPurify.sanitize(content);
}
```

### Build Security
```javascript
// ✅ Good: Environment variable handling
const apiKey = import.meta.env.API_KEY;
if (!apiKey && import.meta.env.PROD) {
  throw new Error('API_KEY environment variable is required in production');
}

// ✅ Good: Secure defaults
const config = {
  allowedOrigins: import.meta.env.ALLOWED_ORIGINS?.split(',') || ['localhost'],
  secure: import.meta.env.PROD
};
```

## Testing Standards

### Test Naming
```javascript
// ✅ Good: Descriptive test names
describe('formatDate', () => {
  it('formats Date objects correctly', () => {
    // Test implementation
  });
  
  it('handles string dates', () => {
    // Test implementation
  });
  
  it('throws error for invalid dates', () => {
    // Test implementation
  });
});
```

### Test Organization
```javascript
// ✅ Good: Clear test structure
describe('Component: TypingEffect', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      // Test implementation
    });
    
    it('renders with custom props', () => {
      // Test implementation
    });
  });
  
  describe('behavior', () => {
    it('starts typing animation after initial delay', () => {
      // Test implementation
    });
  });
});
```

## Enforcement and Tools

### Current State
- ⚠️ **No automated enforcement** currently configured
- Manual code review for standards compliance
- TypeScript provides type safety

### Recommended Tools
1. **ESLint**: Code linting and style enforcement
2. **Prettier**: Automatic code formatting
3. **Husky**: Git hooks for pre-commit checks
4. **lint-staged**: Run linters on staged files only

### Implementation Priority
1. **High**: TypeScript strict mode (already implemented)
2. **Medium**: ESLint for code quality
3. **Medium**: Prettier for formatting consistency
4. **Low**: Pre-commit hooks for automation

## Migration Guide

### From Current State
1. **Review existing code** against these standards
2. **Identify priority areas** for standardization
3. **Implement tools gradually** to avoid disruption
4. **Update documentation** as standards are adopted

### Future Improvements
1. **Automated formatting**: Set up Prettier
2. **Linting rules**: Configure ESLint
3. **Pre-commit hooks**: Ensure standards compliance
4. **Documentation generation**: Automated API docs

This living document should be updated as the project evolves and new patterns emerge.
