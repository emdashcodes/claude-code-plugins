---
title: Structured outputs in the SDK
source_url: https://platform.claude.com/docs/en/agent-sdk/structured-outputs
---

Get structured, validated JSON from agent workflows. The Agent SDK supports structured outputs through JSON Schemas, ensuring your agents return data in exactly the format you need.

**When to use structured outputs**

Use structured outputs when you need validated JSON after an agent completes a multi-turn workflow with tools (file searches, command execution, web research, etc.).

For single API calls without tool use, see [API Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).

## Why use structured outputs

Structured outputs provide reliable, type-safe integration with your applications:

- **Validated structure**: Always receive valid JSON matching your schema
- **Simplified integration**: No parsing or validation code needed
- **Type safety**: Use with TypeScript or Python type hints for end-to-end safety
- **Clean separation**: Define output requirements separately from task instructions
- **Tool autonomy**: Agent chooses which tools to use while guaranteeing output format

## Quick start

    import { query } from '@anthropic-ai/claude-agent-sdk'

    const schema = {
      type: 'object',
      properties: {
        company_name: { type: 'string' },
        founded_year: { type: 'number' },
        headquarters: { type: 'string' }
      },
      required: ['company_name']
    }

    for await (const message of query({
      prompt: 'Research Anthropic and provide key company information',
      options: {
        outputFormat: {
          type: 'json_schema',
          schema: schema
        }
      }
    })) {
      if (message.type === 'result' && message.structured_output) {
        console.log(message.structured_output)
        // { company_name: "Anthropic", founded_year: 2021, headquarters: "San Francisco, CA" }
      }
    }

## Defining schemas with Zod

For TypeScript projects, use Zod for type-safe schema definition and validation:

    import { z } from 'zod'
    import { zodToJsonSchema } from 'zod-to-json-schema'

    // Define schema with Zod
    const AnalysisResult = z.object({
      summary: z.string(),
      issues: z.array(z.object({
        severity: z.enum(['low', 'medium', 'high']),
        description: z.string(),
        file: z.string()
      })),
      score: z.number().min(0).max(100)
    })

    type AnalysisResult = z.infer<typeof AnalysisResult>

    // Convert to JSON Schema
    const schema = zodToJsonSchema(AnalysisResult, { $refStrategy: 'root' })

    // Use in query
    for await (const message of query({
      prompt: 'Analyze the codebase for security issues',
      options: {
        outputFormat: {
          type: 'json_schema',
          schema: schema
        }
      }
    })) {
      if (message.type === 'result' && message.structured_output) {
        // Validate and get fully typed result
        const parsed = AnalysisResult.safeParse(message.structured_output)
        if (parsed.success) {
          const data: AnalysisResult = parsed.data
          console.log(`Score: ${data.score}`)
          console.log(`Found ${data.issues.length} issues`)
          data.issues.forEach(issue => {
            console.log(`[${issue.severity}] ${issue.file}: ${issue.description}`)
          })
        }
      }
    }

**Benefits of Zod:**

- Full TypeScript type inference
- Runtime validation with `safeParse()`
- Better error messages
- Composable schemas

## How structured outputs work

1. <div>

    1

    Define your JSON schema

    Create a JSON Schema that describes the structure you want the agent to return. The schema uses standard JSON Schema format.

2. <div>

    2

    Add the outputFormat parameter

    Include the `outputFormat` parameter in your query options with `type: "json_schema"` and your schema definition.

3. <div>

    3

    Run your query

    The agent uses any tools it needs to complete the task (file operations, commands, web search, etc.).

4. <div>

    4

    Access validated output

    The agent's final result will be valid JSON matching your schema, available in `message.structured_output`.

## Supported JSON Schema features

The Agent SDK supports the same JSON Schema features and limitations as [API Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs#json-schema-limitations).

Key supported features:

- All basic types: object, array, string, integer, number, boolean, null
- `enum`, `const`, `required`, `additionalProperties` (must be `false`)
- String formats: `date-time`, `date`, `email`, `uri`, `uuid`, etc.
- `$ref`, `$def`, and `definitions`

For complete details on supported features, limitations, and regex pattern support, see [JSON Schema limitations](https://platform.claude.com/docs/en/build-with-claude/structured-outputs#json-schema-limitations) in the API documentation.

## Example: TODO tracking agent

Here's a complete example showing an agent that searches code for TODOs and extracts git blame information:

    import { query } from '@anthropic-ai/claude-agent-sdk'

    // Define structure for TODO extraction
    const todoSchema = {
      type: 'object',
      properties: {
        todos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              file: { type: 'string' },
              line: { type: 'number' },
              author: { type: 'string' },
              date: { type: 'string' }
            },
            required: ['text', 'file', 'line']
          }
        },
        total_count: { type: 'number' }
      },
      required: ['todos', 'total_count']
    }

    // Agent uses Grep to find TODOs, Bash to get git blame info
    for await (const message of query({
      prompt: 'Find all TODO comments in src/ and identify who added them',
      options: {
        outputFormat: {
          type: 'json_schema',
          schema: todoSchema
        }
      }
    })) {
      if (message.type === 'result' && message.structured_output) {
        const data = message.structured_output
        console.log(`Found ${data.total_count} TODOs`)
        data.todos.forEach(todo => {
          console.log(`${todo.file}:${todo.line} - ${todo.text}`)
          if (todo.author) {
            console.log(`  Added by ${todo.author} on ${todo.date}`)
          }
        })
      }
    }

The agent autonomously uses the right tools (Grep, Bash) to gather information and returns validated data.

## Error handling

If the agent cannot produce valid output matching your schema, you'll receive an error result:

    for await (const msg of query({
      prompt: 'Analyze the data',
      options: {
        outputFormat: {
          type: 'json_schema',
          schema: mySchema
        }
      }
    })) {
      if (msg.type === 'result') {
        if (msg.subtype === 'success' && msg.structured_output) {
          console.log(msg.structured_output)
        } else if (msg.subtype === 'error_max_structured_output_retries') {
          console.error('Could not produce valid output')
        }
      }
    }

## Related resources

- [JSON Schema documentation](https://json-schema.org/)
- [API Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) - For single API calls
- [Custom tools](https://platform.claude.com/docs/en/agent-sdk/custom-tools) - Define tools for your agents
- [TypeScript SDK reference](https://platform.claude.com/docs/en/agent-sdk/typescript) - Full TypeScript API
- [Python SDK reference](https://platform.claude.com/docs/en/agent-sdk/python) - Full Python API
