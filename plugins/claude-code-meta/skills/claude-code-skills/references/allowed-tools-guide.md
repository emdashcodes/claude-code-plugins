# allowed-tools Field Guide

Comprehensive guide to using the `allowed-tools` frontmatter field in Claude Code Skills.

## Overview

The `allowed-tools` field is a Claude Code-specific feature that restricts which tools Claude can use when a Skill is active. This provides three key benefits:

1. **Security** - Prevent Skills from performing unintended or dangerous operations
2. **Focus** - Keep Skills constrained to their specific purpose
3. **User Experience** - Avoid permission prompts for pre-approved tools

## Syntax

```yaml
---
name: my-skill
description: Skill description
allowed-tools: Read, Write, Edit, Bash(git:*), Grep
---
```

**Format:**

- Comma-separated list of tool names
- Tool names are case-sensitive
- Bash patterns use parentheses with glob patterns
- Whitespace around commas is optional

## Available Tools

Complete reference of all tools available in Claude Code for use in `allowed-tools` field.

### 1. File Operations

**Read** - Read files from filesystem

- Supports images, PDFs, Jupyter notebooks, and text files
- Use for: Code analysis, documentation extraction, examining configurations
- Example: `Read` to examine source files

**Write** - Create new files

- Overwrites if file already exists
- Use for: Generating new content, report creation, template instantiation
- Example: `Write` to create new documentation files

**Edit** - Modify existing files with exact string replacements

- Preserves file structure and formatting
- Use for: Code refactoring, configuration updates, in-place modifications
- Example: `Edit` to update configuration values

**Glob** - Find files by glob pattern

- Supports patterns like `**/*.js`, `src/**/*.tsx`
- Use for: File discovery, locating test files, finding configs
- Example: `Glob` to find all test files matching `**/*_test.py`

**Grep** - Search file contents with regex patterns

- Supports full regex syntax and output modes
- Use for: Code search, finding function definitions, log analysis
- Example: `Grep` to search for specific patterns in code

### 2. Code Editing

**NotebookEdit** - Edit Jupyter notebook cells

- Supports insert, delete, and replace operations
- Use for: Working with .ipynb files
- Example: `NotebookEdit` to modify notebook cells

### 3. Command Execution

**Bash** - Execute bash commands in persistent shell

- Can be restricted with patterns (see Bash Tool Patterns below)
- Use for: Running tests, git operations, build processes
- Example: `Bash(git:*)` to allow git commands only

**Bash Patterns** (restrict bash to specific commands):

- `Bash(git:*)` - Git commands only
- `Bash(npm:*)` - npm commands only
- `Bash(docker:*)` - Docker commands only
- `Bash(pytest:*)` - pytest commands only
- `Bash(bq:*)` - BigQuery CLI commands only
- `Bash` - All bash commands (use with caution)

**BashOutput** - Retrieve output from background bash shells

- Use for: Monitoring long-running background processes
- Example: `BashOutput` to check test run progress

**KillBash** - Terminate running background bash shells

- Use for: Cleaning up background processes
- Example: `KillBash` to stop a background server

### 4. Web and Search

**WebFetch** - Fetch and process web content with AI

- Converts HTML to markdown
- Use for: API documentation lookup, fetching external data
- Example: `WebFetch` to retrieve documentation from URLs

**WebSearch** - Search the web for up-to-date information

- Provides current information beyond model cutoff
- Use for: Research, fact-checking, finding recent information
- Example: `WebSearch` to find latest library versions

### 5. Task Management

**TodoWrite** - Create and manage structured task lists

- Use for: Planning complex workflows, tracking progress
- Example: `TodoWrite` to create task breakdown

**Task** - Launch specialized subagents for complex tasks

- Delegates to specialized agents with their own context
- Use for: Complex multi-step workflows, specialized analysis
- Example: `Task` to delegate to code-reviewer subagent

### 6. Workflow Control

**ExitPlanMode** - Exit planning mode and present plan to user

