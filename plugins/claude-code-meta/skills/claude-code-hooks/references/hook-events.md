# Hook Events Reference

Complete reference for all Claude Code hook event types, their behaviors, and use cases.

## Claude Code Tools Reference

Complete list of all Claude Code tools that can be matched by hooks. Use these tool names in matcher patterns to intercept specific operations.

### Core File Operations

**Read** - Read file contents from the filesystem

- **Hook use cases**: Auto-approve documentation reads, audit sensitive file access, inject file context
- **Example matcher**: `"Read"`
- **Common validations**: Check for sensitive paths (.env, credentials), verify file exists in project

**Write** - Create new files or overwrite existing files

- **Hook use cases**: Format code after write, backup files, validate file paths, block overwriting sensitive files
- **Example matcher**: `"Write"`
- **Common validations**: Prevent path traversal, block sensitive file creation, enforce naming conventions

**Edit** - Modify existing files with find/replace operations

- **Hook use cases**: Auto-format after edits, run linters, create backup copies, validate changes
- **Example matcher**: `"Edit"` or `"Write|Edit"` for both
- **Common validations**: Block edits to sensitive files, verify file exists, check edit safety

**NotebookEdit** - Edit Jupyter notebook (.ipynb) cells

- **Hook use cases**: Validate notebook cell changes, auto-format code cells, backup notebooks
- **Example matcher**: `"NotebookEdit"`
- **Common validations**: Verify notebook structure, check cell types

### Code Search Operations

**Glob** - Find files matching glob patterns (e.g., `**/*.js`)

- **Hook use cases**: Audit file searches, restrict search scope, log search patterns
- **Example matcher**: `"Glob"`
- **Common validations**: Prevent searching outside project directory

**Grep** - Search file contents using regex patterns

- **Hook use cases**: Audit content searches, restrict search scope, log sensitive searches
- **Example matcher**: `"Grep"`
- **Common validations**: Block searches for credentials/secrets, limit search scope

### Command Execution

**Bash** - Execute shell commands

- **Hook use cases**: Block dangerous commands (rm -rf, sudo), validate command safety, log all commands
- **Example matcher**: `"Bash"`
- **Common validations**: Block rm -rf /, block sudo/su, prevent fork bombs, validate command syntax

**BashOutput** - Retrieve output from background bash shells

- **Hook use cases**: Monitor background processes, audit shell access
- **Example matcher**: `"BashOutput"`
- **Common validations**: Verify shell ID exists

**KillShell** - Terminate background bash shells

- **Hook use cases**: Audit process termination, log killed shells
- **Example matcher**: `"KillShell"`
- **Common validations**: Verify shell exists before killing

### Sub-agent Operations

**Task** - Launch specialized sub-agents for complex tasks

- **Hook use cases**: Audit sub-agent usage, log agent launches, validate agent permissions
- **Example matcher**: `"Task"`
- **Common validations**: Verify agent type exists, check permissions for agent launch

**ExitPlanMode** - Exit planning mode and begin execution

- **Hook use cases**: Validate plan completeness, log plan approval
- **Example matcher**: `"ExitPlanMode"`
- **Common validations**: Ensure plan is documented

### Web Operations

**WebFetch** - Fetch and process web content with AI

- **Hook use cases**: Audit web requests, block sensitive URLs, log external access
- **Example matcher**: `"WebFetch"`
- **Common validations**: Whitelist/blacklist domains, prevent credential URLs

**WebSearch** - Search the web using search engines

- **Hook use cases**: Audit search queries, log searches, restrict search topics
- **Example matcher**: `"WebSearch"`
- **Common validations**: Block sensitive search terms

### Task Management

**TodoWrite** - Create and update todo lists for task tracking

- **Hook use cases**: Audit task creation, log todo changes, validate task structure
- **Example matcher**: `"TodoWrite"`
- **Common validations**: Verify todo format, check task descriptions

### MCP (Model Context Protocol) Tools

**ListMcpResources** - List available resources from MCP servers

- **Hook use cases**: Audit MCP resource access, log resource queries
- **Example matcher**: `"ListMcpResources"`

**ReadMcpResource** - Read content from MCP server resources

- **Hook use cases**: Audit MCP resource reads, log accessed resources
- **Example matcher**: `"ReadMcpResource"`

**MCP server tools** - External tools provided by MCP servers

