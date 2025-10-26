#!/bin/bash
# Session Cleanup Hook for SessionEnd
# Removes cached memory entries for ended sessions

# Execute the Node.js script with proper error handling
NODE_SCRIPT="${CLAUDE_PLUGIN_ROOT}/src/hooks/cleanup-session.js"

if [ ! -f "$NODE_SCRIPT" ]; then
    echo "Error: Session cleanup script not found at $NODE_SCRIPT" >&2
    exit 1
fi

# Run the Node.js script, passing stdin through
exec node "$NODE_SCRIPT"
