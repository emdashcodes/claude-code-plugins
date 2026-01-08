---
title: Streaming Input
source_url: https://platform.claude.com/docs/en/agent-sdk/streaming-vs-single-mode
---

## Overview

The Claude Agent SDK supports two distinct input modes for interacting with agents:

- **Streaming Input Mode** (Default & Recommended) - A persistent, interactive session
- **Single Message Input** - One-shot queries that use session state and resuming

This guide explains the differences, benefits, and use cases for each mode to help you choose the right approach for your application.

## Streaming Input Mode (Recommended)

Streaming input mode is the **preferred** way to use the Claude Agent SDK. It provides full access to the agent's capabilities and enables rich, interactive experiences.

It allows the agent to operate as a long lived process that takes in user input, handles interruptions, surfaces permission requests, and handles session management.

### How It Works

    %%{init: {"theme": "base", "themeVariables": {"edgeLabelBackground": "#F0F0EB", "lineColor": "#91918D", "primaryColor": "#F0F0EB", "primaryTextColor": "#191919", "primaryBorderColor": "#D9D8D5", "secondaryColor": "#F5E6D8", "tertiaryColor": "#CC785C", "noteBkgColor": "#FAF0E6", "noteBorderColor": "#91918D"}, "sequence": {"actorMargin": 50, "width": 150, "height": 65, "boxMargin": 10, "boxTextMargin": 5, "noteMargin": 10, "messageMargin": 35}}}%%
    sequenceDiagram
        participant App as Your Application
        participant Agent as Claude Agent
        participant Tools as Tools/Hooks
        participant FS as Environment/<br/>File System

        App->>Agent: Initialize with AsyncGenerator
        activate Agent

        App->>Agent: Yield Message 1
        Agent->>Tools: Execute tools
        Tools->>FS: Read files
        FS-->>Tools: File contents
        Tools->>FS: Write/Edit files
        FS-->>Tools: Success/Error
        Agent-->>App: Stream partial response
        Agent-->>App: Stream more content...
        Agent->>App: Complete Message 1

        App->>Agent: Yield Message 2 + Image
        Agent->>Tools: Process image & execute
        Tools->>FS: Access filesystem
        FS-->>Tools: Operation results
        Agent-->>App: Stream response 2

        App->>Agent: Queue Message 3
        App->>Agent: Interrupt/Cancel
        Agent->>App: Handle interruption

        Note over App,Agent: Session stays alive
        Note over Tools,FS: Persistent file system<br/>state maintained

        deactivate Agent

### Benefits

Image Uploads

Attach images directly to messages for visual analysis and understanding

Queued Messages

Send multiple messages that process sequentially, with ability to interrupt

Tool Integration

Full access to all tools and custom MCP servers during the session

Hooks Support

Use lifecycle hooks to customize behavior at various points

Real-time Feedback

See responses as they're generated, not just final results

Context Persistence

Maintain conversation context across multiple turns naturally

### Implementation Example

    import { query } from "@anthropic-ai/claude-agent-sdk";
    import { readFileSync } from "fs";

    async function* generateMessages() {
      // First message
      yield {
        type: "user" as const,
        message: {
          role: "user" as const,
          content: "Analyze this codebase for security issues"
        }
      };

      // Wait for conditions or user input
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Follow-up with image
      yield {
        type: "user" as const,
        message: {
          role: "user" as const,
          content: [
            {
              type: "text",
              text: "Review this architecture diagram"
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: readFileSync("diagram.png", "base64")
              }
            }
          ]
        }
      };
    }

    // Process streaming responses
    for await (const message of query({
      prompt: generateMessages(),
      options: {
        maxTurns: 10,
        allowedTools: ["Read", "Grep"]
      }
    })) {
      if (message.type === "result") {
        console.log(message.result);
      }
    }

## Single Message Input

Single message input is simpler but more limited.

### When to Use Single Message Input

Use single message input when:

- You need a one-shot response
- You do not need image attachments, hooks, etc.
- You need to operate in a stateless environment, such as a lambda function

### Limitations

Single message input mode does **not** support:

- Direct image attachments in messages
- Dynamic message queueing
- Real-time interruption
- Hook integration
- Natural multi-turn conversations

### Implementation Example

    import { query } from "@anthropic-ai/claude-agent-sdk";

    // Simple one-shot query
    for await (const message of query({
      prompt: "Explain the authentication flow",
      options: {
        maxTurns: 1,
        allowedTools: ["Read", "Grep"]
      }
    })) {
      if (message.type === "result") {
        console.log(message.result);
      }
    }

    // Continue conversation with session management
    for await (const message of query({
      prompt: "Now explain the authorization process",
      options: {
        continue: true,
        maxTurns: 1
      }
    })) {
      if (message.type === "result") {
        console.log(message.result);
      }
    }
