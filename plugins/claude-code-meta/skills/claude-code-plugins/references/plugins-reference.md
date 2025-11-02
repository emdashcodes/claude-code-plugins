# Plugins Reference

Complete technical reference for the Claude Code plugin system, including schemas, CLI commands, and component specifications.

> **Tip:**
> For hands-on tutorials and practical usage, see [Plugins](https://docs.claude.com/en/docs/claude-code/plugins).
> For plugin management across teams and communities, see [Plugin marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces).

---

## Plugin Components Reference

This section documents the five types of components that plugins can provide:

### Commands

Plugins add custom slash commands that integrate with Claude Code's command system.
**Location:** `commands/` directory in plugin root
**File format:** Markdown files with frontmatter

- For details on command structure, invocation patterns, and features, see [Plugin commands](https://docs.claude.com/en/docs/claude-code/slash-commands#plugin-commands).

---

### Agents

Plugins can provide specialized subagents for specific tasks that Claude can invoke automatically.
**Location:** `agents/` directory in plugin root
**File format:** Markdown files describing agent capabilities

**Agent Structure Example:**
```
---
description: What this agent specializes in
capabilities: ["task1", "task2", "task3"]
---
# Agent Name
Detailed description of the agent's role, expertise, and when Claude should invoke it.

## Capabilities
- Specific task the agent excels at
- Another specialized capability
- When to use this agent vs others

## Context and examples
Provide examples of when this agent should be used and what problems it solves.
```

**Integration Points:**
- Agents appear in the `/agents` interface
- Claude can invoke agents automatically based on context
- Agents can be manually invoked by users
- Plugin agents work alongside built-in Claude agents

---

### Skills

Plugins can provide Agent Skills that extend Claude's capabilities.
Skills are model-invoked—Claude autonomously decides when to use them.

**Location:** `skills/` directory in plugin root
**File format:** Directories containing `SKILL.md` files with frontmatter

**Skill Structure Example:**
```
skills/
  ├── pdf-processor/
  │   ├── SKILL.md
  │   ├── reference.md (optional)
  │   └── scripts/ (optional)
  └── code-reviewer/
      └── SKILL.md
```

**Integration Behavior:**
- Plugin Skills are detected when the plugin is installed
- Claude invokes Skills based on context
- Skills can include supporting files

For SKILL.md format and authoring guidance, see:
- [Use Skills in Claude Code](https://docs.claude.com/en/docs/claude-code/skills)
- [Agent Skills overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview#skill-structure)

---

### Hooks

Plugins can provide event handlers that respond to Claude Code events automatically.

**Location:** `hooks/hooks.json` in plugin root, or inline in plugin.json
**Format:** JSON configuration with event matchers and actions

**Hook Configuration Example:**
```
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format-code.sh"
          }
        ]
      }
    ]
  }
}
```

**Available Events:**
- `PreToolUse`: Before tool use
- `PostToolUse`: After tool use
- `UserPromptSubmit`: When user submits prompt
- `Notification`: Claude Code notifications
- `Stop`: When Claude stops
- `SubagentStop`: Subagent attempts to stop
- `SessionStart` / `SessionEnd`
- `PreCompact`: Before history is compacted

**Hook Types:**
- `command`: Execute shell commands or scripts
- `validation`: Validate file/project state
- `notification`: Send alerts/status

---

### MCP Servers

Plugins can bundle Model Context Protocol (MCP) servers to connect Claude Code with external tools.

**Location:** `.mcp.json` in plugin root or inline in plugin.json
**Format:** Standard MCP server configuration

**MCP Server Example:**
```
{
  "mcpServers": {
    "plugin-database": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": { "DB_PATH": "${CLAUDE_PLUGIN_ROOT}/data" }
    },
    "plugin-api-client": {
      "command": "npx",
      "args": ["@company/mcp-server", "--plugin-mode"],
      "cwd": "${CLAUDE_PLUGIN_ROOT}"
    }
  }
}
```

**Integration Behavior:**
- MCP servers start automatically when enabled
- Servers appear as tools in Claude's toolkit
- Servers can be configured independently of user MCP servers

---

## Plugin Manifest Schema

The `plugin.json` file defines plugin metadata and configuration.

### Complete Schema Example

```
{
  "name": "plugin-name",
  "version": "1.2.0",
  "description": "Brief plugin description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://github.com/author"
  },
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "commands": ["./custom/commands/special.md"],
  "agents": "./custom/agents/",
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json"
}
```

---

### Required Fields

| Field   | Type   | Description                         | Example                  |
|---------|--------|-------------------------------------|--------------------------|
| `name`  | string | Unique identifier (kebab-case)      | `"deployment-tools"`     |

---

### Metadata Fields

| Field        | Type    | Description                    | Example                                |
|--------------|---------|--------------------------------|----------------------------------------|
| `version`    | string  | Semantic version               | `"2.1.0"`                              |
| `description`| string  | Brief explanation of purpose   | `"Deployment automation tools"`         |
| `author`     | object  | Author information             | `{"name": "Dev Team", "email": "dev@company.com"}` |
| `homepage`   | string  | Documentation URL              | `"https://docs.example.com"`           |
| `repository` | string  | Source code URL                | `"https://github.com/user/plugin"`     |
| `license`    | string  | License identifier             | `"MIT"`, `"Apache-2.0"`                |
| `keywords`   | array   | Discovery tags                 | `["deployment", "ci-cd"]`              |

---

### Component Path Fields

| Field        | Type         | Description                | Example                         |
|--------------|--------------|----------------------------|----------------------------------|
| `commands`   | string/array | Command files/directories  | `"./custom/cmd.md"`              |
| `agents`     | string/array | Additional agent files     | `"./custom/agents/"`             |
| `hooks`      | string/object| Hook config path or config | `"./hooks.json"`                 |
| `mcpServers` | string/object| MCP config path or config  | `"./mcp.json"`                   |

---

### Path Behavior Rules

**Important:**
Custom paths supplement default directories – they do **not** replace them.

- If `commands/` exists, it's loaded in addition to custom paths.
- All paths must be relative and start with `./`.
- Multiple paths can be specified as arrays.

**Example:**
```
{
  "commands": ["./specialized/deploy.md", "./utilities/batch-process.md"],
  "agents": ["./custom-agents/reviewer.md", "./custom-agents/tester.md"]
}
```

---

### Environment Variables

- `${CLAUDE_PLUGIN_ROOT}` contains the absolute path to your plugin directory.

**Example:**
```
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/process.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Plugin Directory Structure

### Standard Plugin Layout

A complete plugin example:
```
enterprise-plugin/
  ├── .claude-plugin/         # Metadata directory
  │   └── plugin.json         # Required manifest
  ├── commands/               # Default commands
  │   ├── status.md
  │   └── logs.md
  ├── agents/                 # Subagents
  │   ├── security-reviewer.md
  │   ├── performance-tester.md
  │   └── compliance-checker.md
  ├── skills/
  │   ├── code-reviewer/
  │   │   └── SKILL.md
  │   └── pdf-processor/
  │       ├── SKILL.md
  │       └── scripts/
  ├── hooks/
  │   ├── hooks.json
  │   └── security-hooks.json
  ├── .mcp.json
  ├── scripts/
  │   ├── security-scan.sh
  │   ├── format-code.py
  │   └── deploy.js
  ├── LICENSE
  └── CHANGELOG.md
```
> **Warning:**
> `.claude-plugin/` contains `plugin.json`.
> All other directories (commands/, agents/, skills/, hooks/) must be at the plugin root—not inside `.claude-plugin/`.

---

### File Locations Reference

| Component    | Default Location          | Purpose                     |
|--------------|--------------------------|-----------------------------|
| Manifest     | `.claude-plugin/plugin.json` | Metadata file             |
| Commands     | `commands/`              | Slash command markdown files|
| Agents       | `agents/`                | Subagent markdown files     |
| Skills       | `skills/`                | Agent Skills                |
| Hooks        | `hooks/hooks.json`       | Hook configuration          |
| MCP servers  | `.mcp.json`              | MCP server definitions      |

---

## Debugging and Development Tools

### Debugging Commands

To see plugin loading details, run:
```
claude --debug
```
This shows:
- Which plugins are loaded
- Plugin manifest errors
- Command/agent/hook registration
- MCP server initialization

---

### Common Issues

| Issue                | Cause                  | Solution                      |
|----------------------|-----------------------|-------------------------------|
| Plugin not loading   | Invalid `plugin.json` | Validate JSON syntax          |
| Commands missing     | Wrong structure       | Ensure `commands/` at root    |
| Hooks not firing     | Script not executable | Run `chmod +x script.sh`      |
| MCP server fails     | Missing env var       | Use `${CLAUDE_PLUGIN_ROOT}`   |
| Path errors          | Absolute paths used   | Use relative paths (`./`)     |

---

## Distribution and Versioning Reference

### Version Management

Follow semantic versioning for plugin releases.

---

## See Also

- [Plugins](https://docs.claude.com/en/docs/claude-code/plugins) – Tutorials and practical usage
- [Plugin marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces) – Marketplace management
- [Slash commands](https://docs.claude.com/en/docs/claude-code/slash-commands) – Command development
- [Subagents](https://docs.claude.com/en/docs/claude-code/sub-agents) – Agent configuration
- [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) – Extend capabilities
- [Hooks](https://docs.claude.com/en/docs/claude-code/hooks) – Automation
- [MCP](https://docs.claude.com/en/docs/claude-code/mcp) – Tool integration
- [Settings](https://docs.claude.com/en/docs/claude-code/settings) – Plugin configuration
