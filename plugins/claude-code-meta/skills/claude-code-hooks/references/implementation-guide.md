# Hook Implementation Guide

Progressive guide from quick code templates to production-ready examples.

## Quick Patterns

Minimal code templates for common hook use cases. Copy and customize these patterns for rapid development.

### Pattern 1: Input Validation

Validate tool inputs before execution to enforce policies and prevent errors.

```python
#!/usr/bin/env python3
import json
import sys
import re

# Load input
try:
    input_data = json.load(sys.stdin)
except json.JSONDecodeError as e:
    print(f"Invalid JSON: {e}", file=sys.stderr)
    sys.exit(1)

tool_name = input_data.get("tool_name")
tool_input = input_data.get("tool_input", {})

# Validate based on tool type
if tool_name == "Bash":
    command = tool_input.get("command", "")

    # Define validation rules
    dangerous_patterns = [
        (r'\brm\s+-rf\s+/', "Dangerous rm -rf detected"),
        (r'\b(sudo|su)\b', "Elevated privileges not allowed"),
        (r'>\s*/dev/sd[a-z]', "Direct device access blocked"),
    ]

    for pattern, message in dangerous_patterns:
        if re.search(pattern, command):
            print(message, file=sys.stderr)
            sys.exit(2)  # Block the command

# Allow operation
sys.exit(0)
```

**Settings configuration:**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PROJECT_DIR}\"/.claude/hooks/validate-bash.py"
          }
        ]
      }
    ]
  }
}
```

### Pattern 2: Auto-Format After Edit

Automatically format code after file modifications.

```python
#!/usr/bin/env python3
import json
import sys
import subprocess

input_data = json.load(sys.stdin)
tool_name = input_data.get("tool_name")
file_path = input_data.get("tool_input", {}).get("file_path", "")

# Only process file write/edit operations
if tool_name not in ["Write", "Edit"]:
    sys.exit(0)

# Format based on file extension
formatters = {
    ".py": ["black", file_path],
    ".js": ["prettier", "--write", file_path],
    ".ts": ["prettier", "--write", file_path],
    ".rs": ["rustfmt", file_path],
    ".go": ["gofmt", "-w", file_path],
}

# Find appropriate formatter
for ext, cmd in formatters.items():
    if file_path.endswith(ext):
        try:
            subprocess.run(cmd, check=True, timeout=30)
            print(f"Formatted {file_path}")
            sys.exit(0)
        except subprocess.CalledProcessError as e:
            print(f"Formatting failed: {e}", file=sys.stderr)
            sys.exit(1)
        except subprocess.TimeoutExpired:
            print("Formatting timed out", file=sys.stderr)
            sys.exit(1)

# No formatter needed
sys.exit(0)
```

### Pattern 3: Add Session Context

Load project context at session start.

```python
#!/usr/bin/env python3
import json
import sys
import subprocess

input_data = json.load(sys.stdin)

def run_git_command(args):
    """Run git command and return output"""
    try:
        result = subprocess.run(
            ["git"] + args,
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.stdout if result.returncode == 0 else ""
    except Exception:
        return ""

# Gather project context
git_status = run_git_command(["status", "--short"])
git_branch = run_git_command(["branch", "--show-current"])
git_log = run_git_command(["log", "--oneline", "-5"])

# Build context message
context = f"""## Project Context

**Current Branch:** {git_branch.strip()}

**Modified Files:**
{git_status or "No changes"}

**Recent Commits:**
{git_log}
"""

# Output context for Claude
print(context)
sys.exit(0)
```

### Pattern 4: Permission Control

Auto-approve safe operations, block dangerous ones.

```python
#!/usr/bin/env python3
import json
import sys

input_data = json.load(sys.stdin)
tool_name = input_data.get("tool_name")
tool_input = input_data.get("tool_input", {})

# Auto-approve reading documentation files
if tool_name == "Read":
    file_path = tool_input.get("file_path", "")
    safe_extensions = (".md", ".txt", ".json", ".yaml", ".yml")

    if file_path.endswith(safe_extensions):
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow",
                "permissionDecisionReason": "Documentation file auto-approved"
            },
            "suppressOutput": True
        }
        print(json.dumps(output))
        sys.exit(0)

