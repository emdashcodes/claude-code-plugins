#!/usr/bin/env bash

# create_subagent.sh - Helper script to create Claude Code subagents
#
# Usage:
#   create_subagent.sh <agent-name> [--project|--user|--plugin [plugin-name]] [--template <template-name>]
#
# Examples:
#   create_subagent.sh my-agent --project --template code-reviewer
#   create_subagent.sh my-agent --user --template debugger
#   create_subagent.sh my-agent --plugin --template custom
#   create_subagent.sh my-agent --plugin my-plugin --template data-scientist

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory (where templates are located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_DIR="$(dirname "$SCRIPT_DIR")/assets"

# Default values
AGENT_NAME=""
SCOPE=""
PLUGIN_NAME=""
TEMPLATE="custom"

# Available templates
TEMPLATES=("code-reviewer" "debugger" "custom")

# Print usage information
usage() {
    echo "Usage: $0 <agent-name> [--project|--user|--plugin [plugin-name]] [--template <template-name>]"
    echo ""
    echo "Arguments:"
    echo "  <agent-name>           Name of the subagent (lowercase, hyphens only)"
    echo ""
    echo "Options:"
    echo "  --project              Create in .claude/agents/ (project scope)"
    echo "  --user                 Create in ~/.claude/agents/ (user scope)"
    echo "  --plugin [name]        Create in plugin's agents/ directory"
    echo "                         If name omitted, auto-detects from current directory"
    echo "  --template <name>      Template to use (default: custom)"
    echo ""
    echo "Available templates:"
    for t in "${TEMPLATES[@]}"; do
        echo "  - $t"
    done
    echo ""
    echo "Examples:"
    echo "  $0 code-reviewer --project --template code-reviewer"
    echo "  $0 my-debugger --user --template debugger"
    echo "  $0 api-tester --plugin --template custom"
    echo "  $0 data-analyzer --plugin my-plugin --template data-scientist"
    exit 1
}

# Validate agent name
validate_name() {
    local name="$1"
    if [[ ! "$name" =~ ^[a-z0-9-]+$ ]]; then
        echo -e "${RED}Error: Agent name must be lowercase alphanumeric with hyphens only${NC}"
        echo "  Got: $name"
        echo "  Valid examples: code-reviewer, my-agent, test-runner-jest"
        exit 1
    fi
}

# Validate template
validate_template() {
    local template="$1"
    local valid=false
    for t in "${TEMPLATES[@]}"; do
        if [[ "$t" == "$template" ]]; then
            valid=true
            break
        fi
    done

    if [[ "$valid" == "false" ]]; then
        echo -e "${RED}Error: Invalid template '$template'${NC}"
        echo "Available templates: ${TEMPLATES[*]}"
        exit 1
    fi
}

# Detect plugin from current directory
detect_plugin() {
    local current_dir="$PWD"

    # Look for .claude-plugin/marketplace.json in current or parent directories
    while [[ "$current_dir" != "/" ]]; do
        if [[ -f "$current_dir/.claude-plugin/marketplace.json" ]]; then
            # Extract plugin name from marketplace.json
            if command -v jq &> /dev/null; then
                PLUGIN_NAME=$(jq -r '.plugins[0].name // empty' "$current_dir/.claude-plugin/marketplace.json" 2>/dev/null)
            fi

            if [[ -z "$PLUGIN_NAME" ]]; then
                # Fallback: use directory name
                PLUGIN_NAME=$(basename "$current_dir")
            fi

            echo -e "${BLUE}Detected plugin: $PLUGIN_NAME${NC}"
            return 0
        fi
        current_dir=$(dirname "$current_dir")
    done

    echo -e "${RED}Error: Could not detect plugin. Please specify plugin name or run from within a plugin directory.${NC}"
    exit 1
}

# Get target directory based on scope
get_target_dir() {
    case "$SCOPE" in
        project)
            echo ".claude/agents"
            ;;
        user)
            echo "$HOME/.claude/agents"
            ;;
        plugin)
            if [[ -z "$PLUGIN_NAME" ]]; then
                detect_plugin
            fi
            echo "plugins/$PLUGIN_NAME/agents"
            ;;
        *)
            echo -e "${RED}Error: Must specify --project, --user, or --plugin${NC}"
            usage
            ;;
    esac
}

# Create agent from template
create_agent() {
    local agent_name="$1"
    local target_dir="$2"
    local template="$3"

    # Create target directory if it doesn't exist
    mkdir -p "$target_dir"

    # Target file path
    local target_file="$target_dir/$agent_name.md"

    # Check if file already exists
    if [[ -f "$target_file" ]]; then
        echo -e "${YELLOW}Warning: Agent already exists at $target_file${NC}"
        read -p "Overwrite? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 1
        fi
    fi

    # Copy template
    local template_file="$ASSETS_DIR/$template.md"

    if [[ ! -f "$template_file" ]]; then
        echo -e "${RED}Error: Template file not found: $template_file${NC}"
        exit 1
    fi

    # Copy template and update name in frontmatter
    if [[ "$template" == "custom" ]]; then
        # For custom template, replace the placeholder name
        sed "s/name: custom-agent/name: $agent_name/" "$template_file" > "$target_file"
    else
        # For other templates, use as-is (they have proper names already)
        # But update the name to match the requested agent name
        sed "s/name: $template/name: $agent_name/" "$template_file" > "$target_file"
    fi

    echo -e "${GREEN}✓ Created subagent: $target_file${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Edit the subagent file: $target_file"
    echo "   - Update the description in frontmatter"
    echo "   - Customize the system prompt"
    echo "   - Configure tools if needed"

    if [[ "$SCOPE" == "plugin" ]]; then
        echo ""
        echo -e "${YELLOW}Plugin subagent:${NC}"
        echo "2. Register in .claude-plugin/marketplace.json:"
        echo "   Add \"./agents/$agent_name.md\" to the plugin's 'agents' array"
        echo ""
        echo "   Example:"
        echo "   {"
        echo "     \"name\": \"$PLUGIN_NAME\","
        echo "     \"agents\": ["
        echo "       \"./agents/$agent_name.md\""
        echo "     ]"
        echo "   }"
    fi

    echo ""
    echo -e "${BLUE}Testing:${NC}"
    echo "- Run /agents to see your new subagent"
    echo "- Test automatic invocation with matching tasks"
    echo "- Test explicit invocation: \"Use the $agent_name subagent to...\""
}

# Parse arguments
if [[ $# -lt 2 ]]; then
    usage
fi

AGENT_NAME="$1"
shift

while [[ $# -gt 0 ]]; do
    case "$1" in
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
            shift
            # Check if next arg is a plugin name (not a flag)
            if [[ $# -gt 0 && ! "$1" =~ ^-- ]]; then
                PLUGIN_NAME="$1"
                shift
            fi
            ;;
        --template)
            if [[ $# -lt 2 ]]; then
                echo -e "${RED}Error: --template requires a template name${NC}"
                usage
            fi
            TEMPLATE="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            usage
            ;;
    esac
done

# Validate inputs
validate_name "$AGENT_NAME"
validate_template "$TEMPLATE"

# Get target directory
TARGET_DIR=$(get_target_dir)

# Create the agent
create_agent "$AGENT_NAME" "$TARGET_DIR" "$TEMPLATE"
