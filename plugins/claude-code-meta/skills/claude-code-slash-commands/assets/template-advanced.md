---
description: [Brief description of what this command does]
argument-hint: [arg1] [arg2]
allowed-tools: Bash(git:*), Read, Write, Edit
model: claude-sonnet-4-5-20250929
disable-model-invocation: false
---

# Advanced Slash Command Template

This template demonstrates all available features.

## Context Gathering

Use bash execution to gather context:

- Current status: ! `git status`
- Project files: ! `ls -la`

## Arguments

- `$1` - [First argument description]
- `$2` - [Second argument description]
- `$ARGUMENTS` - All arguments as a single string

## File References

Reference files using @ syntax:

- Review implementation in @src/main.js
- Compare @old-file.js with @new-file.js

## Extended Thinking

Use keywords like "think carefully", "analyze thoroughly", or "consider all implications" to trigger extended thinking mode.

## Your Task

[Detailed instructions for Claude, incorporating context, arguments, and file references]

## Success Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
