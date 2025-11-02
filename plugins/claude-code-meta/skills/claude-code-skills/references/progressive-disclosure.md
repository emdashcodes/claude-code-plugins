# Progressive Disclosure in Agent Skills

Deep dive into the progressive disclosure architecture that makes Skills efficient and scalable.

*Based on: [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)*

## The Problem Skills Solve

General-purpose agents face a fundamental challenge: they can interact with full computing environments, but real work requires:

1. **Procedural knowledge** - Step-by-step processes that can't be derived from first principles
2. **Organizational context** - Company-specific workflows, schemas, and business logic
3. **Specialized expertise** - Domain-specific knowledge and best practices

Models have limited context windows. Every byte of specialized knowledge competes with conversation history and the user's actual request.

## Progressive Disclosure Design Principle

**Core idea:** Load information in stages as needed, rather than consuming context upfront.

Think of it like a manual with a table of contents, chapters, and appendices—you don't read everything to find what you need.

### Three Levels of Loading

#### Level 1: Metadata (Always Loaded)

**What:** Name and description from YAML frontmatter
**When:** At startup, included in system prompt
**Token cost:** ~100 words per skill
**Purpose:** Skill discovery—enough info for Claude to know when to use it

```yaml
---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
---
```

**Why this works:**

- Minimal context footprint
- All skills' metadata fits in system prompt
- Claude can select relevant skills based on context

#### Level 2: Instructions (Loaded When Triggered)

**What:** SKILL.md body content
**When:** Claude reads file when skill is relevant
**Token cost:** Under 5k words recommended
**Purpose:** Procedural knowledge and quick start guides

```markdown
# PDF Processing

## Quick start

Use pdfplumber to extract text from PDFs:

\`\`\`python
import pdfplumber
with pdfplumber.open("document.pdf") as pdf:
    text = pdf.pages[0].extract_text()
\`\`\`

For advanced form filling, see [FORMS.md](FORMS.md).
```

**Why this works:**

- Only loaded when relevant
- Focused on essential procedures
- Points to detailed docs when needed
- Doesn't hog context window permanently

#### Level 3+: Resources (Loaded As Needed)

**What:** Reference files, scripts, assets
**When:** Claude accesses when explicitly needed
**Token cost:** Unlimited (scripts can execute without loading)
**Purpose:** Detailed docs, executable code, templates

**Example structure:**

```
pdf-skill/
├── SKILL.md           # Level 2: Core procedures
├── FORMS.md           # Level 3: Form-filling details
├── REFERENCE.md       # Level 3: Complete API reference
└── scripts/
    └── fill_form.py   # Level 3: Executable (may run without reading)
```

**Why this works:**

- Detailed information available but not consuming context
- Scripts execute efficiently (output consumed, not source)
- No practical limit on bundled content
- Progressive complexity based on task needs

## How Progressive Disclosure Works in Practice

### Scenario: PDF Form Filling Task

User asks: "Fill out this PDF form with the data from data.json"

#### Step 1: Skill Discovery (Level 1)

Claude's system prompt includes metadata for all installed skills:

```
Available skills:
- pdf-processing: Extract text and tables from PDF files, fill forms...
- excel-analysis: Analyze spreadsheets, create pivot tables...
- git-workflows: Git branching, committing, and collaboration...
```

Claude matches "PDF form" → `pdf-processing` skill.

#### Step 2: Load Core Procedures (Level 2)

Claude reads `pdf-skill/SKILL.md`:

```bash
# Claude executes:
cat pdf-skill/SKILL.md
```

Gets core procedures and quick start guide (~3k words).

#### Step 3: Conditional Detail Loading (Level 3)

SKILL.md mentions: "For form filling, see [FORMS.md](FORMS.md)"

Claude determines form filling is needed:

```bash
# Claude executes:
cat pdf-skill/FORMS.md
```

Gets detailed form-filling procedures.

#### Step 4: Script Execution (Level 3+)

FORMS.md references `scripts/fill_form.py`

Claude executes the script:

```bash
# Claude executes:
python pdf-skill/scripts/fill_form.py input.pdf output.pdf --data data.json
```

**Key efficiency:** Script source (~200 lines) never loaded into context—only the output (success message) is consumed.

### Token Accounting Example

| Content | Loaded? | Token Cost |
|---------|---------|------------|
| pdf-processing metadata | Always | ~100 tokens |
| Other 10 skills metadata | Always | ~1000 tokens |
| SKILL.md body | When triggered | ~3000 tokens |
| FORMS.md reference | If needed | ~2000 tokens |
| REFERENCE.md | Not accessed | 0 tokens |
| fill_form.py source | Not read | 0 tokens |
| fill_form.py output | Result only | ~50 tokens |

**Total:** ~6150 tokens vs. ~50,000 tokens if everything was pre-loaded

## Skills and the Context Window

### Context is a Public Good

Everything shares the same context window:

- System prompt
- Conversation history
- All skills' metadata
- Active skill content
- User's current request

**Implication:** Being concise in SKILL.md means less competition with conversation history.

### The Code Execution Environment

Skills leverage Claude's code execution environment:

- **Real filesystem** - Skills exist as actual directories and files
- **Bash access** - Claude can read files dynamically
- **Code execution** - Claude can run scripts and capture output

This architecture enables progressive disclosure:

```python
# Claude can do this:
if need_basic_info:
    read("SKILL.md")
if need_advanced_info:
    read("FORMS.md")
if need_to_process:
    output = execute("scripts/fill_form.py", args)
```

