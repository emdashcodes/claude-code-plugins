#!/bin/bash

# create_slash_command.sh
# Helper script to create a new slash command file

set -e

# Usage information
usage() {
    echo "Usage: $0 <command-name> [--project|--user|--plugin [plugin-name]] [--template <basic|arguments|bash|advanced>]"
    echo ""
    echo "Options:"
    echo "  --project           Create command in .claude/commands/ (default)"
    echo "  --user              Create command in ~/.claude/commands/"
    echo "  --plugin [name]     Create command in plugin's commands/ directory"
    echo "                      If name omitted, auto-detects from current directory"
    echo "  --template <type>   Use a specific template (basic, arguments, bash, advanced)"
    echo ""
    echo "Examples:"
    echo "  $0 my-command --project"
    echo "  $0 my-command --user --template advanced"
    echo "  $0 my-command --plugin my-plugin"
    echo "  $0 my-command --plugin  # auto-detect plugin from current directory"
    exit 1
}

# Function to find marketplace root
find_marketplace_root() {
    local dir="$PWD"
    while [ "$dir" != "/" ]; do
        if [ -f "$dir/.claude-plugin/marketplace.json" ]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

# Function to detect current plugin
detect_plugin() {
    local dir="$PWD"
    local marketplace_root

    # Find marketplace root
    marketplace_root=$(find_marketplace_root)
    if [ -z "$marketplace_root" ]; then
        echo "Error: Not in a plugin marketplace directory (no .claude-plugin/marketplace.json found)" >&2
        return 1
    fi

    # Check if we're in a plugin directory
    local rel_path="${dir#$marketplace_root/}"

    # Try to extract plugin name from path like "plugins/plugin-name/..."
    if [[ "$rel_path" =~ ^plugins/([^/]+) ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
    fi

    echo "Error: Cannot detect plugin. Please specify plugin name with --plugin <name>" >&2
    return 1
}

# Function to find plugin directory
find_plugin_dir() {
    local plugin_name="$1"
    local marketplace_root

    marketplace_root=$(find_marketplace_root)
    if [ -z "$marketplace_root" ]; then
        echo "Error: Not in a plugin marketplace directory" >&2
        return 1
    fi

    local plugin_dir="$marketplace_root/plugins/$plugin_name"

    if [ ! -d "$plugin_dir" ]; then
        echo "Error: Plugin directory not found at $plugin_dir" >&2
        return 1
    fi

    echo "$plugin_dir"
    return 0
}

# Check if command name is provided
if [ -z "$1" ]; then
    usage
fi

COMMAND_NAME="$1"
SCOPE="project"
TEMPLATE="basic"
PLUGIN_NAME=""

# Parse optional arguments
shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --project)
            SCOPE="project"
            shift
            ;;
        --user)
            SCOPE="user"
            shift
            ;;
        --plugin)
            SCOPE="plugin"
            # Check if next arg is a plugin name or another flag
            if [[ $# -gt 1 && ! "$2" =~ ^-- ]]; then
                PLUGIN_NAME="$2"
                shift 2
            else
                # Auto-detect plugin
                PLUGIN_NAME=$(detect_plugin) || exit 1
                shift
            fi
            ;;
        --template)
            TEMPLATE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate template
if [[ ! "$TEMPLATE" =~ ^(basic|arguments|bash|advanced)$ ]]; then
    echo "Error: Template must be one of: basic, arguments, bash, advanced"
    exit 1
fi

# Determine target directory based on scope
if [ "$SCOPE" = "project" ]; then
    TARGET_DIR=".claude/commands"
elif [ "$SCOPE" = "user" ]; then
    TARGET_DIR="$HOME/.claude/commands"
elif [ "$SCOPE" = "plugin" ]; then
    PLUGIN_DIR=$(find_plugin_dir "$PLUGIN_NAME") || exit 1
    TARGET_DIR="$PLUGIN_DIR/commands"
fi

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Determine target file path
TARGET_FILE="$TARGET_DIR/${COMMAND_NAME}.md"

# Check if file already exists
if [ -f "$TARGET_FILE" ]; then
    echo "Error: Command file already exists at $TARGET_FILE"
    exit 1
fi

# Get the skill directory (where this script is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TEMPLATE_FILE="$SKILL_DIR/assets/template-${TEMPLATE}.md"

# Check if template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: Template file not found at $TEMPLATE_FILE"
    exit 1
fi

# Copy template to target location
cp "$TEMPLATE_FILE" "$TARGET_FILE"

echo "✓ Created slash command: $TARGET_FILE"
echo ""

# Provide scope-specific next steps
if [ "$SCOPE" = "plugin" ]; then
    echo "Next steps:"
    echo "1. Edit the command file to customize it"
    echo "2. Register the command in .claude-plugin/marketplace.json:"
    echo "   Add \"./commands/${COMMAND_NAME}.md\" to the plugin's 'commands' array"
    echo "3. Test with: /${PLUGIN_NAME}:${COMMAND_NAME}"
    echo "4. View all commands with: /help"
else
    echo "Next steps:"
    echo "1. Edit the command file to customize it"
    echo "2. Test with: /${COMMAND_NAME}"
    echo "3. View all commands with: /help"
fi
