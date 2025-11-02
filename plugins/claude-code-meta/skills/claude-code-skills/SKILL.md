---
name: claude-code-skills
description: Guide for creating effective Agent Skills in Claude Code. This skill should be used when users want to create a new Skill (or update an existing Skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations. Use when working specifically with Claude Code's Skills system.
license: Complete terms in LICENSE.txt (Apache 2.0)
---

# Claude Code Skills Creator

This skill provides comprehensive guidance for creating effective Agent Skills in Claude Code, including plugin integration.

## About Skills

Skills are modular, self-contained packages that extend Claude's capabilities by providing
specialized knowledge, workflows, and tools. Think of them as "onboarding guides" for specific
domains or tasks—they transform Claude from a general-purpose agent into a specialized agent
equipped with procedural knowledge that no model can fully possess.

### What Skills Provide

1. Specialized workflows - Multi-step procedures for specific domains
2. Tool integrations - Instructions for working with specific file formats or APIs
3. Domain expertise - Company-specific knowledge, schemas, business logic
4. Bundled resources - Scripts, references, and assets for complex and repetitive tasks

### Anatomy of a Skill

Every skill consists of a required SKILL.md file and optional bundled resources:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation intended to be loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts, etc.)
```

#### SKILL.md (required)

**Metadata Quality:** The `name` and `description` in YAML frontmatter determine when Claude will use the skill. Be specific about what the skill does and when to use it. Use the third-person (e.g. "This skill should be used when..." instead of "Use this skill when...").

**Claude Code-specific frontmatter fields:**

- `allowed-tools` (optional, Claude Code only): Comma-separated list of tools Claude can use when this skill is active. Restricts tool access for security or to keep the skill focused. See [references/allowed-tools-guide.md](references/allowed-tools-guide.md) for comprehensive guidance.

Example frontmatter with `allowed-tools`:

```yaml
---
name: safe-file-reader
description: Read files without making changes. Use when you need read-only file access.
allowed-tools: Read, Grep, Glob
---
```

#### Bundled Resources (optional)

##### Scripts (`scripts/`)

Executable code (Python/Bash/etc.) for tasks that require deterministic reliability or are repeatedly rewritten.

- **When to include**: When the same code is being rewritten repeatedly or deterministic reliability is needed
- **Example**: `scripts/rotate_pdf.py` for PDF rotation tasks
- **Benefits**: Token efficient, deterministic, may be executed without loading into context
- **Note**: Scripts may still need to be read by Claude for patching or environment-specific adjustments

##### References (`references/`)

Documentation and reference material intended to be loaded as needed into context to inform Claude's process and thinking.

- **When to include**: For documentation that Claude should reference while working
- **Examples**: `references/finance.md` for financial schemas, `references/mnda.md` for company NDA template, `references/policies.md` for company policies, `references/api_docs.md` for API specifications
- **Use cases**: Database schemas, API documentation, domain knowledge, company policies, detailed workflow guides
- **Benefits**: Keeps SKILL.md lean, loaded only when Claude determines it's needed
- **Best practice**: If files are large (>10k words), include grep search patterns in SKILL.md
- **Avoid duplication**: Information should live in either SKILL.md or references files, not both. Prefer references files for detailed information unless it's truly core to the skill—this keeps SKILL.md lean while making information discoverable without hogging the context window. Keep only essential procedural instructions and workflow guidance in SKILL.md; move detailed reference material, schemas, and examples to references files.

##### Assets (`assets/`)

Files not intended to be loaded into context, but rather used within the output Claude produces.

- **When to include**: When the skill needs files that will be used in the final output
- **Examples**: `assets/logo.png` for brand assets, `assets/slides.pptx` for PowerPoint templates, `assets/frontend-template/` for HTML/React boilerplate, `assets/font.ttf` for typography
- **Use cases**: Templates, images, icons, boilerplate code, fonts, sample documents that get copied or modified
- **Benefits**: Separates output resources from documentation, enables Claude to use files without loading them into context

### Progressive Disclosure Design Principle

Skills use a three-level loading system to manage context efficiently:

1. **Metadata (name + description)** - Always in context (~100 words)
2. **SKILL.md body** - When skill triggers (<5k words)
3. **Bundled resources** - As needed by Claude (Unlimited*)

*Unlimited because scripts can be executed without reading into context window.

## Claude Code Skills Integration

Skills in Claude Code work within a rich ecosystem of extensibility features. Understanding how Skills relate to other components helps you choose the right tool for each task and build cohesive workflows.

### How Skills Fit in the Claude Code Ecosystem

Claude Code provides four main extensibility mechanisms:

1. **Skills** - Specialized knowledge and workflows (this guide)
2. **Slash Commands** - User-invoked prompts (e.g., `/deploy`, `/review`)
3. **Subagents** - Specialized AI personalities with custom system prompts
4. **Hooks** - Event-driven automation scripts

### The allowed-tools Field in Claude Code

Claude Code supports an `allowed-tools` frontmatter field that restricts which tools Claude can use when a skill is active.

**Why use allowed-tools:**

1. **Security** - Prevent Skills from making unintended modifications
2. **Focus** - Keep Skills constrained to their specific purpose
3. **User experience** - Avoid permission prompts for pre-approved tools

**Common patterns:**

```yaml
# Read-only skill
allowed-tools: Read, Grep, Glob

