---
name: docs-to-skill
description: Use this skill when the user wants to ingest a documentation site and generate a Claude Code skill from it. Converts documentation websites into structured skill packages with a SKILL.md index and markdown reference files.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, Task, AskUserQuestion
---

# Docs to Skill

Ingest a documentation site and generate a ready-to-use Claude Code skill. Point this at any docs URL and it will discover pages, fetch content, and produce a skill with a SKILL.md index and `references/` directory.

## Overview

This skill orchestrates a multi-phase workflow:

1. **Gather Info** — Get the docs URL, skill name, and output location from the user
2. **Discovery** — Find all documentation pages via sitemap, nav crawl, or manual list
3. **Fetching** — Extract clean markdown from each page using subagents
4. **Skill Generation** — Produce the SKILL.md index with reference map

The bundled Playwright MCP server (headless) gives you a real browser for navigating pages, taking screenshots, and extracting content as clean markdown via Turndown.js injection.

## Phase 1: Gather Info

Collect three things from the user:

### 1. Documentation URL(s)

The root URL of the documentation site. Examples:
- `https://docs.example.com`
- `https://example.com/docs/getting-started`

If the user provides multiple URLs, treat each as a separate docs section to include.

### 2. Skill Name

Either provided by the user or derived from the site:
- Use the project/product name in hyphen-case
- Examples: `react-docs`, `stripe-api`, `shadcn-ui`

### 3. Output Location

Ask the user where to place the generated skill:

- **Personal**: `~/.claude/skills/<skill-name>/`
- **Project**: `.claude/skills/<skill-name>/`
- **Plugin**: User specifies `<marketplace>/plugins/<plugin-name>/skills/<skill-name>/`

## Phase 2: Discovery

Find all documentation pages to fetch. Try strategies in order until one succeeds.

### Strategy 1: Sitemap

Use WebFetch to retrieve `<domain>/sitemap.xml`:

```
WebFetch url="https://docs.example.com/sitemap.xml" prompt="Extract all URLs from this sitemap XML. Return them as a plain list, one URL per line. Only include URLs that appear to be documentation pages (not blog posts, marketing pages, etc.)."
```

If the sitemap exists, filter URLs to the docs path prefix. For example, if the user gave `https://example.com/docs/`, only keep URLs starting with that path.

### Strategy 2: Navigation Crawl

If no sitemap exists, use Playwright to crawl the navigation:

1. Navigate to the docs root URL with `browser_navigate`
2. Extract all internal links from the sidebar/navigation using `browser_evaluate`:

```javascript
// Common doc site nav patterns — adapt to what you find on the page
const navSelectors = [
  'nav a[href]',
  '[role="navigation"] a[href]',
  '.sidebar a[href]',
  '.docs-sidebar a[href]',
  '.toc a[href]',
  'aside a[href]'
];

const links = new Set();
for (const selector of navSelectors) {
  document.querySelectorAll(selector).forEach(a => {
    const href = a.href;
    if (href && href.startsWith(window.location.origin)) {
      links.add(href);
    }
  });
}

// Deduplicate and sort
Array.from(links).sort();
```

3. If the nav doesn't yield enough links, also check for "next page" or pagination patterns and follow them

### Strategy 3: Manual

If automated discovery fails, ask the user to provide a list of URLs.

### Present Results

After discovery, present the URL list to the user:

- Show the total count
- Show the first ~20 URLs as a preview
- Ask if they want to filter, add, or remove any URLs before proceeding

## Phase 3: Fetching

This is the most context-intensive phase. Use subagents to keep the main context clean.

### Step 1: Find the Content Selector

Navigate to a representative page with Playwright and figure out the right CSS selector for the content area.

1. **Navigate and screenshot** to see the page layout:

```
browser_navigate url="<docs-url>"
browser_take_screenshot name="docs-layout"
```

2. **Find the content container:**

```javascript
const candidates = ['article', '[role="main"]', 'main', '.docs-content', '.markdown-body', '.content', '#content'];
const found = candidates.map(sel => {
  const el = document.querySelector(sel);
  return el ? { selector: sel, textLength: el.innerText.trim().length } : null;
}).filter(Boolean);
JSON.stringify(found);
```

3. **Test Turndown extraction** on the best candidate:

```javascript
new Promise((resolve) => {
  const s = document.createElement('script');
  s.src = 'https://unpkg.com/turndown/dist/turndown.js';
  s.onload = () => {
    const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    const el = document.querySelector('<best-selector>');
    const clone = el.cloneNode(true);
    clone.querySelectorAll('button, [aria-label="Copy"]').forEach(e => e.remove());
    clone.querySelectorAll('h1 > div, h2 > div, h3 > div, h4 > div').forEach(e => e.remove());
    resolve(td.turndown(clone.innerHTML));
  };
  document.head.appendChild(s);
});
```

