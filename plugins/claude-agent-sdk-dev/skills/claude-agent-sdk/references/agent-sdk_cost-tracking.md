---
title: Tracking Costs and Usage
source_url: https://platform.claude.com/docs/en/agent-sdk/cost-tracking
---

# SDK Cost Tracking

The Claude Agent SDK provides detailed token usage information for each interaction with Claude. This guide explains how to properly track costs and understand usage reporting, especially when dealing with parallel tool uses and multi-step conversations.

For complete API documentation, see the [TypeScript SDK reference](https://platform.claude.com/docs/en/agent-sdk/typescript).

## Understanding Token Usage

When Claude processes requests, it reports token usage at the message level. This usage data is essential for tracking costs and billing users appropriately.

### Key Concepts

1. **Steps**: A step is a single request/response pair between your application and Claude
2. **Messages**: Individual messages within a step (text, tool uses, tool results)
3. **Usage**: Token consumption data attached to assistant messages

## Usage Reporting Structure

### Single vs Parallel Tool Use

When Claude executes tools, the usage reporting differs based on whether tools are executed sequentially or in parallel:

    import { query } from "@anthropic-ai/claude-agent-sdk";

    // Example: Tracking usage in a conversation
    const result = await query({
      prompt: "Analyze this codebase and run tests",
      options: {
        onMessage: (message) => {
          if (message.type === 'assistant' && message.usage) {
            console.log(`Message ID: ${message.id}`);
            console.log(`Usage:`, message.usage);
          }
        }
      }
    });

### Message Flow Example

Here's how messages and usage are reported in a typical multi-step conversation:

    <!-- Step 1: Initial request with parallel tool uses -->
    assistant (text)      { id: "msg_1", usage: { output_tokens: 100, ... } }
    assistant (tool_use)  { id: "msg_1", usage: { output_tokens: 100, ... } }
    assistant (tool_use)  { id: "msg_1", usage: { output_tokens: 100, ... } }
    assistant (tool_use)  { id: "msg_1", usage: { output_tokens: 100, ... } }
    user (tool_result)
    user (tool_result)
    user (tool_result)

    <!-- Step 2: Follow-up response -->
    assistant (text)      { id: "msg_2", usage: { output_tokens: 98, ... } }

## Important Usage Rules

### 1\. Same ID = Same Usage

**All messages with the same `id` field report identical usage**. When Claude sends multiple messages in the same turn (e.g., text + tool uses), they share the same message ID and usage data.

    // All these messages have the same ID and usage
    const messages = [
      { type: 'assistant', id: 'msg_123', usage: { output_tokens: 100 } },
      { type: 'assistant', id: 'msg_123', usage: { output_tokens: 100 } },
      { type: 'assistant', id: 'msg_123', usage: { output_tokens: 100 } }
    ];

    // Charge only once per unique message ID
    const uniqueUsage = messages[0].usage; // Same for all messages with this ID

### 2\. Charge Once Per Step

**You should only charge users once per step**, not for each individual message. When you see multiple assistant messages with the same ID, use the usage from any one of them.

### 3\. Result Message Contains Cumulative Usage

The final `result` message contains the total cumulative usage from all steps in the conversation:

    // Final result includes total usage
    const result = await query({
      prompt: "Multi-step task",
      options: { /* ... */ }
    });

    console.log("Total usage:", result.usage);
    console.log("Total cost:", result.usage.total_cost_usd);

## Implementation: Cost Tracking System

Here's a complete example of implementing a cost tracking system:

    import { query } from "@anthropic-ai/claude-agent-sdk";

    class CostTracker {
      private processedMessageIds = new Set<string>();
      private stepUsages: Array<any> = [];

      async trackConversation(prompt: string) {
        const result = await query({
          prompt,
          options: {
            onMessage: (message) => {
              this.processMessage(message);
            }
          }
        });

        return {
          result,
          stepUsages: this.stepUsages,
          totalCost: result.usage?.total_cost_usd || 0
        };
      }

      private processMessage(message: any) {
        // Only process assistant messages with usage
        if (message.type !== 'assistant' || !message.usage) {
          return;
        }

        // Skip if we've already processed this message ID
        if (this.processedMessageIds.has(message.id)) {
          return;
        }

        // Mark as processed and record usage
        this.processedMessageIds.add(message.id);
        this.stepUsages.push({
          messageId: message.id,
          timestamp: new Date().toISOString(),
          usage: message.usage,
          costUSD: this.calculateCost(message.usage)
        });
      }

      private calculateCost(usage: any): number {
        // Implement your pricing calculation here
        // This is a simplified example
        const inputCost = usage.input_tokens * 0.00003;
        const outputCost = usage.output_tokens * 0.00015;
        const cacheReadCost = (usage.cache_read_input_tokens || 0) * 0.0000075;

        return inputCost + outputCost + cacheReadCost;
      }
    }

    // Usage
    const tracker = new CostTracker();
    const { result, stepUsages, totalCost } = await tracker.trackConversation(
      "Analyze and refactor this code"
    );

    console.log(`Steps processed: ${stepUsages.length}`);
    console.log(`Total cost: $${totalCost.toFixed(4)}`);

## Handling Edge Cases

### Output Token Discrepancies

In rare cases, you might observe different `output_tokens` values for messages with the same ID. When this occurs:

1. **Use the highest value** - The final message in a group typically contains the accurate total
2. **Verify against total cost** - The `total_cost_usd` in the result message is authoritative
3. **Report inconsistencies** - File issues at the [Claude Code GitHub repository](https://github.com/anthropics/claude-code/issues)

### Cache Token Tracking

When using prompt caching, track these token types separately:

    interface CacheUsage {
      cache_creation_input_tokens: number;
      cache_read_input_tokens: number;
      cache_creation: {
        ephemeral_5m_input_tokens: number;
        ephemeral_1h_input_tokens: number;
      };
    }

## Best Practices

1. **Use Message IDs for Deduplication**: Always track processed message IDs to avoid double-charging
2. **Monitor the Result Message**: The final result contains authoritative cumulative usage
3. **Implement Logging**: Log all usage data for auditing and debugging
4. **Handle Failures Gracefully**: Track partial usage even if a conversation fails
5. **Consider Streaming**: For streaming responses, accumulate usage as messages arrive

## Usage Fields Reference

Each usage object contains:

- `input_tokens`: Base input tokens processed
- `output_tokens`: Tokens generated in the response
- `cache_creation_input_tokens`: Tokens used to create cache entries
- `cache_read_input_tokens`: Tokens read from cache
- `service_tier`: The service tier used (e.g., "standard")
- `total_cost_usd`: Total cost in USD (only in result message)

## Example: Building a Billing Dashboard

Here's how to aggregate usage data for a billing dashboard:

    class BillingAggregator {
      private userUsage = new Map<string, {
        totalTokens: number;
        totalCost: number;
        conversations: number;
      }>();

      async processUserRequest(userId: string, prompt: string) {
        const tracker = new CostTracker();
        const { result, stepUsages, totalCost } = await tracker.trackConversation(prompt);

        // Update user totals
        const current = this.userUsage.get(userId) || {
          totalTokens: 0,
          totalCost: 0,
          conversations: 0
        };

        const totalTokens = stepUsages.reduce((sum, step) => 
          sum + step.usage.input_tokens + step.usage.output_tokens, 0
        );

        this.userUsage.set(userId, {
          totalTokens: current.totalTokens + totalTokens,
          totalCost: current.totalCost + totalCost,
          conversations: current.conversations + 1
        });

        return result;
      }

      getUserBilling(userId: string) {
        return this.userUsage.get(userId) || {
          totalTokens: 0,
          totalCost: 0,
          conversations: 0
        };
      }
    }

## Related Documentation

- [TypeScript SDK Reference](https://platform.claude.com/docs/en/agent-sdk/typescript) - Complete API documentation
- [SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview) - Getting started with the SDK
- [SDK Permissions](https://platform.claude.com/docs/en/agent-sdk/permissions) - Managing tool permissions