# Auto-deny sensitive file operations
if tool_name in ["Write", "Edit"]:
    file_path = tool_input.get("file_path", "")
    sensitive_paths = (".env", ".git/", "id_rsa", "credentials")

    if any(p in file_path for p in sensitive_paths):
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": "Sensitive file modification blocked"
            }
        }
        print(json.dumps(output))
        sys.exit(0)

# Default: let normal permission flow proceed
sys.exit(0)
```

### Pattern 5: Path Safety Validation

Prevent path traversal attacks.

```python
#!/usr/bin/env python3
import json
import sys
import os
from pathlib import Path

def is_safe_path(base_dir, file_path):
    """Check if file_path is within base_dir (no path traversal)"""
    try:
        base = Path(base_dir).resolve()
        target = Path(file_path).resolve()
        return target.is_relative_to(base)
    except (ValueError, OSError):
        return False

input_data = json.load(sys.stdin)
tool_name = input_data.get("tool_name")

# Check file operations
if tool_name in ["Write", "Edit", "Read"]:
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR")
    file_path = input_data.get("tool_input", {}).get("file_path")

    if not project_dir or not file_path:
        sys.exit(0)

    if not is_safe_path(project_dir, file_path):
        print("Path traversal detected - operation blocked", file=sys.stderr)
        sys.exit(2)

sys.exit(0)
```

### Pattern 6: Security Validation

Check prompts for sensitive data before processing.

```python
#!/usr/bin/env python3
import json
import sys
import re

input_data = json.load(sys.stdin)
prompt = input_data.get("prompt", "")

# Define sensitive patterns
sensitive_patterns = [
    (r'ghp_[a-zA-Z0-9]{36}', "GitHub personal access token"),
    (r'sk_live_[a-zA-Z0-9]{24}', "Stripe API key"),
    (r'xoxb-[a-zA-Z0-9-]+', "Slack bot token"),
    (r'-----BEGIN (?:RSA )?PRIVATE KEY-----', "Private key"),
    (r'(?i)\bpassword\s*[:=]\s*["\']?[\w!@#$%^&*]+', "Password"),
]

# Check for sensitive data
for pattern, description in sensitive_patterns:
    if re.search(pattern, prompt):
        output = {
            "decision": "block",
            "reason": f"Security: {description} detected in prompt. Please remove sensitive data."
        }
        print(json.dumps(output))
        sys.exit(0)

# Prompt is safe
sys.exit(0)
```

### Pattern 7: PostToolUse Feedback

Provide additional context to Claude after tool execution.

```python
#!/usr/bin/env python3
import json
import sys
import subprocess

input_data = json.load(sys.stdin)
tool_name = input_data.get("tool_name")
file_path = input_data.get("tool_input", {}).get("file_path", "")

# Run linter after code changes
if tool_name in ["Write", "Edit"] and file_path.endswith(".py"):
    try:
        result = subprocess.run(
            ["pylint", file_path],
            capture_output=True,
            text=True,
            timeout=30
        )

        # Provide feedback to Claude
        if result.returncode != 0:
            output = {
                "decision": "block",
                "reason": "Linting issues found",
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": f"Linting results:\n{result.stdout}"
                }
            }
            print(json.dumps(output))
            sys.exit(0)
    except Exception:
        pass

sys.exit(0)
```

### Pattern 8: Stop Hook Validation

Ensure tasks are complete before allowing Claude to stop.

```python
#!/usr/bin/env python3
import json
import sys
import subprocess

input_data = json.load(sys.stdin)

# Prevent infinite loops
if input_data.get("stop_hook_active"):
    sys.exit(0)