4. **Verify** the markdown output — headings, code blocks, lists should be clean. If nav chrome leaked through, add more selectors to strip. Note your findings:
   - **Content selector** (e.g., `#content`, `main`, `article`)
   - **Elements to strip** (e.g., `button, .sidebar, nav`)
   - **Any quirks** (cookie banners to dismiss, dynamic loading delays)

### Step 2: Batch and Delegate

Split the remaining URLs into batches of 3-5 pages per subagent. Each page requires ~4-5 tool calls (navigate, load Turndown, extract, get title, write file), so keep batches small to avoid hitting turn limits. For each batch, spawn a `general-purpose` subagent using the Task tool:

```
Task:
  subagent_type: general-purpose
  prompt: |
    You are fetching documentation pages and saving them as markdown reference files.

    ## Output Directory
    <absolute-path-to-output>/references/

    ## URLs to Fetch
    1. <url-1>
    2. <url-2>
    ...

    ## Extraction

    For each URL, use Playwright with Turndown to get full markdown content:

    1. Navigate: `browser_navigate` to the URL
    2. Load Turndown (only needed once — it persists across navigations on the same origin):
       ```javascript
       new Promise((resolve) => {
         if (window.TurndownService) { resolve('already loaded'); return; }
         const s = document.createElement('script');
         s.src = 'https://unpkg.com/turndown/dist/turndown.js';
         s.onload = () => resolve('loaded');
         document.head.appendChild(s);
       });
       ```
    3. Extract content:
       ```javascript
       const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
       const el = document.querySelector('<content-selector>');
       const clone = el.cloneNode(true);
       clone.querySelectorAll('<elements-to-strip>').forEach(e => e.remove());
       // Strip heading anchor link wrappers (common in doc sites)
       clone.querySelectorAll('h1 > div, h2 > div, h3 > div, h4 > div').forEach(e => e.remove());
       td.turndown(clone.innerHTML);
       ```
    4. Get the page title: `document.querySelector('h1')?.textContent || document.title`

    If Playwright fails on a page, fall back to WebFetch with prompt:
    "Extract the main documentation content as clean markdown."

    ## For Each URL

    1. Extract the page content using the method above

    2. Determine the filename:
       - Use the URL path to derive a descriptive filename
       - Replace slashes with underscores, remove leading/trailing slashes
       - Prefix with the site/project name for namespacing
       - Example: `https://docs.example.com/guides/auth` → `example_guides_auth.md`

    3. Write the reference file with this format:
       ```
       ---
       title: <Page Title>
       source_url: <original-url>
       ---

       <clean markdown content>
       ```

    ## Quality Checks
    - Skip pages that yield less than 100 characters of content (likely empty/redirect)
    - Preserve all code blocks with their language annotations
    - Keep relative links as-is (don't try to resolve them)
    - Tables should be converted to markdown table format where possible
```

### Step 3: Monitor and Review

After subagents complete:

1. Use Glob to list all files in the `references/` directory
2. Spot-check a few files — read the first 20 lines to verify frontmatter and content quality
3. Check for any empty or suspiciously short files
4. Report results to the user: "Fetched X pages, Y reference files created"

## Phase 4: Skill Generation

Generate the SKILL.md index file by reading all reference files and organizing them.

### Step 1: Inventory References

Read all reference files to build a map of:
- Filename
- Title (from frontmatter)
- Source URL (from frontmatter)
- Brief content summary (from first paragraph or heading structure)

### Step 2: Organize Topics

Group references into logical topic sections. Common groupings:
- Getting Started / Overview
- Core Concepts
- API Reference
- Guides / Tutorials
- Configuration
- Advanced Topics
- Troubleshooting / FAQ

Use the documentation site's own navigation structure as a guide for grouping.

### Step 3: Generate SKILL.md

Use the template below. Fill in all sections based on the reference inventory.

````markdown
---
name: <skill-name>
description: <When Claude should use this skill — be specific about the technology/framework and what kinds of tasks trigger it>
allowed-tools: Read
---

# <Skill Display Name>

## Overview

<2-3 sentence description of what this skill covers and what it enables.>

## When to Use This Skill

Activate this skill when:

- <Specific trigger 1 — e.g., "Building components with shadcn/ui">
- <Specific trigger 2 — e.g., "Configuring shadcn/ui theming or styling">
- <Specific trigger 3>
- <Specific trigger 4>

## Quick Reference

<Essential patterns that come up constantly. Keep this to 10-15 lines max. Include:
- The primary install/setup command
- The most common import pattern
- The 1-2 most frequently needed code snippets
- Key conventions (naming, file structure, etc.)

This section saves a round-trip to reference files for the basics that Claude needs on almost every interaction.>

## <Topic Section 1 — e.g., "Getting Started">

### <Subtopic — e.g., "Installation">

<Brief description of what this reference covers.>

**Reference**: `references/<filename>.md`

**When to reference**: <Specific scenario — e.g., "When setting up a new project with shadcn/ui or adding it to an existing project.">

### <Subtopic 2>

...

## <Topic Section 2 — e.g., "Components">

### <Subtopic>

...

## Reference Documentation Index

All documentation is available in the `references/` directory:

**<Category>**:

- `<filename>.md` - <Brief description>
- `<filename>.md` - <Brief description>

**<Category>**:

- `<filename>.md` - <Brief description>
````

### Key Principles for the Generated SKILL.md

1. **Keep it under 5,000 words** — it's an index, not a copy of the docs
2. **Every reference file must appear** in both a topic section and the index
3. **"When to reference" is critical** — this is what makes the skill useful. Be specific about what scenario triggers reading that file.
4. **Quick Reference saves round-trips** — put the 3-5 most common patterns inline so Claude doesn't need to read a file for basics like install commands and import patterns
5. **Mirror the original docs structure** where it makes sense
6. **The description frontmatter matters** — Claude uses it to decide when to activate the skill. Be precise.

### Step 4: Write Output

1. Write SKILL.md to the target location
2. If the target is a plugin location, remind the user to register it in their `marketplace.json`
3. Report final stats: total reference files, SKILL.md size, output path

## Playwright Tool Reference

The bundled Playwright MCP server (headless) gives the agent a real browser. Core tools:

- **`browser_navigate`** — Navigate to a URL. Params: `url`
- **`browser_take_screenshot`** — Screenshot the page (PNG)
- **`browser_click`** — Click an element. Params: `element` (description), `ref` (element reference)
- **`browser_evaluate`** — Run JavaScript in the page context. Params: `function` (JS code as `() => { ... }`)

### Common Patterns

**Visual reconnaissance (always do this first):**
```
browser_navigate url="https://docs.example.com/getting-started"
browser_take_screenshot name="docs-layout"
```

Look at the screenshot to understand: Where is the content? Where is the nav? Are there overlays to dismiss?

**Convert page content to markdown with Turndown:**
```javascript
new Promise((resolve) => {
  const s = document.createElement('script');
  s.src = 'https://unpkg.com/turndown/dist/turndown.js';
  s.onload = () => {
    const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    const el = document.querySelector('main');
    const clone = el.cloneNode(true);
    clone.querySelectorAll('button').forEach(e => e.remove());
    clone.querySelectorAll('h1 > div, h2 > div, h3 > div, h4 > div').forEach(e => e.remove());
    resolve(td.turndown(clone.innerHTML));
  };
  document.head.appendChild(s);
});
```

Turndown persists in the page after loading — subsequent navigations to the same origin won't need to reload it.

**Dismiss cookie banners or overlays:**
```
browser_click selector="button[aria-label='Accept cookies']"
browser_take_screenshot name="after-dismiss"
```

**Extract all links from navigation:**
```
browser_evaluate script="Array.from(document.querySelectorAll('nav a[href]')).map(a => ({text: a.textContent.trim(), href: a.href}))"
```

## Troubleshooting

### Empty or sparse content extraction

Some sites load content dynamically after initial page load. If Turndown returns empty/short content:
1. Add a delay before extraction: `new Promise(r => setTimeout(r, 2000))` then retry
2. Screenshot the page to see if content is visually present but in a different container
3. Check if the content is loaded via API calls that you could intercept

### Rate limiting

If the site returns 429 errors:
1. Reduce batch sizes to 2-3 pages per subagent
2. Add delays between navigations in subagent instructions

### Sites behind authentication

This skill works with publicly accessible documentation. For authenticated docs:
1. Ask the user to provide the content manually
2. Or use the manual URL strategy with pages the user has access to

### Very large documentation sites (100+ pages)

For large sites:
1. Ask the user which sections are most important
2. Prioritize getting started, core concepts, and API reference
3. Skip changelog, blog, and marketing pages
4. Consider splitting into multiple skills by topic area
