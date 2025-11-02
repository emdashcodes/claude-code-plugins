---
name: claude-code-slash-commands
description: This skill should be used when creating, configuring, or working with Claude Code slash commands. Use when users ask to create custom slash commands, set up command features like arguments or bash execution, or need guidance on slash command structure and best practices.
---

# Claude Code Slash Commands

Guide Claude through creating and configuring custom slash commands for Claude Code.

## Purpose

Slash commands let users define frequently-used prompts as Markdown files that Claude can execute on demand. This skill helps create well-structured slash commands with proper frontmatter, arguments, bash execution, and other advanced features.

## When to Use This Skill

Use this skill when:

- Creating new custom slash commands (project or personal)
- Adding arguments, bash execution, or file references to commands
- Configuring frontmatter options (allowed-tools, model, argument-hint, etc.)
- Troubleshooting slash command issues

## Command Types

### Project Commands

- Stored at: `.claude/commands/`
- Shared with the team (versioned in git)
- Shown as `(project)` in `/help`

### Personal Commands

- Stored at: `~/.claude/commands/`
- Available across all projects
- Shown as `(user)` in `/help`

### Plugin Commands

- Stored at: `commands/` in plugin root
- Distributed via plugin marketplaces
- Shown as `(plugin:plugin-name)` in `/help`
- Invoked with `/plugin-name:command-name` or just `/command-name`
- Support all features (arguments, frontmatter, bash, file references)

## Creating Slash Commands

### Quick Creation with Helper Script

Use the bundled creation script for fast, templated command setup:

```bash
# Create project command with basic template
scripts/create_slash_command.sh my-command --project

# Create personal command with advanced template
scripts/create_slash_command.sh my-command --user --template advanced

# Create plugin command (auto-detects plugin from current directory)
scripts/create_slash_command.sh my-command --plugin

# Create plugin command for specific plugin
scripts/create_slash_command.sh my-command --plugin my-plugin-name

# Available templates: basic, arguments, bash, advanced
```

The script is located at: `scripts/create_slash_command.sh`

**Plugin command creation:**

- Use `--plugin` to create commands in a plugin's `commands/` directory
- Auto-detects plugin when run from within a plugin directory
- Or specify plugin name: `--plugin my-plugin-name`
- Reminds you to register the command in `marketplace.json`

### Manual Creation

When creating commands manually, follow this structure:

1. **Choose scope** - Decide between:
   - Project: `.claude/commands/`
   - Personal: `~/.claude/commands/`
   - Plugin: `plugins/<plugin-name>/commands/`

2. **Create directory** - Ensure the target directory exists:

   ```bash
   mkdir -p .claude/commands            # Project
   mkdir -p ~/.claude/commands          # Personal
   mkdir -p plugins/my-plugin/commands  # Plugin
   ```

3. **Create file** - Named `command-name.md` (the filename becomes the command)

4. **Add frontmatter** - Include at minimum a `description` field

5. **Write instructions** - Clear, actionable prompts for Claude

6. **Register plugin commands** - If creating a plugin command:
   - Open `.claude-plugin/marketplace.json`
   - Find the plugin's entry in the `plugins` array
   - Add `"./commands/command-name.md"` to the plugin's `commands` array

## Available Templates

Four templates are provided in `assets/` for common use cases:

### Basic Template (`template-basic.md`)

Minimal slash command with just description and instructions.

**Use when:** Creating simple, straightforward prompts.

### Arguments Template (`template-with-arguments.md`)

Shows how to use `$ARGUMENTS`, `$1`, `$2`, etc. for parameterized commands.

**Use when:** Commands need user-provided input or parameters.

### Bash Template (`template-with-bash.md`)

