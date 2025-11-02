# Claude Code Subagents Reference

Complete technical reference for Claude Code subagents architecture, configuration, and usage patterns.

## Overview

Subagents are specialized AI assistants in Claude Code that handle specific types of tasks with their own context windows, custom system prompts, and tool configurations. They enable efficient task delegation, context preservation, and domain-specific expertise.

## Architecture

### Context Isolation

Each subagent operates in its own context window, separate from the main conversation:

- **Main conversation**: High-level orchestration and user interaction
- **Subagent context**: Task-specific work with specialized prompts
- **Benefits**: Prevents context pollution, enables longer sessions, maintains focus

### Delegation System

Claude Code delegates tasks to subagents based on:

1. **Description matching**: Subagent `description` field matches task requirements
2. **Tool availability**: Subagent has access to necessary tools
3. **Explicit requests**: User directly invokes a specific subagent
4. **Context signals**: Current conversation state and needs

### File Structure

Subagents are stored as Markdown files with YAML frontmatter:

```
subagent-name.md
├── YAML frontmatter (metadata)
│   ├── name: (required)
│   ├── description: (required)
│   ├── tools: (optional)
│   └── model: (optional)
└── Markdown body (system prompt)
```

## File Locations and Priority

### Priority Order

When multiple subagents have the same name, Claude Code uses this priority:

1. **Project subagents**: `.claude/agents/` (highest priority)
2. **CLI-defined subagents**: `--agents` flag
3. **User subagents**: `~/.claude/agents/`
4. **Plugin subagents**: `plugins/<name>/agents/` (lowest priority)

### Project Subagents

**Location**: `.claude/agents/`

**Characteristics**:

- Shared with team via version control
- Project-specific workflows and conventions
- Override user-level and plugin subagents
- Best for team standards and project patterns

**Use cases**:

- Code review standards specific to project
- Project-specific test runners
- Domain knowledge for the codebase
- Team workflow automation

### User Subagents

**Location**: `~/.claude/agents/`

**Characteristics**:

- Available across all projects
- Personal preferences and workflows
- Lower priority than project subagents
- Portable across machines (can sync via dotfiles)

**Use cases**:

- Personal coding style preferences
- Individual productivity workflows
- Cross-project utilities
- Learning and experimentation

### Plugin Subagents

**Location**: `plugins/<plugin-name>/agents/`

**Characteristics**:

- Distributed via plugin marketplaces
- Reusable across installations
- Lowest priority (overridden by project/user)
- Professional/community-maintained

**Use cases**:

- Language-specific tooling (Python linter, Go formatter)
- Framework-specific workflows (React component builder)
- Cloud platform integration (AWS deployer, GCP manager)
- Security scanning and compliance

## Configuration Format

### Complete Example

```yaml
---
name: code-reviewer
description: Expert code review specialist. Use PROACTIVELY after writing or modifying code for quality, security, and maintainability review.
tools: Read, Grep, Glob, Bash(git:*)
model: sonnet
---

You are a senior code reviewer with expertise in software quality, security, and best practices.

## Role

Perform comprehensive code reviews focusing on:
- Code quality and maintainability
- Security vulnerabilities
- Performance considerations
- Best practice adherence

## Process

When invoked:

1. **Gather context**
   - Run `git diff` to see recent changes
   - Identify modified files
   - Understand the change scope

2. **Review systematically**
   - Analyze each modified file
   - Check against review checklist
   - Identify issues by severity

3. **Provide feedback**
   - Critical issues (must fix)
   - Warnings (should fix)
   - Suggestions (consider improving)

## Review Checklist

- [ ] Code is simple and readable
- [ ] Functions and variables are well-named
- [ ] No duplicated code
- [ ] Proper error handling
- [ ] No exposed secrets or credentials
- [ ] Input validation implemented
- [ ] Good test coverage
- [ ] Performance considerations addressed

## Output Format

Organize feedback by priority with specific examples and fix recommendations.
```

### Frontmatter Fields

#### name (required)

**Format**: Lowercase alphanumeric with hyphens only

**Examples**:

- ✅ `code-reviewer`
- ✅ `test-runner-jest`
- ✅ `data-analyst-sql`
- ❌ `Code_Reviewer` (uppercase and underscores)
- ❌ `test.runner` (periods)
- ❌ `data analyst` (spaces)

