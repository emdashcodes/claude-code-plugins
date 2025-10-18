---
name: claude-code-hooks
description: Claude Code hooks configuration patterns, event types, validation scripts, and decision control for automating workflows and integrating external tools. This skill should be used when creating hooks, validating tool usage, automating workflows, or integrating external tools with Claude Code.
---

# Claude Code Hooks

This skill provides assistance for working with Claude Code hooks to enable automation of workflows and integration of external tools through an event-driven system.

## About Hooks

Hooks are event-driven automation scripts that execute automatically when specific events occur during Claude Code's operation. Think of them as "middleware" for Claude's actions—they intercept events to validate inputs, enrich context, automate workflows, or integrate external tools, transforming Claude from a general assistant into a policy-aware, context-enriched agent.

### What Hooks Provide

1. **Input validation** - Block dangerous operations, enforce security policies, prevent path traversal
2. **Workflow automation** - Auto-format code, run linters, backup files, send notifications
3. **Context enrichment** - Load git status, inject project context, add session information
4. **External integration** - Connect to APIs, trigger CI/CD, log to external systems
5. **Decision control** - Auto-approve safe operations, require confirmation for sensitive actions

### Anatomy of a Hook

Every hook consists of configuration in settings.json and an optional validation script:

```
.claude/
├── settings.json         - Hook configuration (required)
│   └── hooks:
│       └── EventName:    - Which event to hook (PreToolUse, PostToolUse, etc.)
│           └── matcher:  - Which tools to match (regex pattern)
│               └── command: - What to execute (shell command or script)
└── hooks/                - Hook scripts (optional)
    └── script-name.py    - Validation/automation logic
```

#### Configuration (required)

Hooks are configured in settings.json with event type, tool matcher, and command:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/validate-bash.py",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

#### Hook Scripts (optional)

Scripts receive JSON via stdin and communicate via exit codes:

- **Exit 0** - Success (output shown in transcript or added as context)
- **Exit 2** - Blocking error (stderr shown to Claude for processing)
- **Other** - Non-blocking error (stderr shown to user)

Scripts can also output JSON for advanced control (permission decisions, additional context, custom output).

### Hook Execution Flow

Hooks use a three-phase execution system:

1. **Event triggered** - Claude performs action (e.g., runs Bash tool)
2. **Hook executes** - Script receives event data via stdin, processes, exits with code
3. **Decision applied** - Based on exit code/JSON output, Claude proceeds, blocks, or receives additional context

## Hook Events Overview

Claude Code supports these hook events:

**PreToolUse** - Execute before a tool runs. Use for validation, blocking dangerous operations, or auto-approving safe actions.

**PostToolUse** - Execute after a tool completes. Use for formatting code, running linters, sending notifications, or providing feedback to Claude.

**UserPromptSubmit** - Execute when user submits a prompt. Use for adding contextual information, validating prompt content, or blocking sensitive data.

**SessionStart** - Execute when Claude Code starts or resumes. Use for loading recent commits, showing current branch, displaying open issues, or initializing session context.

**SessionEnd** - Execute when a session ends. Use for saving statistics, cleaning temporary files, or logging activity.

**Stop/SubagentStop** - Execute when Claude attempts to stop. Use for ensuring tasks are complete or forcing continuation if needed.

**PreCompact** - Execute before conversation history compaction. Use for saving important context or logging stats.

**Notification** - Execute when Claude Code sends notifications. Use for forwarding to external systems or logging events.

For detailed information on each event type, see [references/hook-events.md](references/hook-events.md).

## Basic Hook Configuration

Hooks are configured in settings.json files with this structure:

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "path/to/script.py",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

**Key elements:**

- `matcher`: Pattern to match tool names (e.g., `"Write|Edit"`, `"Bash"`, `"*"` for all)
- `command`: Shell command or script to execute
- `timeout`: Maximum execution time in seconds (default: 60)

Use environment variables in commands:

- `CLAUDE_PROJECT_DIR` - Project root directory
- `CLAUDE_PLUGIN_ROOT` - Plugin directory (plugin hooks only)

## Hook Scripts

### Exit Codes

Hook scripts communicate through exit codes:

- `0` - Success (stdout shown in transcript, or added as context for UserPromptSubmit/SessionStart)
- `2` - Blocking error (stderr shown to Claude for processing)
- Other - Non-blocking error (stderr shown to user)

### Input Format

Hooks receive JSON via stdin with session information and event-specific data:

```python
#!/usr/bin/env python3
import json
import sys

input_data = json.load(sys.stdin)
tool_name = input_data.get("tool_name")
tool_input = input_data.get("tool_input", {})

# Hook logic here
sys.exit(0)
```

### Output Format

For simple hooks, use exit codes. For advanced control, output JSON:

```python
import json

output = {
    "decision": "block",  # or undefined
    "reason": "Explanation",
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "allow",  # "allow", "deny", "ask"
        "additionalContext": "Context for Claude"
    }
}

print(json.dumps(output))
sys.exit(0)
```

## Common Patterns

For detailed hook implementation:

- [references/implementation-guide.md](references/implementation-guide.md) - Quick patterns and complete examples
- [references/best-practices.md](references/best-practices.md) - Security, performance, and maintainability

