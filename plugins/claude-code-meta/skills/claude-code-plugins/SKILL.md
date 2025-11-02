---
name: claude-code-plugins
description: This skill should be used when creating, configuring, or distributing Claude Code plugins and marketplaces. Use when users ask about the plugin system architecture, how to package multiple components together, create marketplaces, or set up team-wide plugin distribution.
---

# Claude Code Plugins

Guide Claude through creating, configuring, and distributing complete Claude Code plugins and marketplaces.

## Purpose

Plugins are packages that bundle multiple Claude Code extensions (commands, agents, skills, hooks, MCP servers) for distribution. This skill helps understand the plugin architecture, create well-structured plugins, set up marketplaces, and configure team-wide plugin distribution.

## When to Use This Skill

Use this skill when:

- Creating a new plugin that bundles multiple components together
- Setting up plugin marketplaces for team or community distribution
- Configuring team-wide automatic plugin installation
- Understanding how plugins, commands, agents, skills, hooks, and MCP servers relate
- Deciding between creating individual components vs packaging them as plugins
- Troubleshooting plugin structure or distribution issues

**Do NOT use this skill for:**

- Creating individual slash commands - use `claude-code-slash-commands` skill instead
- Creating individual subagents - use `claude-code-subagents` skill instead
- Creating individual hooks - use `claude-code-hooks` skill instead
- Creating individual skills - use `skill-creator` skill instead

## Plugin System Architecture

Claude Code's extensibility system has two levels:

### Individual Components (Project/User Level)

Components can be installed directly in projects or user directories:

- **Commands** - `.claude/commands/` or `~/.claude/commands/`
- **Agents** - `.claude/agents/` or `~/.claude/agents/`
- **Hooks** - `.claude/settings.json` or `~/.claude/settings.json`
- **Skills** - Activated via plugin marketplaces only

### Plugins (Distribution Level)