**Best practices**:

- Use descriptive, specific names
- Include technology if relevant: `test-runner-pytest`, `linter-eslint`
- Avoid generic names: prefer `api-integration-tester` over `tester`

#### description (required)

**Purpose**: Determines when Claude Code delegates to this subagent

**Format**: Natural language description of when the subagent should be invoked

**Best practices**:

1. **Be specific and action-oriented**:
   - ✅ "Expert code reviewer. Use PROACTIVELY after writing or modifying code for quality, security, and maintainability review."
   - ❌ "Reviews code" (too vague)

2. **Include trigger keywords**:
   - Use "PROACTIVELY" for automatic invocation
   - Use "MUST BE USED" for strong delegation signals
   - Include task-specific verbs: "analyze", "debug", "test", "review"

3. **Specify scope and expertise**:
   - ✅ "SQL and BigQuery analysis specialist. Use for data queries, analysis, and insights."
   - ❌ "Data work" (unclear scope)

4. **Consider user language**:
   - Think about how users will phrase requests
   - Include common synonyms and related terms

**Examples**:

```yaml
# Code reviewer (proactive)
description: Expert code review specialist. Use PROACTIVELY after writing or modifying code for quality, security, and maintainability review.

# Debugger (on-demand)
description: Debugging specialist for errors, test failures, and unexpected behavior. Use when encountering issues or bugs.

# Data analyst (domain-specific)
description: SQL and BigQuery analysis expert. Use for data queries, analysis, visualization, and insights extraction.

# Test runner (workflow-specific)
description: Test automation specialist. Use PROACTIVELY to run tests, analyze failures, and implement fixes.
```

#### tools (optional)

**Purpose**: Defines which tools the subagent can use

**Behavior**:

- If **omitted**: Inherits ALL tools from main conversation (including MCP tools)
- If **specified**: Limited to listed tools only

**Format**: Comma-separated list of tool names

**Tool Categories**:

1. **File operations**:
   - `Read` - Read files from filesystem (supports images, PDFs, Jupyter notebooks)
   - `Write` - Create new files (overwrites if exists)
   - `Edit` - Modify existing files with exact string replacements
   - `Glob` - Find files by glob pattern (e.g., `**/*.js`)
   - `Grep` - Search file contents with regex patterns

2. **Code editing**:
   - `NotebookEdit` - Edit Jupyter notebook cells (insert, delete, replace)

3. **Command execution**:
   - `Bash` - Execute bash commands in persistent shell
   - `Bash(git:*)` - Git commands only (e.g., `git status`, `git diff`)
   - `Bash(npm:*)` - npm commands only (e.g., `npm test`, `npm install`)
   - `Bash(docker:*)` - Docker commands only
   - `Bash(pytest:*)` - pytest commands only
   - `Bash(bq:*)` - BigQuery CLI commands only
   - `BashOutput` - Retrieve output from background bash shells
   - `KillBash` - Terminate running background bash shells

4. **Web and search**:
   - `WebFetch` - Fetch and process web content with AI
   - `WebSearch` - Search the web for up-to-date information

5. **Task management**:
   - `TodoWrite` - Create and manage structured task lists
   - `Task` - Launch specialized subagents for complex tasks

6. **Workflow control**:
   - `ExitPlanMode` - Exit planning mode and present plan to user
   - `SlashCommand` - Execute custom slash commands

7. **MCP integration**:
   - `ListMcpResources` - List available MCP resources
   - `ReadMcpResource` - Read specific MCP resource content
   - Plus any MCP tools provided by installed servers (inherited by default)

**Examples**:

```yaml
# Inherit all tools (most permissive)
# Omit tools field entirely

# Read-only subagent (safest)
tools: Read, Grep, Glob

# Code reviewer (git + read)
tools: Read, Grep, Glob, Bash(git:*)

# Test runner (needs execution)
tools: Read, Edit, Bash(npm:*), Bash(pytest:*)

# Full development subagent
tools: Read, Write, Edit, Grep, Glob, Bash

# Data analyst (specific commands)
tools: Read, Write, Bash(bq:*), Bash(psql:*)
```

**Security considerations**:

- Limit tools to minimum necessary
- Use bash patterns to restrict command scope
- Avoid granting `Write` unless needed
- Consider read-only for review/analysis subagents

#### model (optional)

**Purpose**: Specifies which model the subagent should use

