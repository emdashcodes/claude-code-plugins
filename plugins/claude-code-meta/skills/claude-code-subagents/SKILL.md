---
name: claude-code-subagents
description: This skill should be used when creating, configuring, or working with Claude Code subagents. Use when users ask to create custom subagents, set up subagent configurations, manage tool permissions, or need guidance on subagent architecture and best practices.
---

# Claude Code Subagents

Guide Claude through creating and configuring specialized subagents for Claude Code.

## Purpose

Subagents are pre-configured AI personalities that handle specific types of tasks with their own context windows, custom system prompts, and tool configurations. This skill helps create well-structured subagents that improve task delegation, context management, and specialized workflows.

## When to Use This Skill

Use this skill when:

- Creating new custom subagents (project, personal, or plugin)
- Configuring subagent properties (tools, model, system prompts)
- Setting up specialized workflows with subagent delegation
- Troubleshooting subagent invocation or behavior

## Subagent Types

### Project Subagents

- Stored at: `.claude/agents/`
- Shared with the team (versioned in git)
- Highest priority when name conflicts occur
- Team-specific workflows and conventions

### Personal Subagents

- Stored at: `~/.claude/agents/`
- Available across all projects
- Lower priority than project subagents
- Personal preferences and workflows

### Plugin Subagents

- Stored at: `agents/` in plugin root
- Distributed via plugin marketplaces
- Shown as `(plugin:plugin-name)` in `/agents`
- Support all configuration features
- Can be invoked explicitly or automatically

## Creating Subagents

### Quick Creation with Helper Script

Use the bundled creation script for fast, templated subagent setup:

```bash
# Create project subagent with code-reviewer template
scripts/create_subagent.sh code-reviewer --project --template code-reviewer

# Create personal subagent with custom template
scripts/create_subagent.sh my-agent --user --template debugger

# Create plugin subagent (auto-detects plugin from current directory)
scripts/create_subagent.sh my-agent --plugin

# Create plugin subagent for specific plugin
scripts/create_subagent.sh my-agent --plugin my-plugin-name

# Available templates: code-reviewer, debugger, custom
```

The script is located at: `scripts/create_subagent.sh`

**Plugin subagent creation:**

- Use `--plugin` to create subagents in a plugin's `agents/` directory
- Auto-detects plugin when run from within a plugin directory
- Or specify plugin name: `--plugin my-plugin-name`
- Reminds you to register the subagent in `marketplace.json`

### Using the /agents Command

The `/agents` command provides an interactive interface:

- View all subagents (built-in, user, project, plugin)
- Create new subagents with guided setup
- Generate subagents with Claude's assistance
- Edit custom subagents including tool access
- Delete custom subagents
- See which subagents are active when duplicates exist
- Manage tool permissions easily

**Recommended workflow:**

1. Run `/agents`
2. Select 'Create New Agent'
3. Choose scope (project/user)
4. Let Claude generate the subagent based on your description
5. Press `e` to edit the system prompt in your editor
6. Customize as needed

### Manual Creation

When creating subagents manually, follow this structure:

1. **Choose scope** - Decide between:
   - Project: `.claude/agents/`
   - Personal: `~/.claude/agents/`
   - Plugin: `plugins/<plugin-name>/agents/`

2. **Create directory** - Ensure the target directory exists:

   ```bash
   mkdir -p .claude/agents            # Project
   mkdir -p ~/.claude/agents          # Personal
   mkdir -p plugins/my-plugin/agents  # Plugin
   ```

3. **Create file** - Named `agent-name.md` (the filename becomes the agent name)

4. **Add frontmatter** - Include required fields:

   ```yaml
   ---
   name: agent-name
   description: Description of when this subagent should be invoked
   tools: Read, Write, Edit, Bash(git:*)  # Optional; inherits all if omitted
   model: sonnet                          # Optional; sonnet/opus/haiku/inherit
   ---
   ```

5. **Write system prompt** - Clear, detailed instructions defining the subagent's role, capabilities, and approach

6. **Register plugin subagents** - If creating a plugin subagent:
   - Open `.claude-plugin/marketplace.json`
   - Find the plugin's entry in the `plugins` array
   - Add `"./agents/agent-name.md"` to the plugin's `agents` array

## Available Templates

Three templates are provided in `assets/` for common use cases:

### Code Reviewer (`code-reviewer.md`)

Senior code reviewer focused on quality, security, and maintainability.

**Use when:** Need automated code review after changes.

**Features:**

- Proactive invocation after code modifications
- Comprehensive review checklist
- Priority-based feedback organization
- Security vulnerability detection

### Debugger (`debugger.md`)

Expert debugger for root cause analysis and issue resolution.

