---
title: Henry Needs Coffee - Testing Strategy
description: >-
  Comprehensive testing strategy for the Henry Needs Coffee Astro website,
  including unit testing, component testing, integration testing, and end-to-end
  testing approaches.
author: Claude Code
tags:
  - testing
  - vitest
  - playwright
  - quality-assurance
  - automation
createdAt: '2025-07-01T23:13:58.383Z'
updatedAt: '2025-07-01T23:13:58.383Z'
---
# Henry Needs Coffee - Testing Strategy

## Current State

⚠️ **No testing framework is currently configured**

The project currently relies on manual testing and verification. This document outlines a comprehensive testing strategy to improve code quality, catch regressions, and ensure reliable deployments.

## Testing Philosophy

### Goals
1. **Prevent Regressions**: Catch breaking changes before deployment
2. **Improve Confidence**: Safe refactoring and feature additions
3. **Document Behavior**: Tests serve as living documentation
4. **Fast Feedback**: Quick development cycles with immediate error detection

### Testing Pyramid Strategy
```
    ┌─────────────────┐
    │   E2E Tests     │  ← Few, High-level, Slow
    │                 │
    ├─────────────────┤
    │ Integration     │  ← Some, Medium-level
    │     Tests       │
    ├─────────────────┤
    │  Component/     │  ← Many, Fast, Isolated
    │  Unit Tests     │
    └─────────────────┘
```

## Testing Framework Selection

### Primary Testing Framework: Vitest
**Why Vitest?**
- ⚡ **Fast**: Native ESM support, parallel test execution
- 🔧 **Astro Integration**: Official Astro testing support via `@astro/test-utils`
- 📦 **TypeScript Native**: Built-in TypeScript support
- 🧩 **Vite Ecosystem**: Shares configuration with Astro's Vite setup
- 🎯 **Jest Compatible**: Familiar API for developers

### End-to-End Testing: Playwright
**Why Playwright?**
- 🌐 **Cross-browser**: Chrome, Firefox, Safari support
- 📱 **Mobile Testing**: Mobile viewport testing
- 🎬 **Visual Testing**: Screenshot and video capture
- ⚡ **Fast**: Parallel test execution
- 🔄 **Reliable**: Auto-wait and retry mechanisms

## Testing Architecture

### Test Directory Structure
```
tests/
├── unit/                     # Unit tests
│   ├── utils/               # Utility function tests
│   │   ├── dateUtils.test.js
│   │   ├── stringUtils.test.js
│   │   └── collectionUtils.test.js
│   └── content/             # Content schema tests
│       └── config.test.ts
├── component/               # Component tests
│   ├── Header.test.astro
│   ├── TypingEffect.test.astro
│   ├── PostCard.test.astro
│   └── layouts/
│       ├── Layout.test.astro
│       └── TerminalLayout.test.astro
├── integration/             # Integration tests
│   ├── content-collections.test.js
│   ├── routing.test.js
│   └── build.test.js
├── e2e/                     # End-to-end tests
│   ├── homepage.spec.js
│   ├── blog.spec.js
│   ├── navigation.spec.js
│   └── responsive.spec.js
├── fixtures/                # Test data and fixtures
│   ├── blog-posts/
│   ├── garden-entries/
│   └── images/
└── helpers/                 # Test utilities
    ├── astro-test-setup.js
    └── test-data.js
```

## Unit Testing Strategy

### Utility Functions Testing
Target: 100% coverage for utility functions

#### Date Utils Testing (`src/utils/dateUtils.js`)
```javascript
// tests/unit/utils/dateUtils.test.js
import { describe, it, expect, vi } from 'vitest';
import { formatDate, getTerminalDateFormat, padZero } from '../../../src/utils/dateUtils.js';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2025-07-01');
      expect(formatDate(date)).toBe('July 1, 2025');
    });

    it('handles string dates', () => {
      expect(formatDate('2025-07-01')).toBe('July 1, 2025');
    });
  });

  describe('padZero', () => {
    it('adds leading zero for single digits', () => {
      expect(padZero(5)).toBe('05');
      expect(padZero(0)).toBe('00');
    });

    it('preserves double digits', () => {
      expect(padZero(10)).toBe(10);
      expect(padZero(23)).toBe(23);
    });
  });

  describe('getTerminalDateFormat', () => {
    it('formats current date in terminal style', () => {
      // Mock current date
      vi.setSystemTime(new Date('2025-07-01 15:30:45'));
      
      const result = getTerminalDateFormat();
      expect(result).toMatch(/Current login: Tue Jul 1 15:30:45 2025/);
    });
  });
});
```