# Check for pending git changes
try:
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True,
        text=True,
        timeout=5
    )

    if result.stdout.strip():
        output = {
            "decision": "block",
            "reason": "Uncommitted changes detected. Please commit or stash changes before stopping."
        }
        print(json.dumps(output))
        sys.exit(0)
except Exception:
    pass

# Allow Claude to stop
sys.exit(0)
```

### Pattern 9: MCP Tool Logging

Log all MCP tool usage for audit trails.

```bash
#!/bin/bash

# Read JSON input
input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

# Check if it's an MCP tool
if [[ "$tool_name" =~ ^mcp__ ]]; then
    echo "[$timestamp] MCP Tool: $tool_name" >> ~/.claude/mcp-audit.log
fi

exit 0
```

### Pattern 10: Conditional Hook Execution

Execute hooks only under specific conditions.

```python
#!/usr/bin/env python3
import json
import sys
import os

input_data = json.load(sys.stdin)

# Only run in production environment
if os.environ.get("ENVIRONMENT") != "production":
    sys.exit(0)

# Only run on main branch
try:
    import subprocess
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        capture_output=True,
        text=True
    )
    current_branch = result.stdout.strip()

    if current_branch != "main":
        sys.exit(0)
except Exception:
    sys.exit(0)

# Execute production-specific logic
# ...

sys.exit(0)
```

## Complete Examples

Production-ready hook implementations with full configuration, setup instructions, and testing.

### Example 1: Prevent Dangerous Bash Commands

Block rm -rf, sudo, and other dangerous commands.

#### Hook Script

**File:** `.claude/hooks/validate-bash.py`

```python
#!/usr/bin/env python3
"""
Validates Bash commands before execution to prevent dangerous operations.
"""
import json
import sys
import re

# Load input
try:
    input_data = json.load(sys.stdin)
except json.JSONDecodeError as e:
    print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
    sys.exit(1)

tool_name = input_data.get("tool_name", "")
tool_input = input_data.get("tool_input", {})
command = tool_input.get("command", "")

# Only process Bash commands
if tool_name != "Bash" or not command:
    sys.exit(0)

# Define validation rules
VALIDATION_RULES = [
    (r'\brm\s+-rf\s+/', "Dangerous rm -rf command detected"),
    (r'\b(sudo|su)\b', "Elevated privileges not allowed"),
    (r'>\s*/dev/sd[a-z]', "Direct device access blocked"),
    (r'\b(mkfs|fdisk|parted)\b', "Disk formatting commands blocked"),
    (r':\(\)\{.*\};:', "Fork bomb detected"),
]

# Validate command
for pattern, message in VALIDATION_RULES:
    if re.search(pattern, command):
        print(f"❌ {message}", file=sys.stderr)
        sys.exit(2)  # Block the command

# Allow command
sys.exit(0)
```

#### Configuration

**File:** `.claude/settings.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PROJECT_DIR}\"/.claude/hooks/validate-bash.py"
          }
        ]
      }
    ]
  }
}
```

#### Setup

```bash
# Create hooks directory
mkdir -p .claude/hooks

# Create script
cat > .claude/hooks/validate-bash.py << 'EOF'
[paste script above]
EOF

# Make executable
chmod +x .claude/hooks/validate-bash.py

# Test
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | .claude/hooks/validate-bash.py
```

### Example 2: Auto-Format Code After Write/Edit

Automatically format Python, JavaScript, and Rust files.

#### Hook Script

**File:** `.claude/hooks/auto-format.py`

```python
#!/usr/bin/env python3
"""
Automatically formats code files after Write or Edit operations.
"""
import json
import sys
import subprocess
from pathlib import Path

input_data = json.load(sys.stdin)
tool_name = input_data.get("tool_name")
file_path = input_data.get("tool_input", {}).get("file_path", "")

# Only process Write/Edit operations
if tool_name not in ["Write", "Edit"] or not file_path:
    sys.exit(0)