- **Naming pattern**: `mcp__<server>__<tool>`
- **Examples**:
  - `mcp__filesystem__read_file`
  - `mcp__github__create_issue`
  - `mcp__postgres__query`
  - `mcp__slack__send_message`
- **Hook use cases**: Validate MCP operations, audit external API calls, enforce MCP policies
- **Example matchers**:
  - `"mcp__.*"` - All MCP tools
  - `"mcp__github__.*"` - All GitHub operations
  - `"mcp__.*__write.*"` - All write operations across MCP servers
  - `"mcp__postgres__.*"` - All PostgreSQL operations

### Common Matcher Patterns

Combine multiple tools using regex:

- `"Write|Edit"` - Match file write or edit operations
- `"Glob|Grep"` - Match any search operation
- `"Bash|BashOutput|KillShell"` - Match all bash-related operations
- `"Read|Write|Edit"` - Match all file operations
- `"WebFetch|WebSearch"` - Match all web operations
- `"Task|ExitPlanMode"` - Match agent-related operations
- `"mcp__.*"` - Match all MCP tool calls
- `"*"` or `""` - Match all tools

## PreToolUse

Execute after Claude creates tool parameters but before processing the tool call.

### Common Matchers

- `Bash` - Shell commands
- `Write|Edit` - File modifications
- `Read` - File reading
- `Glob|Grep` - File searching
- `mcp__.*` - All MCP tools
- `*` or `""` - All tools

### Use Cases

- Validate inputs before tool execution
- Block dangerous operations
- Auto-approve safe operations
- Modify tool parameters
- Enforce security policies

### Input Schema

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/directory",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  }
}
```

### Exit Code Behavior

- **Exit 0**: Allow tool to proceed
- **Exit 2**: Block tool call, show stderr to Claude
- **Other**: Non-blocking error, show stderr to user

### JSON Output for Permission Control

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",  // "allow", "deny", "ask"
    "permissionDecisionReason": "Documentation file auto-approved"
  },
  "suppressOutput": true
}
```

**Permission decisions:**

- `allow` - Bypass permission system, proceed automatically
- `deny` - Block tool call, show reason to Claude
- `ask` - Prompt user for confirmation

## PostToolUse

Execute immediately after a tool completes successfully.

### Common Matchers

Same as PreToolUse

### Use Cases

- Format code after writing
- Run linters after edits
- Send notifications
- Log tool usage
- Provide feedback to Claude
- Trigger CI/CD workflows

### Input Schema

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/directory",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  },
  "tool_response": {
    "filePath": "/path/to/file.txt",
    "success": true
  }
}
```

### Exit Code Behavior

- **Exit 0**: Success, stdout shown in transcript
- **Exit 2**: Show stderr to Claude (tool already ran)
- **Other**: Non-blocking error, show stderr to user

### JSON Output for Feedback

```json
{
  "decision": "block",  // or undefined
  "reason": "Formatting failed",
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "File formatting completed. All style rules applied."
  }
}
```

## UserPromptSubmit

Execute when user submits a prompt, before Claude processes it.

### Matchers

Not applicable - no matcher needed for this event

### Use Cases

- Add contextual information
- Validate prompt content
- Block prompts with sensitive data
- Inject current environment state
- Load project-specific context

### Input Schema

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/directory",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "User's submitted prompt text"
}
```

### Exit Code Behavior

- **Exit 0**: stdout added as context for Claude
- **Exit 2**: Not applicable for UserPromptSubmit
- **Other**: Error, stderr shown to user

### JSON Output for Blocking

```json
{
  "decision": "block",  // Prevents prompt processing
  "reason": "Security: Potential secret detected. Please rephrase.",
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "Additional context added to prompt"
  }
}
```

**Blocking behavior:**

- `decision: "block"` - Prompt is erased, not processed
- `reason` - Shown to user (not added to context)
- `additionalContext` - Added to context if not blocked

## SessionStart

Execute when Claude Code starts or resumes a session.

### Matchers

- `startup` - New session started
- `resume` - Session resumed
- `clear` - After /clear command
- `compact` - After compaction

### Use Cases

- Load recent git commits
- Show current branch and status
- Display open issues
- Check environment state
- Initialize session context

