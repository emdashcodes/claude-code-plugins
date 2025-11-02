# Slash Commands Reference

Control Claude's behavior during an interactive session with slash commands.

---

## Built-in slash commands

| Command | Purpose |
|---------|---------|
| `/add-dir` | Add additional working directories |
| `/agents` | Manage custom AI subagents for specialized tasks |
| `/bug` | Report bugs (sends conversation to Anthropic) |
| `/clear` | Clear conversation history |
| `/compact [instructions]` | Compact conversation with optional focus instructions |
| `/config` | Open the Settings interface (Config tab) |
| `/cost` | Show token usage statistics ([cost tracking guide](https://docs.claude.com/en/docs/claude-code/costs#using-the-cost-command)) |
| `/doctor` | Checks the health of your Claude Code installation |
| `/help` | Get usage help |
| `/init` | Initialize project with CLAUDE.md guide |
| `/login` | Switch Anthropic accounts |
| `/logout` | Sign out from your Anthropic account |
| `/mcp` | Manage MCP server connections and OAuth authentication |
| `/memory` | Edit CLAUDE.md memory files |
| `/model` | Select or change the AI model |
| `/permissions` | View or update [permissions](https://docs.claude.com/en/docs/claude-code/iam#configuring-permissions) |
| `/pr_comments` | View pull request comments |
| `/review` | Request code review |
| `/sandbox` | Enable sandboxed bash tool for safer execution |
| `/rewind` | Rewind the conversation and/or code |
| `/status` | Open the Settings interface (Status tab) |
| `/terminal-setup` | Install Shift+Enter key binding for newlines (iTerm2 & VSCode only) |
| `/usage` | Show plan usage limits and rate limit status |
| `/vim` | Enter vim mode (insert & command modes) |

---

## Custom slash commands

Custom slash commands let you define frequently-used prompts as Markdown files that Claude Code can execute.
Commands are organized by scope (project-specific or personal) and support namespacing via directory structures.

### Syntax

```
/[arguments]
```

#### Parameters

| Parameter | Description |
|-----------|-------------|
|           | Name derived from the Markdown filename (no `.md` extension) |
| `[arguments]` | Optional arguments passed to the command |

### Command types

#### Project commands

- **Stored at:** `.claude/commands/`
- Shared with your team (shown as `(project)` in `/help`).

**Example:**
Create `/optimize` command:

```
mkdir -p .claude/commands
echo "Analyze this code for performance issues and suggest optimizations:" > .claude/commands/optimize.md
```

#### Personal commands

- **Stored at:** `~/.claude/commands/`
- Available across all projects (shown as `(user)` in `/help`).

**Example:**
Create `/security-review` command:

```
mkdir -p ~/.claude/commands
echo "Review this code for security vulnerabilities:" > ~/.claude/commands/security-review.md
```

### Features

#### Namespacing

- Organize commands in subdirectories.
- The folder name will show in descriptions, e.g., `(project:frontend)`.
- Base names build the command name; subdirectory is descriptive only.

Conflicts between user and project commands aren't supported, but you can have multiple commands with the same basename in different scopes.

#### Arguments

- **All arguments:** `$ARGUMENTS`
  Captures all arguments.

  **Example:**

  ```
  echo 'Fix issue #$ARGUMENTS following our coding standards' > .claude/commands/fix-issue.md
  # Usage:
  > /fix-issue 123 high-priority
  # $ARGUMENTS becomes: "123 high-priority"
  ```

- **Individual arguments:** `$1`, `$2`, etc.
  Positional, for more structured commands.

  **Example:**

  ```
  echo 'Review PR #$1 with priority $2 and assign to $3' > .claude/commands/review-pr.md
  # Usage:
  > /review-pr 456 high alice
  # $1="456", $2="high", $3="alice"
  ```

#### Bash command execution

- Prefix with `!` to execute bash commands before the slash command.
- Bash tool must be allowed via `allowed-tools` frontmatter.

  **Example:**

  ```
  ---
  allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
  description: Create a git commit
  ---
  ## Context
  - Current git status: ! `git status`
  - Current git diff: ! `git diff HEAD`
  - Current branch: ! `git branch --show-current`
  - Recent commits: ! `git log --oneline -10`
  ## Your task
  Based on the above changes, create a single git commit.
  ```

#### File references

- Use `@` prefix to reference files.

  ```
  Review the implementation in @src/utils/helpers.js
  Compare @src/old-version.js with @src/new-version.js
  ```

#### Thinking mode

- Trigger extended thinking by including [extended thinking keywords](https://docs.claude.com/en/docs/claude-code/common-workflows#use-extended-thinking).

### Frontmatter

Command files support frontmatter for metadata:

| Frontmatter         | Purpose                                        | Default           |
|---------------------|------------------------------------------------|-------------------|
| `allowed-tools`     | List of tools the command can use              | Inherits from conversation |
| `argument-hint`     | Shown to user for slash command autocomplete   | None              |
| `description`       | Brief description of the command               | First line of prompt |
| `model`             | Model string ([models](https://docs.claude.com/en/docs/about-claude/models/overview)) | Inherits from conversation |
| `disable-model-invocation` | Prevent `SlashCommand` tool from using this | false            |

**Example:**

```
---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
argument-hint: [message]
description: Create a git commit
model: claude-3-5-haiku-20241022
---
Create a git commit with message: $ARGUMENTS
```

---

## Plugin commands

Plugins can provide custom slash commands that work just like user-defined ones and are distributed via [plugin marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces).

### How plugin commands work

- **Namespaced:** Format `/plugin-name:command-name`
- **Available on install:** Appear in `/help` after install
- **Fully integrated**: Support all features (arguments, frontmatter, bash, file refs)

### Structure

- **Location:** `commands/` in plugin root
- **File format:** Markdown with frontmatter

**Example:**

```
---
description: Brief description of what the command does
---
# Command Name
Detailed instructions for Claude
```

Advanced features: Arguments with `{arg1}` placeholders, subdirectories for namespacing, bash integration, file references.

### Invocation patterns

- Direct command: `/command-name`
- Plugin prefixed: `/plugin-name:command-name`
- With arguments: `/command-name arg1 arg2`

---

## MCP slash commands

MCP servers can expose prompts as slash commands that are dynamically discovered and available in Claude Code.

### Command format

```
/mcp____ [arguments]
```

### Features

#### Dynamic discovery

MCP commands become available when:

- An MCP server is connected/active
- Server exposes prompts via MCP protocol
- Prompts are retrieved on connection

#### Arguments

- MCP prompts can accept arguments, e.g.:

  ```
  > /mcp__github__list_prs
  > /mcp__github__pr_review 456
  > /mcp__jira__create_issue "Bug title" high
  ```

#### Naming conventions

- Names are normalized (spaces→underscores, lowercased)
- No special characters in names

### Managing MCP connections

Use `/mcp` to:

- View/configure MCP servers
- Check status and authenticate
- Clear tokens
- View server tools/prompts

### MCP permissions and wildcards

Wildcards are **not supported** in permissions.

- Correct: `mcp__github`
- Correct: `mcp__github__get_issue`
- Incorrect: `mcp__github__*` (not supported)

---

## `SlashCommand` tool

The `SlashCommand` tool allows Claude to execute custom slash commands programmatically, if referenced by name with its slash.

**Example:**
> Run /write-unit-test when you are about to start writing tests.

**Supported commands:**

- Only user-defined commands with the `description` frontmatter are supported (not built-in).

You can see which custom slash commands the tool can invoke by running `claude --debug`.

### Disable `SlashCommand` tool

To prevent all slash commands from running via the tool:

```
/permissions
# Add to deny rules: SlashCommand
```

Or, to disable just a specific command, set `disable-model-invocation: true` in frontmatter.

### Permission rules

- **Exact match:** `SlashCommand:/commit`
- **Prefix match:** `SlashCommand:/review-pr:*`

### Character budget limit

The tool enforces a limit to avoid overflowing Claude context.

- **Default:** 15,000 characters
- **Custom:** Set via `SLASH_COMMAND_TOOL_CHAR_BUDGET` env

---

## Skills vs slash commands

| Aspect         | Slash Commands         | Agent Skills               |
|----------------|-----------------------|----------------------------|
| **Complexity** | Simple prompts        | Complex capabilities       |
| **Structure**  | Single .md file       | Directory + resources      |
| **Discovery**  | Manual (`/command`)   | Automatic (context-based)  |
| **Files**      | One file only         | Multiple files/scripts     |
| **Scope**      | Project or personal   | Project or personal        |
| **Sharing**    | Via git               | Via git                    |

### When to use

**Slash commands:**

- For quick, repeatable prompts in one file
- When you want explicit, manual control

**Agent Skills:**

- For automatic, structured capabilities
- When a workflow needs multiple files/scripts and detailed guidance

Both can coexist; use what matches your need.
Learn more about [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills).

---

## See also

- [Plugins](https://docs.claude.com/en/docs/claude-code/plugins) — extend Claude Code with custom commands
- [Identity and Access Management](https://docs.claude.com/en/docs/claude-code/iam) — permissions, MCP tool permissions
- [Interactive mode](https://docs.claude.com/en/docs/claude-code/interactive-mode) — shortcuts, input modes
- [CLI reference](https://docs.claude.com/en/docs/claude-code/cli-reference) — command-line flags and options
- [Settings](https://docs.claude.com/en/docs/claude-code/settings) — configuration options
- [Memory management](https://docs.claude.com/en/docs/claude-code/memory) — manage memory across sessions
