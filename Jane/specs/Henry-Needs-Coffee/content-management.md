---
title: Content Management Specification
description: Guidelines for creating and managing blog posts and digital garden content
author: Claude Code
tags:
  - content
  - markdown
  - blog
  - digital-garden
createdAt: '2025-07-01T23:16:55.808Z'
updatedAt: '2025-07-01T23:16:55.808Z'
---
# Content Management Specification

## Content Types

### Blog Posts (`src/content/blog/`)
- **Purpose**: Polished technical articles and tutorials
- **Naming**: `kebab-case-title.md`
- **Frontmatter**:
```yaml
---
title: "Post Title"
category: "Category"
date: "YYYY-MM-DD"
type: "blog"
desc: "SEO description"
draft: false
---
```

### Digital Garden (`src/content/garden/`)
- **Purpose**: Work-in-progress thoughts, evolving ideas
- **Naming**: `descriptive-slug.md`
- **Frontmatter**:
```yaml
---
title: "Entry Title"
date: "YYYY-MM-DD"
type: "garden"
desc: "Optional description"
draft: false
---
```

## Content Creation Workflow

1. **Create markdown file** in appropriate directory
2. **Add required frontmatter** using schemas above
3. **Write content** following markdown standards
4. **Add images** to `src/assets/blog-images/[slug]/`
5. **Preview locally** with `npm run dev`
6. **Commit and push** to trigger deployment

## Image Management

### Organization
```
src/assets/blog-images/
├── post-slug/
│   ├── feature-image.jpg
│   ├── screenshot.png
│   └── diagram.svg
```

### Guidelines
- Create subdirectory matching post slug
- Use descriptive filenames
- Optimize for web (< 500KB per image)
- Include alt text in markdown

## Content Standards

### Markdown Structure
```markdown
# Title (H1 - once per document)

Intro paragraph setting context.

## Main Section (H2)

Content with clear paragraphs.

### Subsection (H3)

Avoid going deeper than H3.

```language
// Code blocks with language tags
const example = 'clear code examples';
```

- Bullet points for lists
- Parallel structure
- Consistent formatting
```

### Writing Guidelines
- **Clear titles**: Descriptive, searchable
- **Strong intros**: Hook readers immediately  
- **Logical structure**: H2 for main sections, H3 for subsections
- **Code examples**: Always include language tags
- **Links**: Descriptive text, prefer relative for internal

## Schema Validation

Content collections use Zod schemas for validation:

```typescript
// Blog schema enforces:
- title: string (required)
- date: Date (required)
- category: string (optional)
- desc: string (required)
- draft: boolean (default: false)

// Garden schema enforces:
- title: string (required)
- date: Date (required)
- desc: string (optional)
- draft: boolean (default: false)
```

Invalid frontmatter will fail the build.

## Content Queries

```javascript
// Get all published posts
const posts = await getCollection('blog', ({ data }) => !data.draft);

// Sort by date (newest first)
const sorted = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

// Get single post
const post = await getEntry('blog', 'post-slug');
```

## SEO Considerations

- **Title**: Clear, keyword-rich (< 60 chars)
- **Description**: Compelling summary (< 160 chars)
- **Headings**: Logical hierarchy for crawlers
- **Images**: Always include alt text
- **URLs**: Clean slugs from filenames
