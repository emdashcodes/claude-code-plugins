# Hook Best Practices

Security, performance, reliability, and maintainability guidelines for Claude Code hooks.

## Security Best Practices

### Input Validation

Always validate and sanitize inputs:

```python
# DON'T: Trust input blindly
command = input_data.get("tool_input", {}).get("command")
os.system(command)  # DANGEROUS!

# DO: Validate and sanitize
command = input_data.get("tool_input", {}).get("command", "")
if not command or not validate_command(command):
    print("Invalid command", file=sys.stderr)
    sys.exit(2)
```

### Shell Quoting

Always quote shell variables:

```bash
# DON'T: Unquoted variables
file_path=$(echo "$input" | jq -r '.tool_input.file_path')
cat $file_path  # Shell injection risk!

# DO: Quote variables
file_path=$(echo "$input" | jq -r '.tool_input.file_path')
cat "$file_path"  # Safe
```

### Path Traversal Prevention

Check for path traversal attacks:

```python
def is_safe_path(base_dir, file_path):
    """Prevent ../../../etc/passwd attacks"""
    try:
        base = Path(base_dir).resolve()
        target = Path(file_path).resolve()
        return target.is_relative_to(base)
    except (ValueError, OSError):
        return False

# Use it
if not is_safe_path(project_dir, file_path):
    print("Path traversal detected", file=sys.stderr)
    sys.exit(2)
```

### Sensitive File Protection

Skip sensitive files:

```python
SENSITIVE_PATHS = (
    ".env", ".env.local", ".env.production",
    ".git/config", ".ssh/", "id_rsa",
    "credentials.json", "secrets.yaml",
    ".aws/credentials"
)

def is_sensitive(file_path):
    return any(p in file_path for p in SENSITIVE_PATHS)

if is_sensitive(file_path):
    print("Sensitive file access blocked", file=sys.stderr)
    sys.exit(2)
```

### Secret Detection

Scan for hardcoded secrets:

```python
SECRET_PATTERNS = [
    r'ghp_[a-zA-Z0-9]{36}',  # GitHub token
    r'sk_live_[a-zA-Z0-9]{24,}',  # Stripe key
    r'xoxb-[a-zA-Z0-9-]+',  # Slack token
    r'AKIA[0-9A-Z]{16}',  # AWS key
    r'(?i)password\s*[:=]\s*["\']?[\w!@#$%^&*]{8,}',
]

def contains_secrets(text):
    return any(re.search(p, text) for p in SECRET_PATTERNS)
```

### Use Absolute Paths

Always use absolute paths for scripts:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PROJECT_DIR}\"/.claude/hooks/script.py"
          }
        ]
      }
    ]
  }
}
```

## Performance Best Practices

### Keep Hooks Fast

Hooks should complete quickly (<1s ideal, <5s maximum):

```python
# DON'T: Slow operations
result = requests.get("https://api.example.com/slow")  # May take seconds

# DO: Quick checks, background for slow operations
if should_run_slow_check():
    subprocess.Popen(["./slow-check.sh", file_path])  # Background
sys.exit(0)
```

### Exit Early

Skip unnecessary processing:

```python
# DON'T: Process everything
input_data = json.load(sys.stdin)
tool_name = input_data.get("tool_name")
# ... lots of processing ...
if tool_name != "Bash":
    sys.exit(0)

# DO: Exit early
input_data = json.load(sys.stdin)
if input_data.get("tool_name") != "Bash":
    sys.exit(0)
# ... relevant processing only ...
```

### Cache Expensive Operations

Cache when possible:

```python
import functools

@functools.lru_cache(maxsize=128)
def get_project_config():
    """Cached config loading"""
    with open(".project-config.json") as f:
        return json.load(f)
```

### Set Appropriate Timeouts

Configure timeouts based on operation:

```json
{
  "hooks": [
    {
      "type": "command",
      "command": "quick-check.sh",
      "timeout": 5
    },
    {
      "type": "command",
      "command": "slow-formatter.sh",
      "timeout": 30
    }
  ]
}
```

### Minimize Tool Dependencies

Only import what's needed:

```python
# DON'T: Import everything
import json, sys, os, re, subprocess, pathlib, datetime, requests

# DO: Import only what's used
import json
import sys
```

## Reliability Best Practices

### Error Handling

Handle errors gracefully:

```python
try:
    result = subprocess.run(
        ["formatter", file_path],
        capture_output=True,
        text=True,
        timeout=30,
        check=True
    )
except FileNotFoundError:
    print("Formatter not installed", file=sys.stderr)
    sys.exit(1)
except subprocess.TimeoutExpired:
    print("Formatting timed out", file=sys.stderr)
    sys.exit(1)