# Define formatters by extension
FORMATTERS = {
    ".py": {
        "cmd": ["black", "--quiet", file_path],
        "name": "black"
    },
    ".js": {
        "cmd": ["prettier", "--write", file_path],
        "name": "prettier"
    },
    ".ts": {
        "cmd": ["prettier", "--write", file_path],
        "name": "prettier"
    },
    ".jsx": {
        "cmd": ["prettier", "--write", file_path],
        "name": "prettier"
    },
    ".tsx": {
        "cmd": ["prettier", "--write", file_path],
        "name": "prettier"
    },
    ".rs": {
        "cmd": ["rustfmt", file_path],
        "name": "rustfmt"
    },
    ".go": {
        "cmd": ["gofmt", "-w", file_path],
        "name": "gofmt"
    },
}

# Find appropriate formatter
file_ext = Path(file_path).suffix
if file_ext not in FORMATTERS:
    sys.exit(0)  # No formatter for this file type

formatter = FORMATTERS[file_ext]

# Run formatter
try:
    result = subprocess.run(
        formatter["cmd"],
        capture_output=True,
        text=True,
        timeout=30
    )

    if result.returncode == 0:
        print(f"✓ Formatted {Path(file_path).name} with {formatter['name']}")
        sys.exit(0)
    else:
        print(f"⚠ Formatting failed: {result.stderr}", file=sys.stderr)
        sys.exit(1)

except FileNotFoundError:
    print(f"⚠ {formatter['name']} not installed", file=sys.stderr)
    sys.exit(1)
except subprocess.TimeoutExpired:
    print("⚠ Formatting timed out", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"⚠ Formatting error: {e}", file=sys.stderr)
    sys.exit(1)
```

#### Configuration

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PROJECT_DIR}\"/.claude/hooks/auto-format.py",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### Example 3: Load Git Context at Session Start

Show recent commits and current branch when starting a session.

#### Hook Script

**File:** `.claude/hooks/load-git-context.py`

```python
#!/usr/bin/env python3
"""
Loads git context (branch, status, recent commits) at session start.
"""
import json
import sys
import subprocess

def run_git(args):
    """Run git command and return output"""
    try:
        result = subprocess.run(
            ["git"] + args,
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.stdout.strip() if result.returncode == 0 else ""
    except Exception:
        return ""

input_data = json.load(sys.stdin)

# Get git information
branch = run_git(["branch", "--show-current"])
status = run_git(["status", "--short"])
log = run_git(["log", "--oneline", "-10"])
remotes = run_git(["remote", "-v"])

# Check if there are uncommitted changes
has_changes = bool(status)

# Build context
context = f"""## Git Context

**Current Branch:** `{branch or 'detached HEAD'}`

**Status:** {'✗ Uncommitted changes' if has_changes else '✓ Clean working tree'}

**Modified Files:**
```

{status or '(none)'}

```

**Recent Commits:**
```

{log or '(no commits)'}

```

**Remotes:**
```

{remotes or '(no remotes configured)'}

```
"""

# Output context
print(context)
sys.exit(0)
```

#### Configuration

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PROJECT_DIR}\"/.claude/hooks/load-git-context.py"
          }
        ]
      }
    ]
  }
}
```

### Example 4: Validate Prompts for Secrets

Block prompts containing API keys, tokens, or passwords.

#### Hook Script

**File:** `~/.claude/hooks/validate-prompt-security.py`

```python
#!/usr/bin/env python3
"""
Validates user prompts for sensitive data before processing.
"""
import json
import sys
import re

input_data = json.load(sys.stdin)
prompt = input_data.get("prompt", "")

# Define sensitive patterns
SENSITIVE_PATTERNS = [
    (r'ghp_[a-zA-Z0-9]{36}', "GitHub personal access token"),
    (r'github_pat_[a-zA-Z0-9_]{82}', "GitHub fine-grained token"),
    (r'sk_live_[a-zA-Z0-9]{24,}', "Stripe API key"),
    (r'xoxb-[a-zA-Z0-9-]+', "Slack bot token"),
    (r'xox[pa]-[a-zA-Z0-9-]+', "Slack token"),
    (r'-----BEGIN (?:RSA )?PRIVATE KEY-----', "Private key"),
    (r'AKIA[0-9A-Z]{16}', "AWS access key"),
    (r'AIza[0-9A-Za-z-_]{35}', "Google API key"),
    (r'(?i)password\s*[:=]\s*["\']?[\w!@#$%^&*]{8,}', "Password"),
    (r'(?i)api[_-]?key\s*[:=]\s*["\']?[\w-]{20,}', "API key"),
]

# Check for sensitive data
for pattern, description in SENSITIVE_PATTERNS:
    if re.search(pattern, prompt):
        output = {
            "decision": "block",
            "reason": f"🔒 Security Alert: {description} detected in prompt.\n\n"
                     f"Please remove sensitive data and try again.\n\n"
                     f"Tip: Store secrets in environment variables or .env files instead."
        }
        print(json.dumps(output))
        sys.exit(0)

# Prompt is safe
sys.exit(0)
```

#### Configuration

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/validate-prompt-security.py"
          }
        ]
      }
    ]
  }
}
```

### Example 5: Ensure Git Commit Before Stopping

Prevent Claude from stopping if there are uncommitted changes.

#### Hook Script

**File:** `.claude/hooks/check-git-clean.py`

```python
#!/usr/bin/env python3
"""
Ensures all changes are committed before allowing Claude to stop.
"""
import json
import sys
import subprocess