#### String Utils Testing (`src/utils/stringUtils.js`)
```javascript
// tests/unit/utils/stringUtils.test.js
import { describe, it, expect } from 'vitest';
import { createExcerpt, simpleExcerpt, slugify } from '../../../src/utils/stringUtils.js';

describe('stringUtils', () => {
  describe('createExcerpt', () => {
    it('creates excerpt from content', () => {
      const content = 'This is a long piece of content that should be truncated.';
      const excerpt = createExcerpt(content, 20);
      expect(excerpt).toBe('This is a long piece...');
    });

    it('preserves content shorter than limit', () => {
      const content = 'Short content';
      const excerpt = createExcerpt(content, 50);
      expect(excerpt).toBe('Short content');
    });
  });

  describe('slugify', () => {
    it('converts title to URL-friendly slug', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
      expect(slugify('Complex Title: With Symbols & Stuff')).toBe('complex-title-with-symbols-stuff');
    });
  });
});
```

### Content Schema Testing
```typescript
// tests/unit/content/config.test.ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { collections } from '../../../src/content/config';

describe('Content Collections', () => {
  describe('blog collection schema', () => {
    const blogSchema = collections.blog.schema;

    it('validates correct blog post data', () => {
      const validData = {
        title: 'Test Post',
        date: '2025-07-01',
        category: 'Tech',
        type: 'blog',
        desc: 'Test description',
        draft: false
      };

      expect(() => blogSchema.parse(validData)).not.toThrow();
    });

    it('rejects invalid data', () => {
      const invalidData = {
        title: 123, // Should be string
        date: 'invalid-date',
        desc: null // Should be string
      };

      expect(() => blogSchema.parse(invalidData)).toThrow();
    });

    it('applies default values', () => {
      const data = {
        title: 'Test',
        date: '2025-07-01',
        desc: 'Description'
      };

      const parsed = blogSchema.parse(data);
      expect(parsed.type).toBe('blog');
      expect(parsed.draft).toBe(false);
    });
  });

  describe('garden collection schema', () => {
    const gardenSchema = collections.garden.schema;

    it('validates garden entry data', () => {
      const validData = {
        title: 'Garden Entry',
        date: '2025-07-01',
        type: 'garden'
      };

      expect(() => gardenSchema.parse(validData)).not.toThrow();
    });
  });
});
```

## Component Testing Strategy

### Astro Component Testing Setup
```javascript
// tests/helpers/astro-test-setup.js
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { getContainerRenderer } from '@astro/test-utils';

export async function createTestContainer() {
  const container = await AstroContainer.create();
  container.addServerRenderer({
    renderer: getContainerRenderer()
  });
  return container;
}

export function createMockAstroGlobal(overrides = {}) {
  return {
    props: {},
    url: new URL('http://localhost:4321'),
    site: new URL('https://henryneeds.coffee'),
    generator: 'Astro v5.8.2',
    ...overrides
  };
}
```

### Component Test Examples
```javascript
// tests/component/Header.test.astro
import { describe, it, expect } from 'vitest';
import { createTestContainer } from '../helpers/astro-test-setup.js';
import Header from '../../src/components/Header.astro';

describe('Header Component', () => {
  it('renders terminal header structure', async () => {
    const container = await createTestContainer();
    const result = await container.renderToString(Header);
    
    expect(result).toContain('terminal-header');
    expect(result).toContain('red-button');
    expect(result).toContain('yellow-button');
    expect(result).toContain('green-button');
  });

  it('applies correct CSS classes', async () => {
    const container = await createTestContainer();
    const result = await container.renderToString(Header);
    
    expect(result).toContain('class="terminal-header"');
    expect(result).toContain('class="terminal-button red-button"');
  });
});
```

```javascript
// tests/component/TypingEffect.test.astro
import { describe, it, expect } from 'vitest';
import { createTestContainer } from '../helpers/astro-test-setup.js';
import TypingEffect from '../../src/components/TypingEffect.astro';

describe('TypingEffect Component', () => {
  it('renders with default props', async () => {
    const container = await createTestContainer();
    const result = await container.renderToString(TypingEffect, {
      props: {
        command: 'whoami'
      }
    });
    
    expect(result).toContain('typing-container');
    expect(result).toContain('[hquinn@HenryNeeds ~]$');
  });

  it('accepts custom command prop', async () => {
    const container = await createTestContainer();
    const result = await container.renderToString(TypingEffect, {
      props: {
        command: 'ls -la',
        typingSpeed: 5
      }
    });
    
    expect(result).toContain('typing-container');
  });

  it('renders slot content', async () => {
    const container = await createTestContainer();
    const result = await container.renderToString(TypingEffect, {
      props: { command: 'test' },
      slots: {
        default: '<p>Test content</p>'
      }
    });
    
    expect(result).toContain('<p>Test content</p>');
  });
});
```