### Why Not Just Include Everything?

**Anti-pattern: The Monolithic Skill**

```yaml
---
name: pdf-everything
description: Complete PDF processing guide
---

# PDF Everything

(10,000 words of content covering every PDF operation...)
```

**Problems:**

1. Consumes 10k tokens every time skill is used
2. Pushes conversation history out of context
3. Most content irrelevant to current task
4. Slower to process
5. Harder to maintain

**Better: Progressive Organization**

```
pdf-skill/
├── SKILL.md         # 500 words: overview, common tasks
├── EXTRACT.md       # 2k words: text/table extraction details
├── FORMS.md         # 2k words: form-filling details
├── MERGE.md         # 1k words: merging PDFs
└── REFERENCE.md     # 5k words: complete API reference
```

Claude loads only what's needed for the task.

## Design Guidelines for Progressive Disclosure

### 1. Metadata is Critical

**Description should include:**

- What the skill does
- When to use it
- Key trigger words users might say

```yaml
# Good
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.

# Too vague
description: Helps with documents
```

### 2. SKILL.md is an Overview

**Should include:**

- Quick start examples
- Common workflows
- Pointers to detailed docs

**Should NOT include:**

- Complete API references
- Exhaustive option lists
- Every edge case

**Rule of thumb:** Keep SKILL.md under 5k words

### 3. Split by Topic, Not Arbitrarily

**Good splitting:**

```
bigquery-skill/
├── SKILL.md              # Overview
└── reference/
    ├── finance.md        # Finance tables
    ├── sales.md          # Sales tables
    ├── product.md        # Product tables
    └── marketing.md      # Marketing tables
```

Claude loads only the domain needed.

**Bad splitting:**

```
bigquery-skill/
├── SKILL.md
├── part1.md             # First half of API
└── part2.md             # Second half of API
```

No clear trigger for when to load each part.

### 4. Reference Patterns

**Direct references (1 level):**

```markdown
For advanced form filling, see [FORMS.md](FORMS.md).
```

**Avoid deep nesting:**

```markdown
# Bad - requires following multiple references
See [GUIDE.md](GUIDE.md), which links to [ADVANCED.md](ADVANCED.md),
which references [INTERNALS.md](INTERNALS.md)
```

### 5. Scripts for Determinism

**When to bundle scripts:**

- Same code written repeatedly
- Need deterministic execution
- Complex logic better in real code
- Performance-sensitive operations

**Script execution is token-efficient:**

- Source code not loaded into context
- Only output consumed
- Can be arbitrarily complex

## Advanced Patterns

### Conditional Loading

SKILL.md can guide Claude's file reading:

```markdown
## Text Extraction

For basic extraction:
(inline example)

For tables with complex layouts, see [ADVANCED_TABLES.md](ADVANCED_TABLES.md).

For scanned PDFs requiring OCR, see [OCR.md](OCR.md).
```

Claude loads advanced docs only when needed.

### Grep Patterns for Large Files

For very large reference files:

```markdown
## Database Schema

The complete schema is in [schema.md](schema.md).

To find a specific table:
\`\`\`bash
grep -A 20 "## users_table" schema.md
\`\`\```

Claude can efficiently search without loading the entire file.

### Domain-Specific Organization

Organize by user's domain, not technical structure:

```

analytics-skill/
├── SKILL.md
└── dashboards/
    ├── sales.md         # Sales team workflows
    ├── marketing.md     # Marketing team workflows
    └── product.md       # Product team workflows

```

Claude loads only the relevant domain knowledge.

## Measuring Progressive Disclosure Success

### Good Signs

- Skill used successfully without loading all files
- Different tasks use different reference files
- Scripts executed without source loading
- Context window has room for conversation

### Warning Signs

- SKILL.md is >5k words
- Same files loaded every time
- Few or no references used
- Users report "Claude seems slow/forgetful"

### Optimization Process

1. **Monitor usage** - Which files get loaded?
2. **Identify patterns** - Are some files always loaded together?
3. **Refactor** - Merge frequently-paired files, split monoliths
4. **Test** - Verify tasks still complete successfully

## Real-World Example: Anthropic's PDF Skill

From the [document-skills](https://github.com/anthropics/skills/tree/main/document-skills/pdf):

```

pdf/
├── SKILL.md           # Overview and quick start
├── FORMS.md           # Form filling details
├── READING.md         # Text extraction strategies
├── VISUAL.md          # Visual analysis approaches
└── scripts/
    └── extract_fields.py  # Form field extraction

```

**Progressive disclosure in action:**

1. User: "Extract text from this PDF"
   - Loads: SKILL.md only
   - Uses: Inline pdfplumber example
   - Tokens: ~3k

2. User: "Fill out this PDF form"
   - Loads: SKILL.md → FORMS.md
   - Uses: Form-filling procedures
   - Executes: scripts/extract_fields.py
   - Tokens: ~5k + script output

3. User: "Extract tables from scanned PDF"
   - Loads: SKILL.md → VISUAL.md
   - Uses: Visual analysis strategies
   - Tokens: ~6k

Each task uses only what it needs.

## Conclusion

Progressive disclosure makes Skills:
- **Scalable** - No limit on bundled content
- **Efficient** - Minimal context consumption
- **Flexible** - Adapt to task complexity
- **Maintainable** - Organize by topic, not size

**Key principle:** Provide discovery metadata (always loaded), procedural guidance (when triggered), and detailed references (as needed), letting the agent's code execution environment handle the progressive loading efficiently.