input_data = json.load(sys.stdin)

# Prevent infinite loops
if input_data.get("stop_hook_active"):
    sys.exit(0)

# Check git status
try:
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True,
        text=True,
        timeout=5
    )

    if result.returncode != 0:
        # Not a git repository
        sys.exit(0)

    changes = result.stdout.strip()

    if changes:
        # Build list of changed files
        file_list = "\n".join(f"  - {line}" for line in changes.split("\n")[:10])
        if len(changes.split("\n")) > 10:
            file_list += f"\n  ... and {len(changes.split('\n')) - 10} more"

        output = {
            "decision": "block",
            "reason": f"""You have uncommitted changes:

{file_list}

Please commit or stash your changes before stopping:
- To commit: git add . && git commit -m "Your message"
- To stash: git stash
- To discard: git checkout .
"""
        }
        print(json.dumps(output))
        sys.exit(0)

except Exception:
    # If git check fails, allow stopping
    pass

# Clean working tree, allow stopping
sys.exit(0)
```

#### Configuration

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PROJECT_DIR}\"/.claude/hooks/check-git-clean.py"
          }
        ]
      }
    ]
  }
}
```

### Example 6: Auto-Approve Documentation Reads

Automatically approve reading documentation files without prompting.

#### Hook Script

**File:** `~/.claude/hooks/auto-approve-docs.py`

```python
#!/usr/bin/env python3
"""
Auto-approves reading documentation and configuration files.
"""
import json
import sys
from pathlib import Path

input_data = json.load(sys.stdin)
tool_name = input_data.get("tool_name")
file_path = input_data.get("tool_input", {}).get("file_path", "")

if tool_name != "Read" or not file_path:
    sys.exit(0)

# Define safe file patterns
SAFE_EXTENSIONS = (
    ".md", ".mdx", ".txt", ".json", ".yaml", ".yml",
    ".toml", ".ini", ".cfg", ".conf", ".xml",
    ".rst", ".adoc", ".org"
)

SAFE_FILENAMES = (
    "README", "LICENSE", "CHANGELOG", "CONTRIBUTING",
    "CODE_OF_CONDUCT", "SECURITY", ".gitignore",
    "package.json", "Cargo.toml", "pyproject.toml"
)

path = Path(file_path)

# Check if file should be auto-approved
is_safe = (
    path.suffix.lower() in SAFE_EXTENSIONS or
    path.stem.upper() in SAFE_FILENAMES
)

if is_safe:
    output = {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "allow",
            "permissionDecisionReason": f"Documentation file auto-approved: {path.name}"
        },
        "suppressOutput": True  # Don't show in transcript
    }
    print(json.dumps(output))
    sys.exit(0)

# Not a documentation file, use normal permission flow
sys.exit(0)
```