**Options**:

1. **Model aliases**:
   - `sonnet` - Claude Sonnet (balanced, default)
   - `opus` - Claude Opus (most capable)
   - `haiku` - Claude Haiku (fastest, most efficient)

2. **Special values**:
   - `inherit` - Use same model as main conversation
   - Omit field - Defaults to `sonnet`

**Behavior**:

```yaml
# Use Sonnet (default if omitted)
model: sonnet

# Use Opus for complex tasks
model: opus

# Use Haiku for simple, fast tasks
model: haiku

# Match main conversation model
model: inherit
```

**When to use each**:

- **`sonnet`** (default): Most subagents, balanced capability and speed
- **`opus`**: Complex analysis, critical reviews, architecture decisions
- **`haiku`**: Simple tasks, fast iterations, high-volume operations
- **`inherit`**: Keep consistency with conversation style and model

### System Prompt (Body)

The Markdown body after frontmatter defines the subagent's system prompt.

**Structure recommendations**:

1. **Role definition**:

   ```markdown
   You are a [expertise level] [specialization] with [specific skills].
   ```

2. **Capabilities and scope**:

   ```markdown
   ## Role

   Perform [primary task] focusing on:
   - [capability 1]
   - [capability 2]
   - [capability 3]
   ```

3. **Process and workflow**:

   ```markdown
   ## Process

   When invoked:

   1. **[Step 1 name]**
      - Action detail
      - Action detail

   2. **[Step 2 name]**
      - Action detail
   ```

4. **Guidelines and best practices**:

   ```markdown
   ## Guidelines

   - [Principle 1]
   - [Principle 2]
   - [Constraint or requirement]
   ```

5. **Output format**:

   ```markdown
   ## Output Format

   Provide results as:
   - [Format requirement 1]
   - [Format requirement 2]
   ```

**Writing style**:

- Use imperative/infinitive form (verb-first)
- Be specific and actionable
- Include examples when helpful
- Define success criteria
- Specify constraints clearly

## CLI-Based Configuration

### Usage

Define subagents via `--agents` flag with JSON:

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer focusing on quality, security, and best practices.",
    "tools": ["Read", "Grep", "Glob", "Bash(git:*)"],
    "model": "sonnet"
  },
  "debugger": {
    "description": "Debugging specialist for errors and failures.",
    "prompt": "You are an expert debugger specializing in root cause analysis.",
    "model": "inherit"
  }
}'
```

### Use Cases

1. **Quick testing**: Test subagent configurations before creating files
2. **Session-specific**: Temporary subagents for one-off tasks
3. **Automation scripts**: Dynamic subagent generation in CI/CD
4. **Sharing**: Easy copy-paste of subagent definitions

### Priority

CLI-defined subagents have priority:

- Higher than user-level (`~/.claude/agents/`)
- Lower than project-level (`.claude/agents/`)

## Plugin Integration

### Plugin Structure

```
plugins/my-plugin/
├── .claude-plugin/
│   └── marketplace.json
└── agents/
    ├── code-reviewer.md
    ├── test-runner.md
    └── debugger.md
```

### Registration

In `.claude-plugin/marketplace.json`:

```json
{
  "plugins": [
    {
      "name": "my-plugin",
      "agents": [
        "./agents/code-reviewer.md",
        "./agents/test-runner.md",
        "./agents/debugger.md"
      ]
    }
  ]
}
```

### Plugin Subagent Features

- Full configuration support (tools, model, description)
- Automatic loading when plugin installed
- Visible in `/agents` interface
- Can be overridden by project/user subagents
- Distributed via marketplace

## Advanced Usage Patterns

### Subagent Chaining

Complex workflows with multiple subagents:

```
> First use the code-analyzer subagent to find performance issues,
  then use the optimizer subagent to implement improvements,
  finally use the test-runner subagent to verify changes
```

### Conditional Delegation

Subagents with specific triggering conditions:

```yaml
---
name: security-scanner
description: Security vulnerability scanner. MUST BE USED before commits touching authentication, authorization, or sensitive data handling.
tools: Read, Grep, Bash(git:*)
---
```

### Specialized Tool Access

Subagents with unique tool combinations:

```yaml
---
name: api-integration-tester
description: API testing specialist for integration tests and endpoint validation.
tools: Read, Write, Bash(curl:*), Bash(jq:*), WebFetch
---
```

### Model Optimization

Choose models based on task characteristics:

```yaml
---
# Complex architectural review (use Opus)
name: architect-reviewer
model: opus
---