## Integration Testing Strategy

### Content Collections Integration
```javascript
// tests/integration/content-collections.test.js
import { describe, it, expect } from 'vitest';
import { getCollection, getEntry } from 'astro:content';

describe('Content Collections Integration', () => {
  it('loads blog collection correctly', async () => {
    const posts = await getCollection('blog');
    expect(Array.isArray(posts)).toBe(true);
    
    if (posts.length > 0) {
      const post = posts[0];
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('data');
      expect(post.data).toHaveProperty('title');
      expect(post.data).toHaveProperty('date');
    }
  });

  it('loads garden collection correctly', async () => {
    const entries = await getCollection('garden');
    expect(Array.isArray(entries)).toBe(true);
  });

  it('filters draft posts correctly', async () => {
    const publishedPosts = await getCollection('blog', ({ data }) => {
      return !data.draft;
    });
    
    publishedPosts.forEach(post => {
      expect(post.data.draft).toBe(false);
    });
  });

  it('loads specific entry by slug', async () => {
    const posts = await getCollection('blog');
    if (posts.length > 0) {
      const firstPost = posts[0];
      const entry = await getEntry('blog', firstPost.id);
      expect(entry).toBeDefined();
      expect(entry.id).toBe(firstPost.id);
    }
  });
});
```

### Build Integration Testing
```javascript
// tests/integration/build.test.js
import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

describe('Build Integration', () => {
  it('builds successfully without errors', async () => {
    const { stdout, stderr } = await execAsync('npm run build');
    
    expect(stderr).not.toContain('error');
    expect(stdout).toContain('Complete!');
  }, 30000); // 30 second timeout

  it('generates expected output files', async () => {
    // Check that key files are generated
    expect(existsSync('dist/index.html')).toBe(true);
    expect(existsSync('dist/blog/index.html')).toBe(true);
    expect(existsSync('dist/digital-garden/index.html')).toBe(true);
  });

  it('generates CSS files', async () => {
    // Check that CSS is generated and optimized
    expect(existsSync('dist/_astro')).toBe(true);
  });
});
```

## End-to-End Testing Strategy

### E2E Test Configuration
```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples
```javascript
// tests/e2e/homepage.spec.js
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check terminal header is visible
    await expect(page.locator('.terminal-header')).toBeVisible();
    
    // Check terminal buttons
    await expect(page.locator('.red-button')).toBeVisible();
    await expect(page.locator('.yellow-button')).toBeVisible();
    await expect(page.locator('.green-button')).toBeVisible();
    
    // Check typing effect starts
    await expect(page.locator('.typing-container')).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Henry Needs Coffee/);
  });

  test('typing animation works', async ({ page }) => {
    await page.goto('/');
    
    // Wait for typing animation to start
    await page.waitForSelector('.typed', { state: 'visible' });
    
    // Check that typing progresses
    await page.waitForFunction(() => {
      const typed = document.querySelector('.typed');
      return typed && typed.textContent.length > 0;
    });
  });
});
```

```javascript
// tests/e2e/navigation.spec.js
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('navigation menu works', async ({ page }) => {
    await page.goto('/');
    
    // Test blog navigation
    await page.click('a[href="/blog"]');
    await expect(page).toHaveURL('/blog');
    await expect(page.locator('h1')).toContainText('Blog');
    
    // Test digital garden navigation
    await page.click('a[href="/digital-garden"]');
    await expect(page).toHaveURL('/digital-garden');
    await expect(page.locator('h1')).toContainText('Digital Garden');
    
    // Test home navigation
    await page.click('a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('blog post links work', async ({ page }) => {
    await page.goto('/blog');
    
    // Click on first blog post if any exist
    const firstPostLink = page.locator('a[href^="/blog/"]').first();
    if (await firstPostLink.count() > 0) {
      await firstPostLink.click();
      await expect(page.url()).toMatch(/\/blog\/.+/);
    }
  });
});
```

```javascript
// tests/e2e/responsive.spec.js
import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('mobile navigation works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that mobile styles are applied
    await expect(page.locator('.terminal-window')).toBeVisible();
    
    // Navigation should still work on mobile
    await page.click('a[href="/blog"]');
    await expect(page).toHaveURL('/blog');
  });

  test('tablet layout works', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('.terminal-header')).toBeVisible();
    await expect(page.locator('.terminal-content')).toBeVisible();
  });

  test('desktop layout works', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    
    await expect(page.locator('.terminal-window')).toBeVisible();
  });
});
```

## Visual Regression Testing

### Screenshot Testing Strategy
```javascript
// tests/e2e/visual.spec.js
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('homepage visual consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for typing animation to complete
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('blog page visual consistency', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('blog-page.png');
  });

  test('mobile homepage visual consistency', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });
});
```

## Performance Testing

### Core Web Vitals Testing
```javascript
// tests/e2e/performance.spec.js
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('meets Core Web Vitals standards', async ({ page }) => {
    await page.goto('/');
    
    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    // LCP should be under 2.5 seconds
    expect(lcp).toBeLessThan(2500);
  });

  test('loads critical resources quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 1 second
    expect(loadTime).toBeLessThan(1000);
  });
});
```

## Accessibility Testing

### A11y Testing Strategy
```javascript
// tests/e2e/accessibility.spec.js
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility', () => {
  test('homepage meets WCAG standards', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
  });

  test('screen reader support', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});