#### Configuration

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/auto-approve-docs.py"
          }
        ]
      }
    ]
  }
}
```

### Example 7: MCP Tool Audit Log

Log all MCP tool usage for compliance and debugging.

#### Hook Script

**File:** `~/.claude/hooks/mcp-audit.sh`

```bash
#!/bin/bash
# Logs all MCP tool usage with timestamp and details

# Read JSON input
input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')

# Only log MCP tools
if [[ ! "$tool_name" =~ ^mcp__ ]]; then
    exit 0
fi

# Extract MCP server and tool
server=$(echo "$tool_name" | cut -d'_' -f3)
tool=$(echo "$tool_name" | cut -d'_' -f4-)

# Log to file
log_file="${HOME}/.claude/mcp-audit.log"
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$timestamp] Server: $server, Tool: $tool, Full: $tool_name" >> "$log_file"

exit 0
```

#### Configuration

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__.*",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/mcp-audit.sh"
          }
        ]
      }
    ]
  }
}
```

### Example 8: Notify on Session End

Send system notification when Claude Code session ends.

#### Hook Script (macOS)

**File:** `~/.claude/hooks/notify-session-end.sh`

```bash
#!/bin/bash
# Sends notification when session ends (macOS)

input=$(cat)
reason=$(echo "$input" | jq -r '.reason')

# Send notification
osascript -e "display notification \"Session ended: $reason\" with title \"Claude Code\" sound name \"Glass\""

exit 0
```

#### Hook Script (Linux)

**File:** `~/.claude/hooks/notify-session-end-linux.sh`

```bash
#!/bin/bash
# Sends notification when session ends (Linux)

input=$(cat)
reason=$(echo "$input" | jq -r '.reason')

# Send notification via notify-send
notify-send "Claude Code" "Session ended: $reason" --icon=dialog-information

exit 0
```

#### Configuration

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/notify-session-end.sh"
          }
        ]
      }
    ]
  }
}
```

## Bash Hook Examples

Simple hooks can use bash scripts for quick implementation.

### Log All Tool Usage

```bash
#!/bin/bash
input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$timestamp] Tool used: $tool_name" >> ~/.claude/tool-usage.log
exit 0
```

### Backup Files Before Edit

```bash
#!/bin/bash
input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')
file_path=$(echo "$input" | jq -r '.tool_input.file_path')

if [[ "$tool_name" == "Edit" && -f "$file_path" ]]; then
    cp "$file_path" "${file_path}.backup"
fi

exit 0
```

### Send Notification on Session End

```bash
#!/bin/bash
input=$(cat)
reason=$(echo "$input" | jq -r '.reason')

# Send notification (macOS example)
osascript -e "display notification \"Claude Code session ended: $reason\" with title \"Claude Code\""

exit 0
```

## Reusable Utilities

Common utility functions for hook scripts.

### JSON Validation

```python
def load_hook_input():
    """Safely load and validate hook input"""
    try:
        return json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"Invalid JSON input: {e}", file=sys.stderr)
        sys.exit(1)
```

### Safe Command Execution

```python
def run_command(cmd, timeout=30):
    """Safely execute command with timeout"""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        return None
    except subprocess.TimeoutExpired:
        return None
```

### JSON Output Helper

```python
def output_json(data):
    """Output JSON and exit"""
    print(json.dumps(data))
    sys.exit(0)
```

### Path Validation

```python
def validate_path(file_path, allowed_dirs):
    """Validate file path is in allowed directories"""
    from pathlib import Path

    try:
        target = Path(file_path).resolve()
        return any(
            target.is_relative_to(Path(d).resolve())
            for d in allowed_dirs
        )
    except Exception:
        return False
