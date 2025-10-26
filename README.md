# emdashcodes/claude-code-plugins

Claude Code plugins featuring specialized agents, commands, and development skills.

## claude-code-meta

Toolkit for building and configuring Claude Code plugins, skills, hooks, and automation workflows.

**What's included:**

- **claude-code-hooks skill** - Guide for creating event-driven automation and validation workflows for Claude Code

**Use cases:**

- Setting up pre-commit validation hooks
- Automating code formatting and linting
- Enriching context with git status or environment info
- Blocking dangerous operations before execution
- Integrating external tools and APIs
- Controlling workflow decisions and permissions

```bash
# Install Claude Code hooks toolkit
/plugin install claude-code-meta@emdashcodes-claude-code-plugins
```

## mermaid-diagram-to-image

Convert Mermaid diagrams to high-quality images (PNG, SVG, PDF) using mermaid-cli.

**What's included:**

- **mermaid-diagram-to-image skill** - Complete diagram conversion workflow
- **convert command** - Quick conversion slash command

**Use cases:**

- Converting Mermaid syntax to visual diagrams
- Generating documentation images
- Creating presentation-ready flowcharts
- Exporting architecture diagrams for sharing
- Building visual representations of system designs

```bash
# Install Mermaid diagram converter
/plugin install mermaid-diagram-to-image@emdashcodes-claude-code-plugins
```

## ada-memory

Intelligent memory system that automatically extracts and injects relevant context from your conversation history using semantic search and vector embeddings.

**What's included:**

- **UserPromptSubmit hook** - Searches and injects relevant memories before each message
- **SessionEnd hook** - Cleans up session cache when conversation ends
- **Extraction threshold** - Automatically extracts memories every 5 messages
- **SQLite storage** - Persistent local storage with vector embeddings

**How it works:**

- Monitors your conversations and extracts factual information using mem0 AI
- Stores memories with semantic embeddings for intelligent retrieval
- Automatically injects relevant context when you ask related questions
- Session-based deduplication prevents showing the same memory twice
- All data stored locally in `~/.claude/mem0/`

**Use cases:**

- Remembering project details across conversations
- Maintaining context about your preferences and workflows
- Recalling technical decisions and rationale
- Building persistent knowledge from past interactions

```bash
# Install Ada Memory system
/plugin install ada-memory@emdashcodes-claude-code-plugins

# Post-installation: Install dependencies
cd ~/.claude/plugins/marketplaces/emdashcodes-claude-code-plugins/plugins/ada-memory
./install.sh
```

**Note:** Requires OpenAI API key. See plugin README for configuration details.

## Install the Marketplace

Add this marketplace to Claude Code:

```bash
/plugin marketplace add emdashcodes/claude-code-plugins
```

This makes all plugins available for installation.

## Repository Structure

```
emdashcodes/
├── .claude-plugin/
│   └── marketplace.json          # Plugin registry
├── plugins/
│   ├── claude-code-meta/
│   │   └── skills/
│   │       └── claude-code-hooks/
│   │           ├── SKILL.md      # Main skill entrypoint
│   │           └── references/   # Hook event docs, patterns, best practices
│   └── mermaid-diagram-to-image/
│       ├── commands/
│       │   └── convert.md        # /convert slash command
│       └── skills/
│           └── mermaid-diagram-to-image/
│               └── SKILL.md      # Main skill entrypoint
└── README.md                     # This file
```

## Contributing

To add new agents, skills, or commands:

1. Identify or create the appropriate plugin directory in `plugins/`
2. Create `.md` files in the appropriate subdirectory:
   - `agents/` - For specialized agents
   - `commands/` - For slash commands and tools
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
- [MCP Protocol](https://modelcontextprotocol.io)

## License

MIT License - see [LICENSE](LICENSE) file for details.