except subprocess.CalledProcessError as e:
    print(f"Formatting failed: {e.stderr}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"Unexpected error: {e}", file=sys.stderr)
    sys.exit(1)
```

### Validate JSON Schema

Check for required fields:

```python
def validate_input(data):
    """Validate hook input has required fields"""
    required = ["session_id", "hook_event_name"]
    for field in required:
        if field not in data:
            print(f"Missing required field: {field}", file=sys.stderr)
            sys.exit(1)

input_data = json.load(sys.stdin)
validate_input(input_data)
```

### Handle Missing Dependencies

Check for required tools:

```python
import shutil

def check_dependencies():
    """Ensure required tools are available"""
    required_tools = ["black", "pylint"]
    missing = [t for t in required_tools if not shutil.which(t)]

    if missing:
        print(f"Missing tools: {', '.join(missing)}", file=sys.stderr)
        print("Install with: pip install black pylint", file=sys.stderr)
        sys.exit(1)
```

### Provide Clear Error Messages

Make errors actionable:

```python
# DON'T: Vague error
print("Error", file=sys.stderr)

# DO: Specific, actionable error
print("""
❌ Linting failed for {file_path}

Issues found:
{issues}

Fix with: pylint {file_path}
Or disable: # pylint: disable=rule-name
""", file=sys.stderr)
```

## Maintainability Best Practices

### Document Hook Purpose

Include clear documentation:

```python
#!/usr/bin/env python3
"""
Validates Bash commands before execution.

Blocks:
- rm -rf commands targeting system directories
- sudo/su privilege escalation
- Direct device access

Exit codes:
- 0: Command allowed
- 2: Command blocked
- 1: Validation error
"""
```

### Use Descriptive Names

Name hooks clearly:

```bash
# DON'T: Generic names
hook1.py
check.sh
validator.py

# DO: Descriptive names
validate-bash-security.py
auto-format-python.py
check-git-clean.sh
```

### Version Control

Track hooks in git:

```bash
# Add hooks to git
git add .claude/hooks/
git commit -m "Add bash validation hook"

# Add to .gitignore if needed (for local hooks)
echo ".claude/settings.local.json" >> .gitignore
```

### README Documentation

Document hooks in project README:

```markdown
## Claude Code Hooks

This project uses the following hooks:

### PreToolUse Hooks
- **validate-bash.py**: Blocks dangerous bash commands
- **check-paths.py**: Prevents path traversal

### PostToolUse Hooks
- **auto-format.py**: Formats Python files with black

### Setup
```bash
chmod +x .claude/hooks/*.py
```
```

### Configuration Comments

Add comments to settings.json:

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
            // Blocks rm -rf, sudo, and other dangerous commands
          }
        ]
      }
    ]
  }
}
```

## Configuration Best Practices

### Use Project-Level Hooks for Team

Share hooks with team:

```bash
# .claude/settings.json (committed to git)
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PROJECT_DIR}\"/.claude/hooks/validate.py"
          }
        ]
      }
    ]
  }
}
```

### Use User-Level Hooks for Personal

Personal preferences:

```bash
# ~/.claude/settings.json (not in git)
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/my-personal-setup.sh"
          }
        ]
      }
    ]
  }
}
```

### Use Local Hooks for Testing

Test hooks without affecting team:

```bash
# .claude/settings.local.json (gitignored)
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PROJECT_DIR}\"/.claude/hooks/test-hook.py"
          }
        ]
      }
    ]
  }
}
```

### Organize Hooks by Purpose

```
.claude/
├── hooks/
│   ├── security/
│   │   ├── validate-bash.py
│   │   └── check-secrets.py
│   ├── formatting/
│   │   ├── auto-format.py
│   │   └── run-linters.py
│   └── git/
│       ├── check-clean.py
│       └── load-context.py
└── settings.json
```

## Stop Hook Safety

Prevent infinite loops in Stop hooks:

```python
# ALWAYS check stop_hook_active
if input_data.get("stop_hook_active"):
    sys.exit(0)  # Allow stopping if already in stop hook

# Your validation logic
has_issues = check_for_issues()

if has_issues:
    output = {"decision": "block", "reason": "Fix issues first"}
    print(json.dumps(output))
    sys.exit(0)
```

## Progressive Enhancement

Start simple, add complexity as needed:

**Phase 1: Basic validation**
```python
if "rm -rf /" in command:
    sys.exit(2)
```

**Phase 2: Pattern matching**
```python
if re.search(r'\brm\s+-rf\s+/', command):
    sys.exit(2)
```

**Phase 3: Comprehensive rules**
```python
for pattern, message in RULES:
    if re.search(pattern, command):
        print(message, file=sys.stderr)
        sys.exit(2)
```

**Phase 4: JSON output with context**
```python
output = {
    "decision": "block",
    "reason": message,
    "hookSpecificOutput": {...}
}
print(json.dumps(output))
```

## Security Checklist

Before deploying hooks to production:

- [ ] All user inputs are validated and sanitized
- [ ] Shell variables are properly quoted
- [ ] Path traversal attacks are prevented
- [ ] Sensitive file access is blocked or logged
- [ ] No hardcoded secrets in hook scripts
- [ ] Absolute paths used for all script references
- [ ] Stop hooks check `stop_hook_active` flag
- [ ] Error messages don't leak sensitive information
- [ ] Hooks run with minimum required permissions
- [ ] External commands use full paths or validation

## Performance Checklist

Before deploying hooks to production:

- [ ] Hooks complete in <1s for common operations
- [ ] Maximum timeout set appropriately (5-30s)
- [ ] Early exit for non-matching tools
- [ ] Expensive operations are cached
- [ ] Slow operations run in background
- [ ] Minimal dependencies imported
- [ ] No blocking network calls in critical path
- [ ] File I/O is minimized
- [ ] Regex patterns are optimized
- [ ] Hook doesn't process unnecessary data

## Reliability Checklist

Before deploying hooks to production:

- [ ] All exceptions are caught and handled
- [ ] Missing dependencies are checked at startup
- [ ] Required fields in input JSON are validated
- [ ] Timeout errors are handled gracefully
- [ ] Error messages are clear and actionable
- [ ] Hooks tested with edge cases
- [ ] Hooks tested with malformed input
- [ ] Fallback behavior defined for failures
- [ ] Logs capture enough detail for debugging
- [ ] Hooks fail safely (allow operation on error)
