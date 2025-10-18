# emdashcodes/claude-code-plugins

> [!WARNING]
> For now this is just a place to try out Claude plugins for now, not much to see here yet.

## Quick Start

### Step 1: Add the Marketplace

Add this marketplace to Claude Code:

```bash
/plugin marketplace add emdashcodes/claude-code-plugins
```

This makes all plugins available for installation, but does not load any agents or tools into the Claude context.

### Step 2: Install Plugins

Browse available plugins:

```bash
/plugin
```

Install the plugins you need:

```bash
/plugin install <plugin>
```

Each installed plugin only loads its specific agents, commands, and skills into the Claude context.

## Repository Structure

```
claude-agents/
├── .claude-plugin/
│   └── marketplace.json          # all plugins
├── plugins/
│   ├── plugin-name/
│   │   ├── agents/               # Expert definitions
│   │   ├── commands/             # Scaffolding tool
│   │   └── skills/               # Specialized skills
│   └── ... (more plugins)
└── README.md                     # This file
```

## Contributing

To add new agents, skills, or commands:

1. Identify or create the appropriate plugin directory in `plugins/`
2. Create `.md` files in the appropriate subdirectory:
   - `agents/` - For specialized agents
   - `commands/` - For tools and workflows
   - `skills/` - For modular knowledge packages
3. Follow naming conventions (lowercase, hyphen-separated)
4. Write clear activation criteria and comprehensive content
5. Update the plugin definition in `.claude-plugin/marketplace.json`

## Resources

### Documentation

- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code/overview)
- [Plugins Guide](https://docs.claude.com/en/docs/claude-code/plugins)
- [Subagents Guide](https://docs.claude.com/en/docs/claude-code/sub-agents)
- [Agent Skills Guide](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- [Slash Commands Reference](https://docs.claude.com/en/docs/claude-code/slash-commands)

## License

MIT License - see [LICENSE](LICENSE) file for details.
