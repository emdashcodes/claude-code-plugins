# emdashcodes/claude-code-plugins

Claude Code plugins featuring specialized agents, commands, and development skills.

## claude-code-meta

Complete toolkit for building and distributing Claude Code plugins, skills, hooks, subagents, slash commands, marketplaces, and setting up MCP servers.

**What's included:**

- **claude-code-hooks skill** - Event-driven hook creation
- **claude-code-slash-commands skill** - Custom slash command creation and configuration
- **claude-code-subagents skill** - Specialized subagent creation and management
- **claude-code-plugins skill** - Plugin packaging and marketplace distribution
- **claude-code-mcp skill** - MCP server configuration and management
- **claude-code-skills skill** - Agent Skills creation and workflow design

**Use cases:**

- Building custom slash commands for repeated workflows
- Creating specialized subagents for specific tasks
- Setting up event-driven hooks for automation
- Configuring MCP servers to integrate external tools
- Packaging and distributing plugins via marketplaces
- Developing Agent Skills with bundled resources
- Managing team-wide plugin configurations

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

## google-docs-reader

Read and analyze Google Docs, Sheets, and Slides by exporting them to local formats (DOCX, XLSX, PPTX) via browser download.

**What's included:**

- **google-docs-reader skill** - Complete Google Workspace document export and analysis workflow

**Use cases:**

- Reading and summarizing Google Docs
- Analyzing data from Google Sheets
- Extracting content from Google Slides
- Processing Google Drive File Stream documents (.gdoc, .gsheet, .gslides files)
- Converting Google Workspace documents to local formats

**Requirements:**

- Google account with access to documents
- Browser with active Google session
- Downloads folder accessible at `~/Downloads`

```bash
# Install Google Docs reader
/plugin install google-docs-reader@emdashcodes-claude-code-plugins
```

## quill-export

Extract meeting recordings and transcripts from the Quill macOS app database with AI summary and cross-linking.

**What's included:**

- **quill-export skill** - Complete Quill meeting export workflow with speaker identification and AI summaries

**Use cases:**

- Extracting transcripts from Quill meetings
- Generating formatted markdown meeting notes
- Searching for meetings by name or ID
- Getting speaker-identified transcripts
- Exporting meeting metadata and AI summaries

**Requirements:**

- macOS with Quill app installed
- Access to Quill database at `~/Library/Application Support/Quill/quill.db`

```bash
# Install Quill export
/plugin install quill-export@emdashcodes-claude-code-plugins
```

## Install the Marketplace

Add this marketplace to Claude Code:

```bash
/plugin marketplace add emdashcodes/claude-code-plugins
```

This makes all plugins available for installation.

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
