#!/bin/bash
# Memory Extraction Script
# Reads session history and extracts memories via Ada's mem0 service

# Execute the Node.js script with proper error handling
NODE_SCRIPT="${CLAUDE_PLUGIN_ROOT}/src/hooks/extract.js"

if [ ! -f "$NODE_SCRIPT" ]; then
    echo "Error: Memory extraction script not found at $NODE_SCRIPT" >&2
    exit 1
fi

# Run the Node.js script, passing stdin through
exec node "$NODE_SCRIPT"