# File operations skill
allowed-tools: Read, Write, Edit, Glob

# Code execution skill
allowed-tools: Read, Write, Bash

# Web research skill
allowed-tools: Read, WebFetch, WebSearch
```

See [references/allowed-tools-guide.md](references/allowed-tools-guide.md) for comprehensive guidance on tool permissions.

### Distribution in Claude Code

Claude Code Skills can be distributed in two ways:

**1. Plugin-bundled Skills** (Recommended for most use cases)

- Skills included in a Claude Code plugin
- Distributed via plugin marketplaces
- Can reference other plugin components (commands, agents, hooks)
- Automatic updates when plugin updates

**2. Standalone Skills**

- Self-contained skill directories
- Simpler for single-purpose, independent skills

## Skill Creation Process

To create a skill, follow the "Skill Creation Process" in order, skipping steps only if there is a clear reason why they are not applicable.

### Step 1: Understanding the Skill with Concrete Examples

Skip this step only when the skill's usage patterns are already clearly understood. It remains valuable even when working with an existing skill.

To create an effective skill, clearly understand concrete examples of how the skill will be used. This understanding can come from either direct user examples or generated examples that are validated with user feedback.

For example, when building an image-editor skill, relevant questions include:

- "What functionality should the image-editor skill support? Editing, rotating, anything else?"
- "Can you give some examples of how this skill would be used?"
- "I can imagine users asking for things like 'Remove the red-eye from this image' or 'Rotate this image'. Are there other ways you imagine this skill being used?"
- "What would a user say that should trigger this skill?"

To avoid overwhelming users, avoid asking too many questions in a single message. Start with the most important questions and follow up as needed for better effectiveness.

Conclude this step when there is a clear sense of the functionality the skill should support.

### Step 2: Planning the Reusable Skill Contents

To turn concrete examples into an effective skill, analyze each example by:

1. Considering how to execute on the example from scratch
2. Identifying what scripts, references, and assets would be helpful when executing these workflows repeatedly

Example: When building a `pdf-editor` skill to handle queries like "Help me rotate this PDF," the analysis shows:

1. Rotating a PDF requires re-writing the same code each time
2. A `scripts/rotate_pdf.py` script would be helpful to store in the skill

Example: When designing a `frontend-webapp-builder` skill for queries like "Build me a todo app" or "Build me a dashboard to track my steps," the analysis shows:

1. Writing a frontend webapp requires the same boilerplate HTML/React each time
2. An `assets/hello-world/` template containing the boilerplate HTML/React project files would be helpful to store in the skill

Example: When building a `big-query` skill to handle queries like "How many users have logged in today?" the analysis shows:

1. Querying BigQuery requires re-discovering the table schemas and relationships each time
2. A `references/schema.md` file documenting the table schemas would be helpful to store in the skill

To establish the skill's contents, analyze each concrete example to create a list of the reusable resources to include: scripts, references, and assets.

### Step 3: Initializing the Skill

At this point, it is time to actually create the skill.

Skip this step only if the skill being developed already exists, and iteration or packaging is needed. In this case, continue to the next step.

When creating a new skill from scratch, always run the `init_skill.py` script. The script conveniently generates a new template skill directory that automatically includes everything a skill requires, making the skill creation process much more efficient and reliable.

#### For Standalone Skills

```bash
scripts/init_skill.py <skill-name> --path <output-directory>
```

#### For Plugin-Bundled Skills (Claude Code)

```bash
scripts/init_skill.py <skill-name> --plugin --path <plugin-directory>
```

The `--plugin` flag:

- Creates the skill in the plugin's `skills/` directory
- Adds a reminder to register the skill in `.claude-plugin/marketplace.json`
- Optimizes the template for plugin distribution

The script:

- Creates the skill directory at the specified path
- Generates a SKILL.md template with proper frontmatter and TODO placeholders
- Creates example resource directories: `scripts/`, `references/`, and `assets/`
- Adds example files in each directory that can be customized or deleted
- For plugin skills, includes guidance on `allowed-tools` and marketplace registration

After initialization, customize or remove the generated SKILL.md and example files as needed.

**Plugin-bundled skills require an additional step:** Register the skill in your plugin's marketplace configuration (see Step 5 below).

### Step 4: Edit the Skill

When editing the (newly-generated or existing) skill, remember that the skill is being created for another instance of Claude to use. Focus on including information that would be beneficial and non-obvious to Claude. Consider what procedural knowledge, domain-specific details, or reusable assets would help another Claude instance execute these tasks more effectively.

#### Start with Reusable Skill Contents

To begin implementation, start with the reusable resources identified above: `scripts/`, `references/`, and `assets/` files. Note that this step may require user input. For example, when implementing a `brand-guidelines` skill, the user may need to provide brand assets or templates to store in `assets/`, or documentation to store in `references/`.

Also, delete any example files and directories not needed for the skill. The initialization script creates example files in `scripts/`, `references/`, and `assets/` to demonstrate structure, but most skills won't need all of them.

#### Update SKILL.md

**Writing Style:** Write the entire skill using **imperative/infinitive form** (verb-first instructions), not second person. Use objective, instructional language (e.g., "To accomplish X, do Y" rather than "You should do X" or "If you need to do X"). This maintains consistency and clarity for AI consumption.

To complete SKILL.md, answer the following questions:

1. What is the purpose of the skill, in a few sentences?
2. When should the skill be used?
3. In practice, how should Claude use the skill? All reusable skill contents developed above should be referenced so that Claude knows how to use them.

### Step 5: Distribution in Claude Code

Once the skill is ready, distribute it via Claude Code's plugin marketplace system or as a standalone skill.

#### Validating the Skill

Before distribution, validate the skill to ensure it meets all requirements:

```bash
scripts/validate_skill.py <path/to/skill-folder>
```

The validation script checks:

- YAML frontmatter format and required fields
- Skill naming conventions and directory structure
- Description completeness and quality
- File organization and resource references
- `allowed-tools` field syntax (Claude Code only)

If validation fails, fix the reported errors and run the validation command again.

#### Option A: Plugin-Bundled Distribution (Recommended)

For skills distributed as part of a plugin:

1. **Register in marketplace.json**:

   Open your plugin's `.claude-plugin/marketplace.json` and add the skill:

   ```json
   {
     "plugins": [
       {
         "name": "my-plugin",
         "skills": [
           "./skills/my-skill"
         ]
       }
     ]
   }
   ```

2. **Test locally**:

   ```
   /plugin marketplace add ./path/to/plugin
   /plugin install my-plugin@local-marketplace
   ```

3. **Distribute via git**:

   Commit the plugin (including the skill) to your git repository. Team members can install via:

   ```
   /plugin marketplace add owner/repo
   /plugin install my-plugin@marketplace-name
   ```

#### Option B: Standalone Distribution

For independent skills not part of a larger plugin:

1. **Create a minimal marketplace** for the skill
2. **Distribute via git repository**
3. Users install with `/plugin marketplace add` and `/plugin install`

#### Option C: Zip File Distribution

For non-Claude Code environments (claude.ai, API), skills can be packaged as zip files:

```bash
scripts/package_skill.py <path/to/skill-folder>
```

The packaging script validates the skill and creates a distributable zip file. This method is an alternative to marketplace distribution and is commonly used for claude.ai and API deployments.

### Step 6: Iterate

After testing the skill, users may request improvements. Often this happens right after using the skill, with fresh context of how the skill performed.

**Iteration workflow:**

1. Use the skill on real tasks
2. Notice struggles or inefficiencies
3. Identify how SKILL.md or bundled resources should be updated
4. Implement changes and test again
