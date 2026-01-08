---
title: Todo Lists
source_url: https://platform.claude.com/docs/en/agent-sdk/todo-tracking
---

Todo tracking provides a structured way to manage tasks and display progress to users. The Claude Agent SDK includes built-in todo functionality that helps organize complex workflows and keep users informed about task progression.

### Todo Lifecycle

Todos follow a predictable lifecycle:

1. **Created** as `pending` when tasks are identified
2. **Activated** to `in_progress` when work begins
3. **Completed** when the task finishes successfully
4. **Removed** when all tasks in a group are completed

### When Todos Are Used

The SDK automatically creates todos for:

- **Complex multi-step tasks** requiring 3 or more distinct actions
- **User-provided task lists** when multiple items are mentioned
- **Non-trivial operations** that benefit from progress tracking
- **Explicit requests** when users ask for todo organization

## Examples

### Monitoring Todo Changes

    import { query } from "@anthropic-ai/claude-agent-sdk";

    for await (const message of query({
      prompt: "Optimize my React app performance and track progress with todos",
      options: { maxTurns: 15 }
    })) {
      // Todo updates are reflected in the message stream
      if (message.type === "assistant") {
        for (const block of message.message.content) {
          if (block.type === "tool_use" && block.name === "TodoWrite") {
            const todos = block.input.todos;

            console.log("Todo Status Update:");
            todos.forEach((todo, index) => {
              const status = todo.status === "completed" ? "✅" :
                            todo.status === "in_progress" ? "🔧" : "❌";
              console.log(`${index + 1}. ${status} ${todo.content}`);
            });
          }
        }
      }
    }

### Real-time Progress Display

    import { query } from "@anthropic-ai/claude-agent-sdk";

    class TodoTracker {
      private todos: any[] = [];

      displayProgress() {
        if (this.todos.length === 0) return;

        const completed = this.todos.filter(t => t.status === "completed").length;
        const inProgress = this.todos.filter(t => t.status === "in_progress").length;
        const total = this.todos.length;

        console.log(`\nProgress: ${completed}/${total} completed`);
        console.log(`Currently working on: ${inProgress} task(s)\n`);

        this.todos.forEach((todo, index) => {
          const icon = todo.status === "completed" ? "✅" : 
                      todo.status === "in_progress" ? "🔧" : "❌";
          const text = todo.status === "in_progress" ? todo.activeForm : todo.content;
          console.log(`${index + 1}. ${icon} ${text}`);
        });
      }

      async trackQuery(prompt: string) {
        for await (const message of query({
          prompt,
          options: { maxTurns: 20 }
        })) {
          if (message.type === "assistant") {
            for (const block of message.message.content) {
              if (block.type === "tool_use" && block.name === "TodoWrite") {
                this.todos = block.input.todos;
                this.displayProgress();
              }
            }
          }
        }
      }
    }

    // Usage
    const tracker = new TodoTracker();
    await tracker.trackQuery("Build a complete authentication system with todos");

## Related Documentation

- [TypeScript SDK Reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Python SDK Reference](https://platform.claude.com/docs/en/agent-sdk/python)
- [Streaming vs Single Mode](https://platform.claude.com/docs/en/agent-sdk/streaming-vs-single-mode)
- [Custom Tools](https://platform.claude.com/docs/en/agent-sdk/custom-tools)