### Input Schema

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "hook_event_name": "SessionStart",
  "source": "startup"  // or "resume", "clear", "compact"
}
```

### Exit Code Behavior

- **Exit 0**: stdout added as context for Claude
- **Exit 2**: Not applicable
- **Other**: Error logged to debug

### JSON Output for Context

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "## Recent Commits\n\n[git log output]"
  }
}
```

## SessionEnd

Execute when a Claude Code session ends.

### Matchers

Not applicable

### Use Cases

- Save session statistics
- Clean temporary files
- Log activity
- Backup work
- Send notifications

### Input Schema

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/directory",
  "hook_event_name": "SessionEnd",
  "reason": "exit"  // "clear", "logout", "prompt_input_exit", "other"
}
```

### Exit Code Behavior

- **Exit 0**: Success, logged to debug
- **Exit 2**: Not applicable
- **Other**: Error logged to debug

**Note:** SessionEnd hooks cannot block session termination.

## Stop

Execute when the main Claude Code agent attempts to stop.

### Matchers

Not applicable

### Use Cases

- Ensure tasks are complete
- Run final checks
- Force Claude to continue if needed
- Validate outputs

### Input Schema

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "hook_event_name": "Stop",
  "stop_hook_active": false  // true if already continuing from Stop hook
}
```

### Exit Code Behavior

- **Exit 0**: Allow Claude to stop
- **Exit 2**: Block stopping, show stderr to Claude
- **Other**: Error shown to user

### JSON Output for Continuation

```json
{
  "decision": "block",  // Prevents Claude from stopping
  "reason": "Tasks incomplete. Please finish pending work."
}
```

**Important:** Check `stop_hook_active` to prevent infinite loops. If true, allow Claude to stop.

## SubagentStop

Execute when a sub-agent (Task tool call) attempts to stop.

### Matchers

Not applicable

### Use Cases

Same as Stop event, but for sub-agents

### Input Schema

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "hook_event_name": "SubagentStop",
  "stop_hook_active": false
}
```

### Exit Code Behavior

- **Exit 0**: Allow sub-agent to stop
- **Exit 2**: Block stopping, show stderr to sub-agent
- **Other**: Error shown to user

### JSON Output for Continuation

Same as Stop event.

## PreCompact

Execute before Claude Code compacts conversation history.

### Matchers

- `manual` - /compact command
- `auto` - Automatic compaction

### Use Cases

- Save important context
- Log conversation statistics
- Prepare for compaction

### Input Schema

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "hook_event_name": "PreCompact",
  "trigger": "manual",  // or "auto"
  "custom_instructions": ""  // From /compact args (manual only)
}
```

### Exit Code Behavior

- **Exit 0**: Success, logged to debug
- **Exit 2**: Not applicable
- **Other**: Error shown to user

**Note:** PreCompact hooks cannot block compaction.

## Notification

Execute when Claude Code sends notifications.

### Matchers

Not applicable

### Use Cases

- Forward notifications to external systems
- Log notification events
- Trigger alerts

### Notifications Sent

- Permission requests: "Claude needs your permission to use Bash"
- Idle prompts: "Claude is waiting for your input" (after 60s)

### Input Schema

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/directory",
  "hook_event_name": "Notification",
  "message": "Claude needs your permission to use Bash"
}
```

### Exit Code Behavior

- **Exit 0**: Success, logged to debug only
- **Exit 2**: Not applicable
- **Other**: Error logged to debug

## Hook Execution Details

### Timeout

- Default: 60 seconds per hook
- Configurable per command via `timeout` field
- Individual command timeout doesn't affect other commands

### Parallelization

- All matching hooks run in parallel
- Multiple hooks can respond to same event

### Environment

- Runs in current directory
- `CLAUDE_PROJECT_DIR` environment variable available
- Contains absolute path to project root

### Input/Output

- **PreToolUse/PostToolUse/Stop/SubagentStop**: Progress shown in transcript (Ctrl-R)
- **Notification/SessionEnd**: Logged to debug only (`--debug`)
- **UserPromptSubmit/SessionStart**: stdout added as context for Claude

## MCP Tool Naming

MCP tools follow the pattern `mcp__<server>__<tool>`:

- `mcp__filesystem__read_file`
- `mcp__github__create_issue`
- `mcp__postgres__query`

Match MCP tools with:

- `mcp__.*` - All MCP tools
- `mcp__github__.*` - All GitHub server tools
- `mcp__.*__write.*` - All write operations across servers