**Use when:** Encountering errors, test failures, or unexpected behavior.

**Features:**

- Systematic debugging process
- Hypothesis formation and testing
- Strategic logging recommendations
- Root cause identification

### Custom Template (`custom.md`)

Blank template for building specialized subagents.

**Use when:** Need a starting point for unique workflows.

## Configuration Reference

### Frontmatter Fields

All available frontmatter fields:

```yaml
---
name: agent-name                    # Required: lowercase, hyphens only
description: When to invoke agent   # Required: specific, action-oriented
tools: Read, Write, Bash(git:*)    # Optional: comma-separated list
model: sonnet                      # Optional: sonnet/opus/haiku/inherit
---
```

### Field Details

- **name** (required) - Unique identifier (lowercase, alphanumeric + hyphens)
- **description** (required) - Natural language description of when the subagent should be invoked
- **tools** (optional) - Comma-separated list of allowed tools; inherits all if omitted
- **model** (optional) - Model to use: `sonnet`, `opus`, `haiku`, or `inherit` (matches conversation model)

### Tool Configuration

Subagents can use Claude Code's internal tools. Examples:

```yaml
# Inherit all tools (including MCP tools)
# Omit the tools field entirely

# Specific tools only
tools: Read, Write, Edit, Grep, Glob

# Bash with patterns
tools: Bash(git:*), Bash(npm:*), Read

# Limited toolset for security
tools: Read, Grep
```

See full tool list in references documentation.

## Workflow

When creating a new subagent:

1. **Understand requirements** - Ask user about:
   - Subagent purpose and specialization
   - When it should be invoked (automatic vs explicit)
   - What tools it needs access to
   - Scope (project, personal, or plugin)

2. **Choose template** - Select the most appropriate template:
   - Code-reviewer for code quality checks
   - Debugger for troubleshooting workflows
   - Custom for unique specialized needs

3. **Use creation method**:
   - **Recommended**: `/agents` command for guided setup
   - **Script**: `scripts/create_subagent.sh <name> --<scope> --template <type>`
   - **Manual**: Create file in appropriate directory

4. **Customize configuration**:
   - Update frontmatter (especially description)
   - Configure tool access if needed
   - Select appropriate model
   - Write clear, detailed system prompt

5. **Write effective system prompt**:
   - Define the subagent's role and expertise
   - Specify the workflow or process to follow
   - Include success criteria and best practices
   - Add examples if helpful
   - Use imperative/infinitive form (verb-first)

6. **Register plugin subagents** (plugin scope only):
   - Add subagent to `.claude-plugin/marketplace.json`
   - In the plugin's entry, add `"./agents/<agent-name>.md"` to the `agents` array
   - The script will remind you of this step

7. **Test and iterate**:
   - Test automatic invocation with matching tasks
   - Test explicit invocation: "Use the X subagent to..."
   - Verify tool access works as expected
   - Adjust description for better delegation
   - Refine system prompt based on results

## Invocation Patterns

### Automatic Delegation

Claude Code automatically delegates based on:

- Task description matching subagent `description`
- Context and available tools
- Current conversation needs

**Tips for better automatic delegation:**

- Use proactive language in description: "Use PROACTIVELY when...", "MUST BE USED for..."
- Be specific about trigger conditions
- Include keywords users are likely to use

### Explicit Invocation

Users can request subagents directly:

```
> Use the code-reviewer subagent to check my recent changes
> Have the debugger subagent investigate this error
> Ask the data-scientist subagent to analyze user growth
```

### Chaining Subagents

For complex workflows:

```
> First use the code-analyzer subagent to find issues, then use the optimizer subagent to fix them
```

## Reference Documentation

For detailed information about subagents, refer to `references/subagents-reference.md`, which contains:

- Complete subagent architecture details
- File format specification
- Tool permission system
- Model selection guide
- Performance considerations
- Advanced usage patterns
- CLI-based subagent configuration

Load this reference when users need detailed technical information beyond the workflow guidance in this skill.

## Best Practices

- **Focus on single responsibility** - Each subagent should have a clear, specific purpose
- **Write detailed system prompts** - Include role, process, examples, and constraints
- **Use proactive descriptions** - Help Claude know when to delegate automatically
- **Limit tool access appropriately** - Grant only necessary tools for security and focus
- **Test both invocation types** - Verify automatic and explicit invocation work
- **Consider context efficiency** - Subagents help preserve main context for longer sessions
- **Version control project subagents** - Share team workflows via git
- **Document expected behavior** - Include examples in system prompt when helpful
approach that best fits the use case. Subagents and skills can work together—skills can include instructions for when to delegate to specific subagents.
