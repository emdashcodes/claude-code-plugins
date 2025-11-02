---
name: plugin-skill-name
description: Brief description of what this skill does and when to use it. This skill should be used when [specific trigger conditions].
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Plugin Skill Name

Brief overview of this skill as part of the [plugin-name] plugin.

## Purpose

Explain the skill's purpose in 2-3 sentences. How does it fit into the larger plugin ecosystem?

## Integration with Plugin Components

This skill works with other [plugin-name] components:

- **Slash Commands:** `/command-name` - [When to use this command]
- **Subagents:** `agent-name` - [When to delegate to this agent]
- **Hooks:** [What hooks work with this skill]

## When to Use This Skill

List specific scenarios when this skill should be used:
- Scenario 1
- Scenario 2
- Scenario 3

## Tool Requirements

This skill uses the following tools:

- **Read**: To examine [what files/content]
- **Write**: To create [what output]
- **Edit**: To modify [what files]
- **Bash**: To execute [what commands]
- **Glob**: To find [what patterns]
- **Grep**: To search for [what content]

The `allowed-tools` field restricts tool usage to prevent [what risks].

## Quick Start

Provide a quick example of using this skill:

```bash
# Example bash command or procedure
```

## Workflows

### Workflow 1: [Name]

1. Step 1
2. Step 2
3. Step 3

**Integration:** This workflow can be initiated using the `/workflow-command` command.

### Workflow 2: [Name]

1. Step 1
2. Step 2
3. Step 3

**Integration:** For complex cases, delegate to the `workflow-agent` subagent.

## Working with Slash Commands

### Recommending Commands

When a user wants to [action], recommend using the appropriate command:

```markdown
I've analyzed the situation. Use the `/action-command` to proceed:

\`\`\`
/action-command argument1 argument2
\`\`\`
```

### Command Output Handling

After a command completes, provide guidance based on the output.

## Working with Subagents

### When to Delegate

Delegate to the [agent-name] subagent when:
- Condition 1
- Condition 2
- Condition 3

### Delegation Pattern

```markdown
This is a complex [scenario]. Let me ask the [agent-name] subagent to handle this:

[Provide context to subagent]
```

## Working with Hooks

### Hook Integration

This skill works with these hooks:

- **PreToolUse:** Validates [what operations] before execution
- **PostToolUse:** Performs [what automation] after file changes
- **SessionStart:** Loads [what context] at session initialization

### Hook-Aware Procedures

Some procedures may be automated by hooks. Check if hooks are active before manual execution.

## Examples

### Example 1: Complete Workflow

**Scenario:** [Describe the scenario]

**Steps:**

1. Skill provides initial analysis
2. User runs `/command-name` for execution
3. Skill validates results
4. Hook performs post-processing

**Output:**
```
# Expected final output
```

### Example 2: Delegation Workflow

**Scenario:** [Describe the scenario]

**Steps:**

1. Skill recognizes complex case
2. Delegates to `agent-name` subagent
3. Subagent handles specialized processing
4. Skill provides summary

**Output:**
```
# Expected final output
```

## Bundled Resources

### Scripts

This skill includes helper scripts in `scripts/`:

- `script1.py` - [What it does]
- `script2.sh` - [What it does]

Usage:
```bash
python scripts/script1.py [args]
```

### References

Detailed documentation in `references/`:

- [detailed-guide.md](references/detailed-guide.md) - [What it contains]
- [api-reference.md](references/api-reference.md) - [What it contains]

## Best Practices

- Best practice 1
- Best practice 2
- Best practice 3
- Always coordinate with related plugin components

## Troubleshooting

### Skill-Specific Issues

**Issue:** Skill doesn't trigger when expected
**Solution:** Check description matches user's language

**Issue:** Tool permission error
**Solution:** Verify `allowed-tools` includes required tool

### Plugin Integration Issues

**Issue:** Command not found
**Solution:** Ensure [plugin-name] plugin is installed and enabled

**Issue:** Subagent not available
**Solution:** Verify [plugin-name] plugin includes agent definitions

**Issue:** Hook not firing
**Solution:** Check hooks configuration in plugin's hooks.json

## Plugin Metadata

**Plugin:** [plugin-name]
**Version:** [version]
**Marketplace:** [marketplace-name]

**Installation:**
```
/plugin marketplace add [marketplace-path]
/plugin install [plugin-name]@[marketplace-name]
```

## Reference

For detailed information:
- Plugin documentation: See [plugin-name] README
- Integration guide: [references/integration.md](references/integration.md)
- Complete API: [references/api-reference.md](references/api-reference.md)