- Use for: Finalizing plans before implementation
- Example: `ExitPlanMode` after creating implementation plan

**SlashCommand** - Execute custom slash commands

- Use for: Triggering user-defined workflows
- Example: `SlashCommand` to run `/deploy` command

**AskUserQuestion** - Ask user questions during execution

- Use for: Gathering preferences, clarifying requirements
- Example: `AskUserQuestion` to choose deployment target

### 7. MCP Integration

**ListMcpResources** - List available MCP resources

- Use for: Discovering MCP server capabilities
- Example: `ListMcpResources` to see available resources

**ReadMcpResource** - Read specific MCP resource content

- Use for: Accessing MCP resource data
- Example: `ReadMcpResource` to read database schemas

**MCP Server Tools** - Tools provided by installed MCP servers

- Format: `mcp__<server-name>__<tool-name>`
- Inherited by default if `allowed-tools` field is omitted
- Example: `mcp__github__create_issue`, `mcp__slack__send_message`

To see available MCP tools, use `/mcp` in Claude Code.

## Bash Tool Patterns

The Bash tool supports glob patterns to allow specific command categories:

```yaml
# Allow all git commands
Bash(git:*)

# Allow specific git commands
Bash(git status:*), Bash(git diff:*)

# Allow npm commands
Bash(npm:*)

# Allow multiple command families
Bash(git:*), Bash(npm:*), Bash(ls:*)

# Allow all bash (not recommended for security)
Bash
```

**Pattern syntax:**

- `command:*` - All invocations of command
- `command subcommand:*` - Specific subcommand
- `*` - All bash (use sparingly)

## Common Patterns

### Read-Only Skills

Skills that should never modify files:

```yaml
allowed-tools: Read, Grep, Glob
```

**Use cases:**

- Code analysis
- Documentation extraction
- Security auditing
- Read-only data analysis

### File Editing Skills

Skills that modify files but don't execute code:

```yaml
allowed-tools: Read, Write, Edit, Glob, Grep
```

**Use cases:**

- Code refactoring
- Template generation
- Configuration updates
- Documentation generation

### Git Integration Skills

Skills that work with git repositories:

```yaml
allowed-tools: Read, Write, Edit, Bash(git:*), Grep, Glob
```

**Use cases:**

- Automated committing
- Branch management
- Code review workflows
- Repository analysis

### Testing Skills

Skills that run tests and analyze results:

```yaml
allowed-tools: Read, Bash(npm test:*), Bash(pytest:*), Grep, Glob
```

**Use cases:**

- Test execution
- Test result analysis
- Coverage reporting

### Web Research Skills

Skills that gather information from the web:

```yaml
allowed-tools: Read, WebFetch, WebSearch, Write
```

**Use cases:**

- Research tasks
- Documentation lookup
- API reference checking

### Deployment Skills

Skills that deploy code (use with caution):

```yaml
allowed-tools: Read, Bash(git:*), Bash(npm:*), Bash(docker:*), Grep
```

**Use cases:**

- Deployment workflows
- Build processes
- CI/CD integration

## Security Considerations

### Principle of Least Privilege

**Always grant the minimum tools necessary:**

❌ **Too permissive:**

```yaml
allowed-tools: Read, Write, Edit, Bash, WebFetch, WebSearch
```

✅ **Appropriately restricted:**

```yaml
allowed-tools: Read, Grep, Glob
```

### Dangerous Patterns to Avoid

**1. Unrestricted Bash**

```yaml
# Dangerous - allows any shell command
allowed-tools: Bash
```

**Better:**

```yaml
# Restricted to specific commands
allowed-tools: Bash(git:*), Bash(npm test:*)
```

**2. Write + Bash Together**

```yaml
# Potentially dangerous - can create and execute files
allowed-tools: Write, Bash
```

Only combine these when the Skill's purpose requires it and you trust the Skill's implementation.

**3. MCP Tools Without Specificity**