Demonstrates bash command execution with the \`!\` prefix for gathering context.

**Use when:** Commands need git status, file listings, or other system context.

### Advanced Template (`template-advanced.md`)

Full-featured template with all frontmatter options, bash execution, arguments, and file references.

**Use when:** Building complex workflows or need multiple features.

## Frontmatter Options

All available frontmatter fields:

```yaml
---
description: Brief description shown in /help
argument-hint: [arg1] [arg2]
allowed-tools: Bash(git:*), Read, Write, Edit
model: claude-sonnet-4-5-20250929
disable-model-invocation: false
---
```

### Field Details

- **description** (required) - Brief description of what the command does
- **argument-hint** - Shown in autocomplete, helps users know what arguments to provide
- **allowed-tools** - Pre-approved tools the command can use (bypasses permission prompts)
- **model** - Specific model to use for this command (overrides conversation model)
- **disable-model-invocation** - Prevents SlashCommand tool from executing this command

## Advanced Features

### Arguments

Two ways to handle arguments:

**1. Capture all as string:**

```markdown
Fix issue #$ARGUMENTS following our coding standards
```

Usage: `/fix-issue 123 high-priority` → `$ARGUMENTS = "123 high-priority"`

**2. Individual positional arguments:**

```markdown
Review PR #$1 with priority $2 and assign to $3
```

Usage: `/review-pr 456 high alice` → `$1="456"`, `$2="high"`, `$3="alice"`

### Bash Command Execution

Execute bash commands inline to gather context:

```markdown
---
allowed-tools: Bash(git status:*), Bash(git diff:*)
---

## Context
- Current status: \`!\` `git status`
- Current diff: \`!\` `git diff HEAD`
```

**Important:** Commands prefixed with \`!\` run before the slash command is processed. Results are injected into the prompt.

### File References

Reference files using \`@\` prefix:

```markdown
Review the implementation in \@src/utils/helpers.js
Compare \@old-file.js with \@new-file.js
```

### Extended Thinking Mode

Trigger extended thinking by including keywords:

- "think carefully"
- "analyze thoroughly"
- "consider all implications"

## Workflow

When creating a new slash command:

1. **Understand requirements** - Ask user about:
   - Command purpose and when it should be used
   - Whether arguments are needed
   - What context (bash, files) should be gathered
   - Scope (project, personal, or plugin)

2. **Choose template** - Select the most appropriate template:
   - Basic for simple prompts
   - Arguments for parameterized commands
   - Bash for context-gathering commands
   - Advanced for complex workflows

3. **Use creation script or manual approach**:
   - Project: `scripts/create_slash_command.sh <name> --project --template <type>`
   - Personal: `scripts/create_slash_command.sh <name> --user --template <type>`
   - Plugin: `scripts/create_slash_command.sh <name> --plugin [plugin-name] --template <type>`
   - Manual: Create file in appropriate directory

4. **Customize content**:
   - Update frontmatter (especially description)
   - Write clear, actionable instructions
   - Add success criteria if applicable
   - Configure allowed-tools if using bash

5. **Register plugin commands** (plugin scope only):
   - Add command to `.claude-plugin/marketplace.json`
   - In the plugin's entry, add `"./commands/<command-name>.md"` to the `commands` array
   - The script will remind you of this step

6. **Test and iterate**:
   - Project/personal: Run with `/command-name`
   - Plugin: Run with `/plugin-name:command-name`
   - Verify it works as expected
   - Adjust based on results

## Reference Documentation

For detailed information about slash commands, refer to `references/slash-commands-reference.md`, which contains:

- Complete frontmatter field reference
- Permission rules and SlashCommand tool details
- MCP slash command integration
- Plugin command structure
- Skills vs slash commands comparison

Load this reference when users need detailed technical information beyond the workflow guidance in this skill.

## Best Practices

- **Keep it focused** - One command, one clear purpose
- **Use descriptive names** - Command names should indicate what they do
- **Document arguments** - Include argument-hint in frontmatter
- **Specify allowed-tools** - Pre-approve tools to avoid permission prompts
- **Test thoroughly** - Verify commands work before committing to project or publishing plugin
- **Consider scope** - Project for team workflows, personal for individual preferences, plugin for reusable/distributable commands
- **Register plugin commands** - Always update marketplace.json when creating plugin commands

## Skills vs Slash Commands

Help users choose between creating a skill or a slash command:

**Use Slash Commands when:**

- Single file is sufficient
- Simple, repeatable prompts
- Manual invocation desired
- Quick setup needed

**Use Skills when:**

- Multiple files/scripts needed
- Complex workflows required
- Automatic triggering desired
- Bundled resources beneficial

Both can coexist; recommend the approach that best fits the use case.
