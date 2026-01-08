---
name: claude-agent-sdk
description: This skill should be used when developing applications with the Claude Agent SDK, answering questions about SDK features and APIs, implementing SDK patterns, or troubleshooting SDK integration. Covers Python and TypeScript APIs, core features, advanced features, and integrations.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch
---

# Claude Agent SDK Development

## Overview

This skill provides comprehensive documentation and development guidance for building applications with the Claude Agent SDK. Use this skill when working with Claude Agent SDK based applications, implementing SDK features, or answering questions about SDK capabilities in both Python and TypeScript.

The Claude Agent SDK enables building conversational AI agents with access to tools, multi-turn sessions, streaming, structured outputs, and extensibility through Skills, Plugins, Slash Commands, and Subagents.

## When to Use This Skill

Activate this skill when:

- Building new applications using the Claude Agent SDK
- Implementing SDK features (sessions, permissions, streaming, structured outputs)
- Adding extensibility (Skills, Plugins, Slash Commands, Subagents, MCP)
- Integrating custom tools or external APIs
- Troubleshooting SDK issues or migration from legacy implementations
- Answering questions about SDK capabilities, APIs, or best practices
- Setting up hosting and deployment for SDK applications
- Implementing cost tracking and usage monitoring

## Quick Start

### API References

The SDK is available in both Python and TypeScript. For detailed API documentation, reference:

- **Python API**: `references/agent-sdk_python.md`
- **TypeScript API**: `references/agent-sdk_typescript.md`

### Getting Started

For SDK overview and core concepts, reference:

- **Overview**: `references/agent-sdk_overview.md`

## Core Features

### 1. Session Management

Sessions enable multi-turn conversations with state persistence. To implement sessions:

**Reference**: `references/agent-sdk_sessions.md`

**Key concepts**:

- Creating and managing sessions
- Persisting conversation state
- Resuming sessions across requests
- Session lifecycle and cleanup

**When to reference**: When implementing multi-turn conversations, state persistence, or conversation continuity.

### 2. Permissions System

The SDK includes a permissions system for controlling tool access and user approval flows.

**Reference**: `references/agent-sdk_permissions.md`

**Key concepts**:

- Defining tool permissions
- Implementing approval workflows
- Permission tiers (auto-approve, prompt, deny)
- Batch permission handling

**When to reference**: When implementing tool restrictions, user approval flows, or security controls.

### 3. System Prompt Modification

Customize agent behavior by modifying system prompts.

**Reference**: `references/agent-sdk_modifying-system-prompts.md`

**Key concepts**:

- Overriding default system prompts
- Adding custom instructions
- Combining with Skills and Plugins
- Best practices for prompt engineering

**When to reference**: When customizing agent behavior, adding domain expertise, or implementing specialized agent personalities.

### 4. Streaming vs Single-Turn Mode

The SDK supports both streaming and single-turn modes for different use cases.

**Reference**: `references/agent-sdk_streaming-vs-single-mode.md`

**Key concepts**:

- Streaming for real-time responses
- Single-turn for batch processing
- Trade-offs and performance considerations
- Implementation patterns

**When to reference**: When deciding on interaction mode, implementing real-time UIs, or optimizing for specific use cases.

### 5. Structured Outputs

Generate structured data with schema validation and type safety.

**Reference**: `references/agent-sdk_structured-outputs.md`

**Key concepts**:

- Defining output schemas
- JSON schema validation
- Type-safe responses
- Error handling

**When to reference**: When generating structured data, implementing type-safe responses, or validating outputs.

## Advanced Features

### 1. Agent Skills

Skills provide specialized knowledge and workflows to agents.

**Reference**: `references/agent-sdk_skills.md`

**Key concepts**:

- Creating and registering Skills
- Skill structure (SKILL.md, scripts, references, assets)
- Skill activation and context loading
- Distributing Skills

**When to reference**: When adding specialized capabilities, domain knowledge, or reusable workflows to agents.

### 2. Plugins

Plugins bundle multiple components (Skills, Slash Commands, Subagents, Hooks, MCP servers) for distribution.

**Reference**: `references/agent-sdk_plugins.md`

**Key concepts**:

- Plugin architecture
- Creating plugin packages
- Plugin manifest (plugin.json)
- Distribution via marketplaces

**When to reference**: When bundling related components, distributing tools, or creating reusable agent extensions.

### 3. Slash Commands

Slash Commands are user-invoked shortcuts that expand to prompts.

**Reference**: `references/agent-sdk_slash-commands.md`

**Key concepts**:

- Creating slash commands
- Command arguments and parameters
- Integration with bash scripts
- Command discovery

**When to reference**: When implementing user-triggered workflows, shortcuts, or custom operations.

### 4. Subagents

Subagents are specialized agents with custom system prompts and tool access.

