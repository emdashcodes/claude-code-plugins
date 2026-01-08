---
title: MCP in the SDK
source_url: https://platform.claude.com/docs/en/agent-sdk/mcp
---

## Overview

Model Context Protocol (MCP) servers extend Claude Code with custom tools and capabilities. MCPs can run as external processes, connect via HTTP/SSE, or execute directly within your SDK application.

## Configuration

### Basic Configuration

Configure MCP servers in `.mcp.json` at your project root:

    {
      "mcpServers": {
        "filesystem": {
          "command": "npx",
          "args": ["@modelcontextprotocol/server-filesystem"],
          "env": {
            "ALLOWED_PATHS": "/Users/me/projects"
          }
        }
      }
    }

### Using MCP Servers in SDK

    import { query } from "@anthropic-ai/claude-agent-sdk";

    for await (const message of query({
      prompt: "List files in my project",
      options: {
        mcpServers: {
          "filesystem": {
            command: "npx",
            args: ["@modelcontextprotocol/server-filesystem"],
            env: {
              ALLOWED_PATHS: "/Users/me/projects"
            }
          }
        },
        allowedTools: ["mcp__filesystem__list_files"]
      }
    })) {
      if (message.type === "result" && message.subtype === "success") {
        console.log(message.result);
      }
    }

## Transport Types

### stdio Servers

External processes communicating via stdin/stdout:

    // .mcp.json configuration
    {
      "mcpServers": {
        "my-tool": {
          "command": "node",
          "args": ["./my-mcp-server.js"],
          "env": {
            "DEBUG": "${DEBUG:-false}"
          }
        }
      }
    }

### HTTP/SSE Servers

Remote servers with network communication:

    // SSE server configuration
    {
      "mcpServers": {
        "remote-api": {
          "type": "sse",
          "url": "https://api.example.com/mcp/sse",
          "headers": {
            "Authorization": "Bearer ${API_TOKEN}"
          }
        }
      }
    }

    // HTTP server configuration
    {
      "mcpServers": {
        "http-service": {
          "type": "http",
          "url": "https://api.example.com/mcp",
          "headers": {
            "X-API-Key": "${API_KEY}"
          }
        }
      }
    }

### SDK MCP Servers

In-process servers running within your application. For detailed information on creating custom tools, see the [Custom Tools guide](https://platform.claude.com/docs/en/agent-sdk/custom-tools):

## Resource Management

MCP servers can expose resources that Claude can list and read:

    import { query } from "@anthropic-ai/claude-agent-sdk";

    // List available resources
    for await (const message of query({
      prompt: "What resources are available from the database server?",
      options: {
        mcpServers: {
          "database": {
            command: "npx",
            args: ["@modelcontextprotocol/server-database"]
          }
        },
        allowedTools: ["mcp__list_resources", "mcp__read_resource"]
      }
    })) {
      if (message.type === "result") console.log(message.result);
    }

## Authentication

### Environment Variables

    // .mcp.json with environment variables
    {
      "mcpServers": {
        "secure-api": {
          "type": "sse",
          "url": "https://api.example.com/mcp",
          "headers": {
            "Authorization": "Bearer ${API_TOKEN}",
            "X-API-Key": "${API_KEY:-default-key}"
          }
        }
      }
    }

    // Set environment variables
    process.env.API_TOKEN = "your-token";
    process.env.API_KEY = "your-key";

### OAuth2 Authentication

OAuth2 MCP authentication in-client is not currently supported.

## Error Handling

Handle MCP connection failures gracefully:

    import { query } from "@anthropic-ai/claude-agent-sdk";

    for await (const message of query({
      prompt: "Process data",
      options: {
        mcpServers: {
          "data-processor": dataServer
        }
      }
    })) {
      if (message.type === "system" && message.subtype === "init") {
        // Check MCP server status
        const failedServers = message.mcp_servers.filter(
          s => s.status !== "connected"
        );

        if (failedServers.length > 0) {
          console.warn("Failed to connect:", failedServers);
        }
      }

      if (message.type === "result" && message.subtype === "error_during_execution") {
        console.error("Execution failed");
      }
    }

## Related Resources

- [Custom Tools Guide](https://platform.claude.com/docs/en/agent-sdk/custom-tools) - Detailed guide on creating SDK MCP servers
- [TypeScript SDK Reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Python SDK Reference](https://platform.claude.com/docs/en/agent-sdk/python)
- [SDK Permissions](https://platform.claude.com/docs/en/agent-sdk/permissions)
- [Common Workflows](https://code.claude.com/docs/en/common-workflows)