```yaml
# Too broad if MCP server has many tools
allowed-tools: mcp__github__*
```

**Better:**

```yaml
# Specific tools only
allowed-tools: mcp__github__create_issue, mcp__github__add_comment
```

### Auditing Skill Tool Usage

When reviewing Skills (especially from third parties), check:

1. **Does the Skill request more tools than it needs?**
2. **Are Bash patterns specific enough?**
3. **Does the Skill combine dangerous tool combinations?**
4. **Are MCP tools from trusted servers?**

## Determining Tools for Your Skill

### Step 1: List Required Operations

What does your Skill need to do?

- Read files? → `Read`
- Modify files? → `Edit` or `Write`
- Find files? → `Glob`
- Search code? → `Grep`
- Execute commands? → `Bash(...)`
- Access web? → `WebFetch` or `WebSearch`

### Step 2: Choose Minimum Set

Start with the smallest set and add only when necessary.

### Step 3: Test and Refine

Test the Skill. If Claude can't complete tasks, review what additional tools are needed.

### Step 4: Document Tool Usage

In your SKILL.md, explain why each tool is needed:

```markdown
## Tool Requirements

This skill requires the following tools:

- **Read**: To examine source files for analysis
- **Grep**: To search for specific patterns in code
- **Glob**: To find all test files matching `*_test.py`
- **Bash(pytest:*)**: To execute tests and capture output
```

## Examples from claude-code-meta Skills

### claude-code-hooks Skill

```yaml
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
```

**Reasoning:** Hooks skill needs to create hook scripts (Write), modify configs (Edit), execute hooks for testing (Bash), and search for examples (Grep, Glob).

### claude-code-slash-commands Skill

```yaml
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
```

**Reasoning:** Commands skill creates command files (Write), modifies existing ones (Edit), tests command execution (Bash), and searches for command patterns (Grep, Glob).

### claude-code-mcp Skill

```yaml
allowed-tools: Read, Bash, Grep
```

**Reasoning:** MCP configuration skill reads config files (Read), executes `claude mcp` commands (Bash), and searches for MCP patterns (Grep). Notably does NOT include Write/Edit as MCP configuration is typically done via CLI, not file editing.

## Troubleshooting

### Skill Can't Complete Task

**Symptom:** Claude reports it can't use a required tool.

**Solution:** Add the tool to `allowed-tools` or verify the tool name spelling.

### Permission Prompts Appear

**Symptom:** User gets permission prompts despite `allowed-tools`.

**Solution:** Ensure the tool is listed in `allowed-tools`. Check for typos in tool names (they're case-sensitive).

### Skill Uses Wrong Tool

**Symptom:** Claude uses an unexpected tool to accomplish a task.

**Solution:** This may indicate the `allowed-tools` list is too permissive. Restrict to only necessary tools.

### Bash Pattern Not Working

**Symptom:** Bash commands are blocked despite pattern.

**Solution:** Verify pattern syntax:

- `Bash(command:*)` not `Bash(command*)`
- `Bash(git status:*)` for specific subcommand
- Patterns are exact match on command prefix

## Best Practices

1. **Start Restrictive** - Begin with minimal tools and add as needed
2. **Document Choices** - Explain why each tool is required
3. **Test Thoroughly** - Verify the Skill works with the restricted toolset
4. **Audit Regularly** - Review and remove unnecessary tools
5. **Use Patterns** - For Bash, use specific patterns instead of wildcard
6. **Think Security** - Consider what could go wrong with each tool combination

## Reference: Complete Tool List

See the Claude Code documentation for the complete list of available tools and their capabilities.

Common tools include:

- File: Read, Write, Edit, Glob, Grep
- Execution: Bash, Task
- Web: WebFetch, WebSearch
- Claude Code: Skill, SlashCommand, AskUserQuestion
- MCP: mcp__<server>__<tool>

For MCP tools, use `/mcp` in Claude Code to see available servers and their tools.