## Configuration Locations

**User hooks:** `~/.claude/settings.json` - Personal preferences, cross-project automation

**Project hooks:** `.claude/settings.json` - Team workflows, project-specific validations

**Local hooks:** `.claude/settings.local.json` - Local testing, not committed to git

**Plugin hooks:** `plugins/{name}/hooks/hooks.json` - Reusable workflows for plugins

## MCP Integration

Hooks work with MCP tools using the naming pattern `mcp__<server>__<tool>`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__github__.*",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/validate-github.py"
          }
        ]
      }
    ]
  }
}
```

## Hook Creation Process

To create a hook, follow the "Hook Creation Process" in order, skipping steps only if there is a clear reason they are not applicable.

### Step 1: Understanding the Hook Requirements

Skip this step only when the hook's purpose and triggering conditions are already clearly understood.

To create an effective hook, clearly understand concrete examples of when the hook should trigger and what it should do. This understanding can come from either specific use cases or scenarios that need automation.

For example, when building a bash validation hook, relevant considerations include:

- "What dangerous bash commands should be blocked?"
- "Should the hook allow sudo/rm -rf commands, or block them entirely?"
- "What feedback should Claude receive when a command is blocked?"
- "Are there any commands that should always be allowed despite matching block patterns?"

For a code formatting hook:

- "Which file types need formatting? Python, JavaScript, both?"
- "Should formatting failures block the operation or just warn?"
- "What formatter tools are installed in the environment?"

Conclude this step when there is a clear sense of what the hook should accomplish and when it should trigger.

### Step 2: Planning the Hook Implementation

To turn requirements into an effective hook, analyze the use case by:

1. Identifying which hook event is appropriate (PreToolUse for validation, PostToolUse for formatting, etc.)
2. Determining the tool matcher pattern (specific tools like "Bash", wildcards like "Write|Edit", or "*" for all)
3. Deciding if a simple command or script is needed

Example: For blocking dangerous bash commands, the analysis shows:

1. Use **PreToolUse** event (validate before execution)
2. Match **"Bash"** tool specifically
3. Need a **script** with pattern matching and exit code 2 for blocking

Example: For auto-formatting code after edits, the analysis shows:

1. Use **PostToolUse** event (format after write completes)
2. Match **"Write|Edit"** tools
3. Need a **script** that detects file extension and runs appropriate formatter

Review [references/hook-events.md](references/hook-events.md) for event-specific details and [references/implementation-guide.md](references/implementation-guide.md) for code patterns.

### Step 3: Choosing Configuration Location

At this point, determine where the hook configuration should live:

- **User hooks** (`~/.claude/settings.json`) - Personal preferences that apply across all projects
- **Project hooks** (`.claude/settings.json`) - Team workflows and project-specific policies
- **Local hooks** (`.claude/settings.local.json`) - Testing and development, not committed to git
- **Plugin hooks** (`plugins/{name}/hooks/hooks.json`) - Reusable workflows distributed with plugins

Choose user-level for personal automation (e.g., "always load git context at session start").

Choose project-level for team policies (e.g., "block commits with sensitive data").

Choose local-level for testing hooks before committing to the project.

### Step 4: Implementing the Hook

When implementing the hook, start with the simplest approach that meets requirements.

#### For Simple Hooks

If the hook just needs to run a command without validation, use inline commands:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "black \"${file_path}\"",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

#### For Validation Hooks

If the hook needs to make decisions, create a script:

1. Create script file: `.claude/hooks/validate-bash.py`
2. Implement validation logic with exit codes (0 = allow, 2 = block, other = error)
3. Reference script in configuration with absolute path using `${CLAUDE_PROJECT_DIR}`

Reference [references/implementation-guide.md](references/implementation-guide.md) for quick patterns and production-ready examples.

**Writing Style:** Focus on information that would be beneficial and non-obvious to the hook script. Consider security implications, edge cases, and performance optimizations from [references/best-practices.md](references/best-practices.md).

### Step 5: Testing and Debugging

Once the hook is configured, test it thoroughly before relying on it:

#### Test Manually

Test the hook script independently before integrating:

```bash
# Create test input
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | \
  .claude/hooks/validate-bash.py

# Check exit code
echo "Exit code: $?"

# Check stderr output
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | \
  .claude/hooks/validate-bash.py 2>&1
```

#### Test in Claude Code

Run Claude Code with debug mode to see hook execution:

```bash
claude --debug
```

This shows:

- Hook loading and configuration
- Hook execution timing
- Hook output and exit codes
- Decision outcomes

Use transcript mode (Ctrl-R) to see hook progress messages in the conversation timeline.

### Step 6: Iterate

After deploying the hook, users may encounter edge cases or request improvements. This often happens during real usage when unexpected scenarios arise.

**Iteration workflow:**

1. **Use the hook** on real tasks and observe behavior
2. **Notice struggles** - Does it block too much? Too little? Miss edge cases?
3. **Identify improvements** - Should validation be stricter? Should error messages be clearer?
4. **Update implementation** - Modify script logic or configuration
5. **Test changes** - Use manual testing and `claude --debug` to verify improvements