```

## Testing Hooks

Test hooks manually before deployment to ensure correct behavior.

### Test Hook Scripts Directly

```bash
# Test PreToolUse hook
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | \
  .claude/hooks/validate-bash.py
echo "Exit code: $?"

# Test PostToolUse hook
echo '{"tool_name":"Write","tool_input":{"file_path":"test.py"}}' | \
  .claude/hooks/auto-format.py

# Test UserPromptSubmit hook
echo '{"prompt":"Here is my API key: ghp_abc123xyz"}' | \
  ~/.claude/hooks/validate-prompt-security.py
```

### Test with Real Transcript Data

```bash
# Extract last tool call from transcript
cat ~/.claude/projects/*/transcript.jsonl | tail -1 | \
  jq '.toolInput' | \
  your-hook.py
```

### Test Edge Cases

```bash
# Empty command
echo '{"tool_name":"Bash","tool_input":{"command":""}}' | hook.py

# Missing fields
echo '{"tool_name":"Bash"}' | hook.py

# Very long input
echo '{"tool_name":"Bash","tool_input":{"command":"'$(python -c 'print("a"*10000)')'}}' | hook.py

# Special characters
echo '{"tool_name":"Write","tool_input":{"file_path":"file with spaces.txt"}}' | hook.py
```

### Check Exit Codes

```bash
# Test successful validation (exit 0)
echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | \
  .claude/hooks/validate-bash.py
echo "Exit: $?"  # Should be 0

# Test blocked operation (exit 2)
echo '{"tool_name":"Bash","tool_input":{"command":"sudo rm -rf /"}}' | \
  .claude/hooks/validate-bash.py
echo "Exit: $?"  # Should be 2

# Test error condition (exit 1)
echo 'invalid json' | .claude/hooks/validate-bash.py
echo "Exit: $?"  # Should be 1
```

## Debugging Hooks

Use Claude Code's built-in debugging tools to troubleshoot hook execution.

### Debug Mode

Run with `--debug` to see detailed hook execution:

```bash
claude --debug
```

### Transcript Mode

View hook progress in transcript mode (Ctrl-R).

### File Logging

Add logging to hook scripts for persistent debugging:

```python
import logging

logging.basicConfig(
    filename=os.path.expanduser("~/.claude/hook-debug.log"),
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logging.debug(f"Hook input: {input_data}")
logging.debug(f"Tool name: {tool_name}")
logging.debug(f"Validation result: {is_valid}")
```

### Validate JSON Output

Test JSON output format before deployment:

```python
output = {
    "decision": "block",
    "reason": "Test reason"
}

# Validate it's proper JSON
try:
    json.dumps(output)
    print("✓ Valid JSON")
except Exception as e:
    print(f"✗ Invalid JSON: {e}")
```

### Common Debugging Issues

**Hook not triggering:**

1. Check matcher pattern (case-sensitive)
2. Verify hook appears in `/hooks` menu in Claude Code
3. Restart Claude Code to reload configuration
4. Use `claude --debug` to see why hook isn't matching

**Permission denied:**

```bash
chmod +x .claude/hooks/*.py
```

**Invalid JSON error:**

```python
# Add JSON validation
try:
    input_data = json.load(sys.stdin)
except json.JSONDecodeError as e:
    print(f"Invalid JSON: {e}", file=sys.stderr)
    sys.exit(1)
```

**Timeout errors:**

```json
{
  "timeout": 60  // Increase timeout
}
```

**Hook modifying unexpected tools:**
Check matcher pattern - it may be too broad:

```json
// TOO BROAD - matches everything
"matcher": "*"

// SPECIFIC - only matches intended tools
"matcher": "Write|Edit"
```

### Performance Debugging

Monitor hook execution time:

```python
import time

start = time.time()
# ... hook logic ...
duration = time.time() - start

if duration > 1.0:
    logging.warning(f"Hook took {duration:.2f}s - consider optimization")
```

Performance targets:

- <1s ideal for PreToolUse hooks
- <5s maximum to avoid user frustration
- Use timeouts to prevent hanging
