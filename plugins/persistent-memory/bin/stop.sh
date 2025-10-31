#!/bin/bash
# Stop Hook - Trigger Memory Extraction
# Checks if extraction threshold is reached and triggers extraction

# Execute the Node.js script with proper error handling
NODE_SCRIPT="${CLAUDE_PLUGIN_ROOT}/src/hooks/stop.js"

if [ ! -f "$NODE_SCRIPT" ]; then
    echo "Error: Stop hook script not found at $NODE_SCRIPT" >&2
    exit 1
fi

# Run the Node.js script, passing stdin through
exec node "$NODE_SCRIPT"
