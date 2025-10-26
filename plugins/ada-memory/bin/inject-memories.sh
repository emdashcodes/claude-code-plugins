#!/bin/bash
# Memory Injection Hook for UserPromptSubmit
# Retrieves relevant memories from Ada's mem0-powered memory service

# Execute the Node.js script with proper error handling
NODE_SCRIPT="${CLAUDE_PLUGIN_ROOT}/src/hooks/inject.js"

if [ ! -f "$NODE_SCRIPT" ]; then
    echo "Error: Memory injection script not found at $NODE_SCRIPT" >&2
    exit 1
fi

# Run the Node.js script, passing stdin through
exec node "$NODE_SCRIPT"