---
# Fast syntax checks (use Haiku)
name: syntax-checker
model: haiku
---

---
# Match conversation style (use inherit)
name: documentation-writer
model: inherit
---
```

## Performance Considerations

### Context Efficiency

**Benefits**:

- Each subagent starts with clean context
- Main conversation stays focused on high-level tasks
- Enables longer sessions without context bloat

**Trade-offs**:

- Subagent startup requires context gathering
- May add latency for context-heavy tasks
- Doesn't have conversation history

### Latency Optimization

**Reduce latency by**:

- Using `haiku` model for simple tasks
- Limiting tool access to essentials
- Including context-gathering in system prompt
- Batching related subagent calls

**Example**:

```yaml
---
name: fast-linter
description: Quick syntax and style checker
tools: Read, Grep  # Limited tools
model: haiku       # Fast model
---

Run quick syntax checks without heavy analysis.
Focus on obvious errors and style violations.
```

### Cost Optimization

**Reduce costs by**:

- Using appropriate models (haiku for simple tasks)
- Limiting subagent scope and tools
- Combining related tasks in single subagent
- Avoiding unnecessary subagent invocations

## Best Practices

### Design Principles

1. **Single responsibility**: Each subagent should have one clear purpose
2. **Clear boundaries**: Define exactly when and why to invoke
3. **Minimal tooling**: Grant only necessary tools
4. **Explicit process**: Document the subagent's workflow
5. **Measurable success**: Define what "done" looks like

### Description Guidelines

1. **Use action-oriented language**:
   - ✅ "Use PROACTIVELY after code changes"
   - ❌ "Can be used for code review"

2. **Include expertise keywords**:
   - ✅ "Expert debugger specializing in root cause analysis"
   - ❌ "Helps with bugs"

3. **Specify trigger conditions**:
   - ✅ "MUST BE USED before commits to main branch"
   - ❌ "Code review tool"

4. **Think about user intent**:
   - What words will users use?
   - What problem are they trying to solve?
   - When do they need this subagent?

### System Prompt Guidelines

1. **Define expertise clearly**: Set expectations for subagent capabilities
2. **Provide step-by-step process**: Guide the subagent through tasks
3. **Include examples**: Show expected behavior and output
4. **Set constraints**: Define what the subagent should NOT do
5. **Specify output format**: Help subagent provide consistent results

### Tool Permission Strategy

1. **Start minimal**: Begin with read-only tools
2. **Add incrementally**: Grant additional tools as needed
3. **Use patterns**: Restrict bash to specific commands
4. **Consider security**: Limit destructive operations
5. **Test thoroughly**: Verify tool access works correctly

## Troubleshooting

### Subagent Not Invoked Automatically

**Possible causes**:

1. Description doesn't match user's task phrasing
2. Another subagent has higher priority
3. Required tools not available
4. Name conflict with higher-priority subagent

**Solutions**:

1. Refine description with trigger keywords
2. Check `/agents` for conflicts
3. Verify tool access
4. Use explicit invocation to test

### Subagent Lacks Necessary Context

**Possible causes**:

1. Subagent context is isolated from main conversation
2. Context gathering not in system prompt
3. Missing necessary tools

**Solutions**:

1. Include context-gathering steps in system prompt
2. Grant tools needed to gather context (e.g., `Bash(git:*)`)
3. Provide explicit context in invocation

### Tool Permission Errors

**Possible causes**:

1. Tools field too restrictive
2. Bash pattern doesn't match command
3. MCP tools not inherited

**Solutions**:

1. Add necessary tools to `tools` field
2. Adjust bash patterns: `Bash(git:*)` not `Bash(git)`
3. Omit `tools` field to inherit all tools

## Related Documentation

- [Claude Code Plugins](https://docs.claude.com/en/docs/claude-code/plugins)
- [Slash Commands](https://docs.claude.com/en/docs/claude-code/slash-commands)
- [Skills](https://docs.claude.com/en/docs/claude-code/skills)
- [Hooks](https://docs.claude.com/en/docs/claude-code/hooks)
- [Settings and Tools](https://docs.claude.com/en/docs/claude-code/settings)
