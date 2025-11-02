# Plugins

Extend Claude Code with custom commands, agents, hooks, Skills, and MCP servers through the plugin system.

> **Tip:** For complete technical specifications and schemas, see [Plugins reference](https://docs.claude.com/en/docs/claude-code/plugins-reference). For marketplace management, see [Plugin marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces).

Plugins let you extend Claude Code with custom functionality that can be shared across projects and teams. Install plugins from [marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces) to add pre-built commands, agents, hooks, Skills, and MCP servers, or create your own to automate your workflows.

---

## Quickstart

Let's create a simple greeting plugin to get you familiar with the plugin system. We'll build a working plugin that adds a custom command, test it locally, and understand the core concepts.

### Prerequisites

- Claude Code installed on your machine
- Basic familiarity with command-line tools

### Create your first plugin

1. **Create the marketplace structure**
   ```
   mkdir test-marketplace
   cd test-marketplace
   ```
2. **Create the plugin directory**
   ```
   mkdir my-first-plugin
   cd my-first-plugin
   ```
3. **Create the plugin manifest**
   Create `.claude-plugin/plugin.json`
   ```
   mkdir .claude-plugin
   cat > .claude-plugin/plugin.json << 'EOF'
   {
     "name": "my-first-plugin",
     "description": "A simple greeting plugin to learn the basics",
     "version": "1.0.0",
     "author": {
       "name": "Your Name"
     }
   }
   EOF
   ```
4. **Add a custom command**
   Create `commands/hello.md`
   ```
   mkdir commands
   cat > commands/hello.md << 'EOF'
   ---
   description: Greet the user with a personalized message
   ---
   # Hello Command
   Greet the user warmly and ask how you can help them today. Make the greeting personal and encouraging.
   EOF
   ```
5. **Create the marketplace manifest**
   Create `marketplace.json`
   ```
   cd ..
   mkdir .claude-plugin
   cat > .claude-plugin/marketplace.json << 'EOF'
   {
     "name": "test-marketplace",
     "owner": {
       "name": "Test User"
     },
     "plugins": [
       {
         "name": "my-first-plugin",
         "source": "./my-first-plugin",
         "description": "My first test plugin"
       }
     ]
   }
   EOF
   ```
6. **Install and test your plugin**

   - Start Claude Code from parent directory:
     ```
     cd ..
     claude
     ```
   - Add the test marketplace:
     ```
     /plugin marketplace add ./test-marketplace
     ```
   - Install your plugin:
     ```
     /plugin install my-first-plugin@test-marketplace
     ```
   - Select "Install now". Restart Claude Code to use the new plugin.
   - Try your new command:
     ```
     /hello
     ```
   - You'll see Claude use your greeting command! Check `/help` to see your new command listed.

**Key components:**

- **Plugin manifest** (`.claude-plugin/plugin.json`) - Describes your plugin's metadata
- **Commands directory** (`commands/`) - Contains your custom slash commands
- **Test marketplace** - Allows you to test your plugin locally

---

### Plugin structure overview

Your plugin follows this basic structure:

```
my-first-plugin/
├── .claude-plugin/
│   └── plugin.json # Plugin metadata
├── commands/ # Custom slash commands (optional)
│   └── hello.md
├── agents/ # Custom agents (optional)
│   └── helper.md
├── skills/ # Agent Skills (optional)
│   └── my-skill/
│       └── SKILL.md
└── hooks/ # Event handlers (optional)
    └── hooks.json
```

**Additional components you can add:**

- **Commands:** Create markdown files in `commands/` directory
- **Agents:** Create agent definitions in `agents/` directory
- **Skills:** Create `SKILL.md` files in `skills/` directory
- **Hooks:** Create `hooks/hooks.json` for event handling
- **MCP servers:** Create `.mcp.json` for external tool integration

> **Next steps:** Ready to add more features? Jump to [Develop more complex plugins](https://docs.claude.com/en/docs/claude-code/plugins#develop-more-complex-plugins) to add agents, hooks, and MCP servers. For full specifications, see [Plugins reference](https://docs.claude.com/en/docs/claude-code/plugins-reference).

---

## Install and manage plugins

Learn how to discover, install, and manage plugins to extend Claude Code capabilities.

### Prerequisites

- Claude Code installed and running
- Basic familiarity with command-line interfaces

### Add marketplaces

Marketplaces are catalogs of available plugins. Add them to discover and install plugins:

- **Add a marketplace**
  ```
  /plugin marketplace add your-org/claude-plugins
  ```
- **Browse available plugins**
  ```
  /plugin
  ```
For more details, see [Plugin marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces).

### Install plugins

#### Via interactive menu (recommended for discovery)

- Open plugin management interface:
  ```
  /plugin
  ```
- Select "Browse Plugins" to see options with descriptions, features, and installation.

#### Via direct commands (for quick installation)

- Install a specific plugin:
  ```
  /plugin install formatter@your-org
  ```
- Enable a disabled plugin:
  ```
  /plugin enable plugin-name@marketplace-name
  ```
- Disable without uninstalling:
  ```
  /plugin disable plugin-name@marketplace-name
  ```
- Completely remove a plugin:
  ```
  /plugin uninstall plugin-name@marketplace-name
  ```

### Verify installation

After installing a plugin:

1. **Check available commands:** Run `/help` to see new commands.
2. **Test plugin features:** Try the plugin's commands and features.
3. **Review plugin details:** Use `/plugin` → "Manage Plugins" to see what the plugin provides.

---

## Set up team plugin workflows

Configure plugins at the repository level for consistent tooling across your team. When team members trust your repository folder, Claude Code installs specified marketplaces and plugins automatically.

**To set up team plugins:**

1. Add marketplace and plugin configuration to your repository's `.claude/settings.json`
2. Team members trust the repository folder
3. Plugins install automatically for all team members

For full instructions and examples, see [Configure team marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces#how-to-configure-team-marketplaces).

---

## Develop more complex plugins

Once you're comfortable with basic plugins, you can create more sophisticated extensions.

### Add Skills to your plugin

Plugins can include [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) to extend Claude's capabilities. Skills are model-invoked—Claude autonomously uses them based on the task context.

To add Skills to your plugin, create a `skills/` directory at your plugin root and add Skill folders with `SKILL.md` files. Plugin Skills are automatically available when the plugin is installed.

See [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) for full guidance.

### Organize complex plugins

For plugins with many components, organize your directory structure by functionality. See [Plugin directory structure](https://docs.claude.com/en/docs/claude-code/plugins-reference#plugin-directory-structure) for layout patterns.

### Test your plugins locally

When developing plugins, use a local marketplace to test changes iteratively.

1. **Set up your development structure**
   - Organize your plugin and marketplace for testing:
     ```
     mkdir dev-marketplace
     cd dev-marketplace
     mkdir my-plugin
     ```
   - This creates:
     ```
     dev-marketplace/
     ├── .claude-plugin/marketplace.json (you'll create this)
     └── my-plugin/ (your plugin under development)
         ├── .claude-plugin/plugin.json
         ├── commands/
         ├── agents/
         └── hooks/
     ```
2. **Create the marketplace manifest**
   ```
   mkdir .claude-plugin
   cat > .claude-plugin/marketplace.json << 'EOF'
   {
     "name": "dev-marketplace",
     "owner": { "name": "Developer" },
     "plugins": [
       {
         "name": "my-plugin",
         "source": "./my-plugin",
         "description": "Plugin under development"
       }
     ]
   }
   EOF
   ```
3. **Install and test**
   - Start Claude Code from parent directory:
     ```
     cd ..
     claude
     ```
   - Add your development marketplace:
     ```
     /plugin marketplace add ./dev-marketplace
     ```
   - Install your plugin:
     ```
     /plugin install my-plugin@dev-marketplace
     ```
   - Test:
     - Try your commands with `/command-name`
     - Check that agents appear in `/agents`
     - Verify hooks work as expected

4. **Iterate on your plugin**
   - After code changes:
     ```
     /plugin uninstall my-plugin@dev-marketplace
     /plugin install my-plugin@dev-marketplace
     ```
   - Repeat as needed.

> **For multiple plugins:** Organize them in subdirectories like `./plugins/plugin-name` and update your `marketplace.json`. See [Plugin sources](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces#plugin-sources).

### Debug plugin issues

If your plugin isn't working as expected:

1. **Check the structure:** Ensure directories are at plugin root
2. **Test components individually:** Check each command, agent, and hook separately
3. **Use validation and debugging tools:** See [Debugging and development tools](https://docs.claude.com/en/docs/claude-code/plugins-reference#debugging-and-development-tools)

### Share your plugins

When ready to share:

1. Add documentation (`README.md` with instructions)
2. Use semantic versioning in `plugin.json`
3. Create or use a marketplace
4. Test with others before wider distribution

See [Plugins reference](https://docs.claude.com/en/docs/claude-code/plugins-reference) for details.

---

## Next steps

Now that you understand Claude Code's plugin system, here are suggested paths:

### For plugin users

- **Discover plugins**: Browse community marketplaces
- **Team adoption**: Set up repository-level plugins
- **Marketplace management**: Manage multiple sources
- **Advanced usage**: Explore plugin combinations

### For plugin developers

- **Create your first marketplace:** [Plugin marketplaces guide](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces)
- **Advanced components:** Dive deeper:
  - [Slash commands](https://docs.claude.com/en/docs/claude-code/slash-commands)
  - [Subagents](https://docs.claude.com/en/docs/claude-code/sub-agents)
  - [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills)
  - [Hooks](https://docs.claude.com/en/docs/claude-code/hooks)
  - [MCP](https://docs.claude.com/en/docs/claude-code/mcp)
- **Distribution strategies:** Package and share
- **Community contribution:** Contribute to collections

### For team leads and administrators

- **Repository configuration:** Automatic plugin installation
- **Plugin governance:** Guidelines for approval/review
- **Marketplace maintenance:** Organization catalogs
- **Training and documentation:** Team adoption

---

## See also

- [Plugin marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces) - Creating/managing catalogs
- [Slash commands](https://docs.claude.com/en/docs/claude-code/slash-commands) - Custom commands
- [Subagents](https://docs.claude.com/en/docs/claude-code/sub-agents) - Specialized agents
- [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) - Extend capabilities
- [Hooks](https://docs.claude.com/en/docs/claude-code/hooks) - Automate workflows
- [MCP](https://docs.claude.com/en/docs/claude-code/mcp) - Connect external tools/services
- [Settings](https://docs.claude.com/en/docs/claude-code/settings) - Plugin configuration options