Plugins bundle multiple components for distribution:

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata (required)
├── commands/                 # Slash commands (optional)
│   └── deploy.md
├── agents/                   # Subagents (optional)
│   └── reviewer.md
├── skills/                   # Agent Skills (optional)
│   └── code-quality/
│       └── SKILL.md
├── hooks/                    # Event handlers (optional)
│   └── hooks.json
└── .mcp.json                 # MCP servers (optional)
```

## When to Create Plugins vs Individual Components

### Use Individual Components When:

- Creating one-off customizations for a single project
- Testing new workflows before wider distribution
- Building personal preferences not shared with others
- Components are independent and don't require coordination

### Use Plugins When:

- Bundling related components that work together
- Distributing tools across multiple projects or teams
- Versioning and updating components as a unit
- Providing Skills (Skills require plugin distribution)
- Creating reusable workflows for community sharing

## Plugin Creation Process

To create a plugin, follow this process in order:

### Step 1: Understanding Plugin Requirements

Skip this step only when the plugin's purpose and components are already clearly defined.

To create an effective plugin, clearly understand what components the plugin should include and how they work together. This understanding can come from existing workflows that need packaging or new requirements.

For example, when building a deployment automation plugin, relevant considerations include:

- "What commands do users need? Deploy, rollback, status checks?"
- "Should there be a specialized deployment agent?"
- "What hooks are needed? Pre-deploy validation, post-deploy notifications?"
- "Are there external tools to integrate via MCP?"
- "Should this include Skills for automatic deployment analysis?"

For a code quality plugin:

- "What formatting/linting commands are needed?"
- "Should there be a code review agent?"
- "What hooks trigger on file changes?"
- "Should Skills provide automatic code analysis?"

Conclude this step when there is a clear sense of:
1. What components the plugin needs
2. How components interact with each other
3. Who will use the plugin (project team, organization, community)

### Step 2: Planning Component Organization

To turn requirements into an effective plugin, analyze the use case by:

1. Identifying which component types are needed (commands, agents, skills, hooks, MCP)
2. Determining how components should be organized
3. Deciding on plugin scope and distribution strategy

Example: For a deployment automation plugin, the analysis shows:

1. **Commands** - `/deploy`, `/rollback`, `/deploy-status`
2. **Agent** - `deployment-manager` for handling complex deployments
3. **Hooks** - PreToolUse validation for deployment commands
4. **Skills** - `deployment-analysis` for automatic deployment planning
5. **Distribution** - Organization-wide via private marketplace

Example: For a code quality plugin, the analysis shows:

1. **Commands** - `/format`, `/lint`, `/review-code`
2. **Agent** - `code-reviewer` for comprehensive reviews
3. **Hooks** - PostToolUse formatting after file edits
4. **Skills** - `code-quality-checker` for automatic analysis
5. **Distribution** - Open source via GitHub marketplace

Review the component-specific skills for detailed guidance:
- [references/plugins-guide.md](references/plugins-guide.md) for complete plugin documentation
- `claude-code-slash-commands` skill for command creation
- `claude-code-subagents` skill for agent creation
- `claude-code-hooks` skill for hook creation
- `skill-creator` skill for Skills creation

### Step 3: Creating Plugin Structure

At this point, create the basic plugin structure:

1. **Create plugin directory** - Choose a descriptive kebab-case name:
   ```bash
   mkdir my-plugin
   cd my-plugin
   ```

2. **Create plugin manifest** - Required `.claude-plugin/plugin.json`:
   ```bash
   mkdir .claude-plugin
   cat > .claude-plugin/plugin.json << 'EOF'
   {
     "name": "my-plugin",
     "version": "1.0.0",
     "description": "Brief plugin description",
     "author": {
       "name": "Your Name",
       "email": "your.email@example.com"
     },
     "license": "MIT"
   }
   EOF
   ```

   **Important:** This plugin.json should contain ONLY basic metadata (name, version, description, author, license). Do NOT include component specifications like `skills`, `commands`, `agents`, etc. here - those belong in the marketplace.json to avoid manifest conflicts.

3. **Create component directories** - Only create directories for components you'll include:
   ```bash
   mkdir -p commands    # If including commands
   mkdir -p agents      # If including agents
   mkdir -p skills      # If including Skills
   mkdir -p hooks       # If including hooks
   mkdir -p scripts     # If including helper scripts
   ```

4. **Add documentation** - Create README.md explaining the plugin:
   ```bash
   cat > README.md << 'EOF'
   # My Plugin

   Brief description of what this plugin does.

   ## Components

   - Commands: List commands provided
   - Agents: List agents provided
   - Skills: List Skills provided
   - Hooks: Describe automation provided

   ## Installation

   ```
   /plugin marketplace add owner/repo
   /plugin install my-plugin@marketplace-name
   ```
   EOF
   ```

### Step 4: Implementing Plugin Components

When implementing the plugin, create components using their respective creation processes:

#### For Commands

Use the `claude-code-slash-commands` skill and creation script:

```bash
# From plugin root
./path/to/scripts/create_slash_command.sh command-name --plugin
```

Or activate `claude-code-slash-commands` skill for guidance.

#### For Agents

Use the `claude-code-subagents` skill and creation script:

```bash
# From plugin root
./path/to/scripts/create_subagent.sh agent-name --plugin
```

Or activate `claude-code-subagents` skill for guidance.

#### For Skills

Use the `skill-creator` skill and follow the Agent Skills specification:

```bash
# From plugin root, create skill directory
mkdir -p skills/my-skill
```

Then activate `skill-creator` skill for full guidance on writing SKILL.md.

#### For Hooks

Use the `claude-code-hooks` skill for guidance. Create `hooks/hooks.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format.sh"
          }
        ]
      }
    ]
  }
}
```

#### For MCP Servers

Create `.mcp.json` at plugin root:

```json
{
  "mcpServers": {
    "plugin-server": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"]
    }
  }
}
```

**Writing Style:** Focus on how components work together. Ensure commands, agents, and Skills reference each other appropriately. Use `${CLAUDE_PLUGIN_ROOT}` for all plugin-relative paths.

### Step 5: Setting Up Distribution

Once the plugin components are implemented, set up distribution:

#### Option A: Local Testing Marketplace

For development and testing:

1. **Create marketplace directory** - Parallel to plugin:
   ```bash
   cd ..
   mkdir -p dev-marketplace/.claude-plugin
   ```

2. **Create marketplace manifest**:
   ```bash
   cat > dev-marketplace/.claude-plugin/marketplace.json << 'EOF'
   {
     "name": "dev-marketplace",
     "owner": {
       "name": "Developer"
     },
     "plugins": [
       {
         "name": "my-plugin",
         "source": "./my-plugin",
         "description": "Plugin under development",
         "version": "1.0.0",
         "strict": true,
         "skills": [
           "./skills/my-skill"
         ]
       }
     ]
   }
   EOF
   ```

   **Note:** Always set `"strict": true` and specify components (skills, commands, agents, etc.) in the marketplace.json, not in the individual plugin.json files.

3. **Test installation**:
   ```bash
   claude
   # In Claude Code:
   /plugin marketplace add ./dev-marketplace
   /plugin install my-plugin@dev-marketplace
   ```

#### Option B: GitHub Marketplace

For team or community distribution:

1. **Create repository** - Create GitHub repository for plugins
2. **Organize structure**:
   ```
   my-plugins-repo/
   ├── .claude-plugin/
   │   └── marketplace.json
   └── plugins/
       ├── plugin-one/
       └── plugin-two/
   ```

3. **Create marketplace manifest**:
   ```json
   {
     "name": "my-marketplace",
     "owner": {
       "name": "Team Name",
       "email": "team@example.com"
     },
     "plugins": [
       {
         "name": "plugin-one",
         "source": "./plugins/plugin-one",
         "description": "First plugin description",
         "version": "1.0.0",
         "author": {
           "name": "Team Name"
         },
         "license": "MIT",
         "strict": true,
         "skills": [
           "./skills/my-skill"
         ]
       },
       {
         "name": "plugin-two",
         "source": "./plugins/plugin-two",
         "description": "Second plugin description",
         "version": "1.0.0",
         "author": {
           "name": "Team Name"
         },
         "license": "MIT",
         "strict": true,
         "commands": [
           "./commands/my-command.md"
         ]
       }
     ]
   }
   ```

   **Important:** Set `"strict": true` in each plugin entry. This tells Claude Code to use component specifications from the marketplace.json and ignore any component specs in individual plugin.json files, avoiding manifest conflicts.

4. **Distribute**:
   ```
   /plugin marketplace add owner/repo
   /plugin install plugin-one@my-marketplace
   ```

For complete marketplace setup, see [references/plugin-marketplaces-guide.md](references/plugin-marketplaces-guide.md).

### Step 6: Configuring Team Installation

For automatic team-wide plugin installation, configure project-level settings:

1. **Create or edit** `.claude/settings.json` in project repository:
   ```json
   {
     "extraKnownMarketplaces": {
       "team-tools": {
         "source": {
           "source": "github",
           "repo": "company/claude-plugins"
         }
       }
     },
     "enabledPlugins": {
       "deployment-tools@team-tools": true,
       "code-quality@team-tools": true
     }
   }
   ```

2. **Commit to repository** - Team members who trust the folder will automatically:
   - Add configured marketplaces
   - Install enabled plugins
   - Receive plugin updates

3. **Document for team** - Add installation instructions to project README.

### Step 7: Testing and Iteration

Once the plugin is distributed, test thoroughly:

#### Test Component Integration

- **Test commands**: Run each command and verify it works
- **Test agents**: Invoke agents automatically and explicitly
- **Test Skills**: Trigger Skills and verify they're invoked correctly
- **Test hooks**: Trigger events and verify hooks execute
- **Test MCP servers**: Verify external tools are accessible

#### Test Component Interaction

- Verify commands can reference agents (e.g., "Use the X agent to deploy")
- Verify Skills can recommend commands to users
- Verify hooks work with plugin scripts using `${CLAUDE_PLUGIN_ROOT}`
- Verify agents have appropriate tool access

#### Test Distribution

- Install from marketplace on clean Claude Code instance
- Verify all components are loaded correctly
- Test on different operating systems if applicable
- Verify team installation works for project-level configuration

**Iteration workflow:**

1. **Use the plugin** on real tasks with real users
2. **Notice issues** - Missing components? Integration problems? Unclear usage?
3. **Identify improvements** - Should components be added/removed? Better organization?
4. **Update plugin** - Modify components, bump version
5. **Test changes** - Uninstall and reinstall to verify updates work
6. **Document changes** - Update CHANGELOG.md and README.md

## Plugin vs Individual Component Decision Tree

Use this decision tree to determine the right approach:

**Question 1: Are you creating multiple related components?**
- Yes → Continue to Question 2
- No → Create individual component in `.claude/` or `~/.claude/`

**Question 2: Will these components be shared across projects or with others?**
- Yes → Create plugin
- No → Create individual components in project `.claude/` directory

**Question 3: Do you need to include Skills?**
- Yes → Create plugin (Skills require plugin distribution)
- No → Continue to Question 4

**Question 4: Do you need version control and updates for components as a unit?**
- Yes → Create plugin
- No → Create individual components

## Common Plugin Patterns

### Code Quality Plugin

**Components:**
- Commands: `/format`, `/lint`, `/review`
- Agent: `code-reviewer`
- Hooks: PostToolUse formatting
- Skills: `code-quality-checker`

**Use case:** Enforce code standards across team projects

### Deployment Plugin

**Components:**
- Commands: `/deploy`, `/rollback`, `/status`
- Agent: `deployment-manager`
- Hooks: PreToolUse deployment validation
- MCP: Deployment API integration

**Use case:** Streamline deployment workflows

### Documentation Plugin

**Components:**
- Commands: `/docs`, `/api-docs`, `/changelog`
- Agent: `documentation-writer`
- Skills: `doc-generator`

**Use case:** Automate documentation generation

### Testing Plugin

**Components:**
- Commands: `/test`, `/coverage`, `/benchmark`
- Agent: `test-runner`
- Hooks: PreToolUse test validation
- Skills: `test-analyzer`

**Use case:** Comprehensive testing workflows

## Reference Documentation

For detailed information, refer to:

- [references/plugins-guide.md](references/plugins-guide.md) - Complete plugin guide from docs
- [references/plugin-marketplaces-guide.md](references/plugin-marketplaces-guide.md) - Marketplace creation and distribution
- [references/plugins-reference.md](references/plugins-reference.md) - Technical specifications and schemas

Load these references when users need detailed technical information beyond the workflow guidance in this skill.

## Best Practices

### Plugin Design

- **Single responsibility** - Each plugin should have a clear, focused purpose
- **Component cohesion** - Bundle components that work together, not unrelated tools
- **Clear naming** - Use descriptive kebab-case names that indicate purpose
- **Complete documentation** - Include README.md with installation and usage instructions
- **Semantic versioning** - Use semver for version management

### Component Organization

- **Logical grouping** - Organize related commands/agents/Skills together
- **Consistent naming** - Use consistent naming patterns across components
- **Clear references** - Have components reference each other (e.g., Skills mention commands)
- **Appropriate tool access** - Grant agents only necessary tools

### Distribution Strategy

- **Local testing first** - Test with local marketplace before GitHub distribution
- **Version control** - Commit plugin to git repository
- **Changelog maintenance** - Document changes in CHANGELOG.md
- **License clarity** - Include LICENSE file and license field in plugin.json
- **Community engagement** - For public plugins, provide issue tracking and contribution guidelines

### Team Adoption

- **Project-level config** - Use `.claude/settings.json` for automatic installation
- **Documentation** - Provide clear setup instructions for team members
- **Training** - Help team members discover and use plugin features
- **Feedback loops** - Gather team feedback and iterate

## Troubleshooting

### Plugin Not Loading

**Symptoms:** Plugin installed but components not available

**Solutions:**
- Verify `.claude-plugin/plugin.json` exists and has valid JSON
- Ensure component directories are at plugin root, not inside `.claude-plugin/`
- Check that plugin is enabled: `/plugin` → Manage Plugins
- Try uninstall and reinstall: `/plugin uninstall` then `/plugin install`

### Components Not Found

**Symptoms:** Plugin loads but specific components missing

**Solutions:**
- Verify component files exist in correct directories (`commands/`, `agents/`, etc.)
- Check component file format (markdown for commands/agents, JSON for hooks)
- For commands: Verify frontmatter and markdown structure
- For agents: Verify frontmatter exists
- For Skills: Verify SKILL.md exists with proper frontmatter

### Hooks Not Executing

**Symptoms:** Hooks configured but not firing

**Solutions:**
- Verify `hooks/hooks.json` has valid JSON syntax
- Check hook scripts are executable: `chmod +x script.sh`
- Use `${CLAUDE_PLUGIN_ROOT}` for plugin-relative paths
- Test hook script independently with sample input
- Run `claude --debug` to see hook execution details

### MCP Servers Not Starting

**Symptoms:** MCP servers configured but not accessible

**Solutions:**
- Verify `.mcp.json` has valid JSON syntax
- Check MCP server command is accessible
- Use `${CLAUDE_PLUGIN_ROOT}` for plugin-relative paths
- Test MCP server independently
- Check environment variables are set correctly

## Integration with Other Skills

This skill works alongside other claude-code-meta skills:

- **Use `claude-code-slash-commands`** - For creating individual commands within plugins
- **Use `claude-code-subagents`** - For creating individual agents within plugins
- **Use `claude-code-hooks`** - For creating hook configurations within plugins
- **Use `skill-creator`** - For creating Skills within plugins

Activate these skills when deep-diving into specific component creation while building plugins.