**Reference**: `references/agent-sdk_subagents.md`

**Key concepts**:

- Creating subagent configurations
- Tool permission scoping
- Agent specialization patterns
- Subagent invocation

**When to reference**: When implementing specialized agents, task delegation, or multi-agent workflows.

## Tools & Integration

### 1. Custom Tools

Extend agent capabilities with custom tools.

**Reference**: `references/agent-sdk_custom-tools.md`

**Key concepts**:

- Tool definition schemas
- Implementing tool handlers
- Parameter validation
- Error handling

**When to reference**: When adding custom functionality, integrating APIs, or extending agent capabilities.

### 2. MCP (Model Context Protocol)

Integrate external tools and services via MCP.

**Reference**: `references/agent-sdk_mcp.md`

**Key concepts**:

- MCP server configuration
- Tool discovery and registration
- Connection management
- MCP protocol implementation

**When to reference**: When integrating external tools, databases, or third-party services.

### 3. Hosting & Deployment

Deploy SDK applications in production environments.

**Reference**: `references/agent-sdk_hosting.md`

**Key concepts**:

- Deployment architectures
- Environment configuration
- Scaling considerations
- Security best practices

**When to reference**: When deploying to production, configuring infrastructure, or optimizing performance.

### 4. Todo Lists

Implement task tracking and progress visualization.

**Reference**: `references/agent-sdk_todo-tracking.md`

**Key concepts**:

- Todo list API
- Task state management
- Progress tracking
- UI integration

**When to reference**: When implementing task tracking, progress visualization, or multi-step workflows.

### 5. Cost Tracking & Usage Monitoring

Monitor API usage and costs.

**Reference**: `references/agent-sdk_cost-tracking.md`

**Key concepts**:

- Usage tracking APIs
- Cost calculation
- Token counting
- Budget management

**When to reference**: When implementing cost controls, usage analytics, or budget tracking.

## Development Workflow

### Building New Applications

When starting a new SDK project:

1. **Choose language**: Python or TypeScript
2. **Review API reference**: Load the appropriate API reference doc
3. **Understand core concepts**: Review session management and permissions
4. **Implement basic agent**: Start with simple tool integration
5. **Add features**: Sessions, streaming, structured outputs as needed
6. **Extend with plugins**: Add Skills, Slash Commands, Subagents as appropriate
7. **Deploy**: Reference hosting guide for production deployment

### Answering SDK Questions

When answering questions about the SDK:

1. **Identify topic area**: Core features, advanced features, or tools/integration
2. **Load relevant references**: Use the reference map above
3. **Search for specifics**: Use Grep to find exact APIs, examples, or patterns
4. **Provide code examples**: Reference examples from documentation
5. **Link to additional resources**: Point to specific reference files for deeper exploration

### Troubleshooting

When debugging SDK issues:

1. **Check migration guide**: If migrating from legacy implementation
2. **Review permissions**: Verify tool permissions are correctly configured
3. **Validate schemas**: For structured outputs, check schema definitions
4. **Check MCP connections**: Verify MCP servers are running and accessible

## Reference Documentation Index

All SDK documentation is available in the `references/` directory:

**API References**:

- `agent-sdk_python.md` - Python API
- `agent-sdk_typescript.md` - TypeScript API

**Core Features**:

- `agent-sdk_overview.md` - SDK overview
- `agent-sdk_permissions.md` - Permissions system
- `agent-sdk_migration-guide.md` - Migration guide
- `agent-sdk_modifying-system-prompts.md` - System prompts
- `agent-sdk_sessions.md` - Session management
- `agent-sdk_streaming-vs-single-mode.md` - Streaming modes
- `agent-sdk_structured-outputs.md` - Structured outputs

**Advanced Features**:

- `agent-sdk_skills.md` - Agent Skills
- `agent-sdk_plugins.md` - Plugins
- `agent-sdk_slash-commands.md` - Slash Commands
- `agent-sdk_subagents.md` - Subagents

**Tools & Integration**:

- `agent-sdk_custom-tools.md` - Custom tools
- `agent-sdk_hosting.md` - Hosting & deployment
- `agent-sdk_mcp.md` - MCP integration
- `agent-sdk_todo-tracking.md` - Todo lists
- `agent-sdk_cost-tracking.md` - Cost tracking

## Best Practices

### Code Examples

When providing code examples:

- Reference actual examples from documentation
- Adapt to user's language preference (Python vs TypeScript)
- Include error handling and edge cases
- Show complete working examples, not just snippets

### Integration Patterns

Common integration patterns:

- **Skills + Custom Tools**: Combine domain knowledge with custom functionality
- **Slash Commands + Subagents**: User-triggered specialized agents
- **MCP + Permissions**: Secure external tool integration
- **Sessions + Structured Outputs**: Stateful multi-turn interactions with type-safe responses
