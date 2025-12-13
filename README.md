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

## nano-banana-image-editor

Create and edit images with natural language using Gemini 3 Pro Image.

**What's included:**

- **nano-banana-image-editor skill** - Complete image creation and editing workflow

**Use cases:**

- Image generation (photos, illustrations, icons, infographics)
- Photo editing (remove objects, change backgrounds, style transfer)
- Text rendering (menus, posters, signs, labels)
- Google Search grounding for factual infographics (weather, sports, real-time data)
- Quick crops and basic edits with PIL/Pillow
- High-resolution output (1K, 2K, 4K) with custom aspect ratios

**Requirements:**

- Google Gemini API key
- Python 3.10+ with google-genai and Pillow packages

```bash
# Install Nano Banana image editor
/plugin install nano-banana-image-editor@emdashcodes-claude-code-plugins
```

## google-calendar

Full read-write Google Calendar access with automatic event management and quick slash commands.

**What's included:**

- **google-calendar skill** - Complete calendar management workflow
- **setup command** - Interactive OAuth setup wizard

**Use cases:**

- Creating, updating, and deleting calendar events
- Searching for events and finding free time
- Managing multiple calendars
- Scheduling meetings and appointments
- Viewing upcoming events and agendas

**Requirements:**

- Google Cloud project with Calendar API enabled
- OAuth 2.0 credentials
- Google account

```bash
# Install Google Calendar
/plugin install google-calendar@emdashcodes-claude-code-plugins

# Run setup wizard
/google-calendar:setup
```

## google-gmail

Full email management with Gmail API. Send, read, search, organize messages, manage drafts, labels, and attachments with multi-account support.

**What's included:**

- **google-gmail skill** - Complete email management workflow with profile-based authentication
- **setup command** - Interactive OAuth setup wizard for multiple accounts

**Use cases:**

- Reading and searching emails
- Sending messages with attachments
- Managing drafts and labels
- Organizing inbox with filters
- Multi-account email management
- Batch email operations

**Requirements:**

- Google Cloud project with Gmail API enabled
- OAuth 2.0 credentials
- Google account(s)

```bash
# Install Google Gmail
/plugin install google-gmail@emdashcodes-claude-code-plugins

# Run setup wizard
/google-gmail:setup
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
# Simplified test