```

## Test Data Management

### Fixtures and Test Data
```javascript
// tests/fixtures/test-data.js
export const mockBlogPost = {
  id: 'test-post',
  data: {
    title: 'Test Blog Post',
    date: new Date('2025-07-01'),
    category: 'Testing',
    type: 'blog',
    desc: 'A test blog post for unit testing',
    draft: false
  }
};

export const mockGardenEntry = {
  id: 'test-entry',
  data: {
    title: 'Test Garden Entry',
    date: new Date('2025-07-01'),
    type: 'garden',
    desc: 'A test garden entry',
    draft: false
  }
};

export const mockContentCollection = [mockBlogPost];
```

## Continuous Integration Strategy

### GitHub Actions Configuration
```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run component tests
        run: npm run test:component
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results
          path: test-results/
```

### NPM Scripts Configuration
```json
{
  "scripts": {
    "test": "vitest run && playwright test",
    "test:unit": "vitest run tests/unit",
    "test:component": "vitest run tests/component",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Testing Best Practices

### General Principles
1. **Test Behavior, Not Implementation**: Focus on what the component does, not how
2. **Arrange, Act, Assert**: Structure tests clearly
3. **Descriptive Test Names**: Test names should explain the scenario
4. **Fast Tests**: Keep unit tests fast, minimize dependencies
5. **Reliable Tests**: Tests should be deterministic and stable

### Astro-Specific Guidelines
1. **Use Container Renderer**: Test components in isolation using `@astro/test-utils`
2. **Mock Astro Globals**: Provide mock `Astro` global for component props
3. **Test Static Generation**: Verify build-time behavior
4. **Content Collection Testing**: Test schema validation and data loading

### Performance Considerations
1. **Parallel Execution**: Run tests in parallel where possible
2. **Test Isolation**: Each test should be independent
3. **Resource Cleanup**: Clean up after tests to prevent memory leaks
4. **Selective Testing**: Use test filtering for development

## Quality Gates

### Coverage Requirements
- **Unit Tests**: 90% code coverage for utilities
- **Component Tests**: 80% component coverage
- **Integration Tests**: Key user flows covered
- **E2E Tests**: Critical paths and happy flows

### Performance Requirements
- **Unit Tests**: Complete in under 10 seconds
- **Component Tests**: Complete in under 30 seconds
- **Integration Tests**: Complete in under 60 seconds
- **E2E Tests**: Complete in under 5 minutes

### Quality Metrics
- **Test Reliability**: 99% pass rate
- **Build Success**: 100% success rate for main branch
- **Performance**: Core Web Vitals within limits
- **Accessibility**: WCAG 2.1 AA compliance

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. Install Vitest and @astro/test-utils
2. Configure test environment
3. Write utility function tests
4. Set up basic CI pipeline

### Phase 2: Component Testing (Week 2)
1. Set up Astro component testing
2. Test core components (Header, TypingEffect, etc.)
3. Test layout components
4. Add component test coverage

### Phase 3: Integration Testing (Week 3)
1. Test content collections
2. Test routing and navigation
3. Test build process
4. Add performance monitoring

### Phase 4: E2E Testing (Week 4)
1. Install and configure Playwright
2. Write core user journey tests
3. Add visual regression testing
4. Implement accessibility testing

### Phase 5: Advanced Testing (Week 5)
1. Add performance testing
2. Implement visual regression baselines
3. Set up comprehensive CI/CD
4. Document testing procedures

## Maintenance Strategy

### Regular Tasks
- **Weekly**: Review test results and flaky tests
- **Monthly**: Update test dependencies
- **Quarterly**: Review and update test strategy
- **Annually**: Evaluate testing tools and frameworks

### Test Maintenance
1. **Keep Tests Updated**: Update tests when features change
2. **Remove Obsolete Tests**: Clean up tests for removed features
3. **Refactor Tests**: Keep test code clean and maintainable
4. **Monitor Performance**: Ensure tests remain fast and reliable
