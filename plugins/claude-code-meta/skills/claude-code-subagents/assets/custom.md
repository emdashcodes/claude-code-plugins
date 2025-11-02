---
name: custom-agent
description: [Describe when this subagent should be invoked. Be specific and action-oriented. Use keywords like PROACTIVELY or MUST BE USED if appropriate.]
tools: Read, Write, Edit, Grep, Glob, Bash
model: inherit
---

[Define the subagent's role, expertise, and purpose here]

## Role

[Describe what this subagent specializes in and what it should accomplish]

## Process

When invoked:

1. **[First step name]**
   - [Action or consideration]
   - [Action or consideration]

2. **[Second step name]**
   - [Action or consideration]
   - [Action or consideration]

3. **[Third step name]**
   - [Action or consideration]
   - [Action or consideration]

[Add more steps as needed]

## Guidelines

- [Key principle or constraint]
- [Important consideration]
- [Best practice to follow]
- [What to avoid]

## Output Format

[Describe how the subagent should structure its responses]

[Optional: Include examples of expected output]

## Best Practices

- [Practice 1]
- [Practice 2]
- [Practice 3]

---

## Instructions for Customizing This Template

1. **Update frontmatter**:
   - Change `name` to a descriptive, hyphenated name (e.g., `api-integration-tester`)
   - Write a clear `description` explaining when to invoke this subagent
   - Adjust `tools` list to only necessary tools (or omit to inherit all)
   - Set `model` if needed (`sonnet`, `opus`, `haiku`, or `inherit`)

2. **Define the role**:
   - Be specific about the subagent's expertise and purpose
   - Include the domain, technology, or workflow focus
   - Set clear expectations for what it can accomplish

3. **Document the process**:
   - Break down the workflow into clear steps
   - Use action-oriented language
   - Include decision points and considerations
   - Add error handling or edge cases

4. **Establish guidelines**:
   - Define principles the subagent should follow
   - List important constraints or requirements
   - Note what the subagent should avoid
   - Include best practices specific to this domain

5. **Specify output format**:
   - Describe how results should be structured
   - Include templates or examples if helpful
   - Define what constitutes successful completion

6. **Test and iterate**:
   - Test with realistic tasks
   - Refine description for better automatic invocation
   - Adjust process based on actual usage
   - Update guidelines as patterns emerge

## Examples of Effective Subagents

### Narrow, Focused Subagents

- Security vulnerability scanner (focused on one concern)
- API documentation generator (specific output type)
- Database migration creator (specific workflow)

### Domain-Specific Subagents

- React component builder (framework-specific)
- AWS infrastructure manager (platform-specific)
- GraphQL schema designer (technology-specific)

### Workflow-Specific Subagents

- Pre-commit validator (workflow stage)
- Release note generator (process step)
- Performance benchmark runner (specific task)

Choose clear boundaries and a single responsibility for best results.
