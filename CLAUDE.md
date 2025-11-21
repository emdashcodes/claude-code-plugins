# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **working directory** containing three separate Claude Code plugin marketplace repositories:

- **anthropics-skills/** - Official Anthropic example skills demonstrating creative, technical, and enterprise capabilities
- **automattic/** - Automattic's internal Claude Code plugins for workflow orchestration
- **emdashcodes/** - Em's personal Claude Code plugins for development workflows

Each subdirectory is its own independent git repository with its own `.claude-plugin/marketplace.json` configuration and plugin structure.

## Architecture

### Plugin Marketplace Structure

Each marketplace follows the Claude Code plugin specification:

```text
marketplace-root/
├── .claude-plugin/
│   └── marketplace.json          # Plugin registry
├── plugins/                       # (automattic, emdashcodes only)
│   └── plugin-name/
│       ├── agents/                # Specialized agents (optional)
│       ├── commands/              # Slash commands (optional)
│       └── skills/                # Skills with SKILL.md files (optional)
└── skill-name/                    # (anthropics-skills only)
    └── SKILL.md                   # Skill entrypoint
```

### Skills Specification

All skills must follow the Agent Skills Spec (`anthropics-skills/agent_skills_spec.md`):

- **Required file**: `SKILL.md` with YAML frontmatter
- **Required frontmatter fields**:
  - `name` - hyphen-case, lowercase alphanumeric + hyphens
  - `description` - when Claude should use this skill
- **Optional frontmatter fields**:
  - `license`
  - `allowed-tools` - pre-approved tools (Claude Code only)
  - `metadata` - custom key-value pairs
- **Body**: Markdown instructions, examples, and guidelines

## Working with Marketplaces

### Adding Marketplaces to Claude Code

```bash
# Anthropic's official skills
/plugin marketplace add anthropics/skills

# Automattic's plugins (private)
/plugin marketplace add git@github.a8c.com:Automattic/claude-code-plugins.git

# Em's personal plugins
/plugin marketplace add emdashcodes/claude-code-plugins
```

### Installing Plugins

```bash
# Browse available plugins
/plugin

# Install specific plugin
/plugin install <plugin-name>@<marketplace-name>

# Example
/plugin install meta-skills@anthropics-skills
```

### Marketplace Configuration

Each marketplace is defined in `.claude-plugin/marketplace.json`:

```json
{
  "name": "marketplace-name",
  "owner": { "name": "...", "email/url": "..." },
  "metadata": { "description": "...", "version": "..." },
  "plugins": [
    {
      "name": "plugin-name",
      "description": "...",
      "source": "./path/to/plugin",
      "strict": false,
      "skills": ["./skill-path"],
      "commands": ["./command-path.md"],
      "agents": ["./agent-path.md"]
    }
  ]
}
```

## Creating New Skills

1. **Choose the appropriate marketplace**:
   - `anthropics-skills/` - Skills demonstrating general Claude capabilities
   - `automattic/plugins/` - Automattic-specific workflows
   - `emdashcodes/plugins/` - Personal development tools

2. **Use the template**: Reference `anthropics-skills/template-skill/SKILL.md`

3. **Create skill directory**:

   ```text
   skill-name/
   ├── SKILL.md              # Required entrypoint
   ├── scripts/              # Optional helper scripts
   └── reference/            # Optional reference docs
   ```

4. **Write SKILL.md**:


   ```markdown
   ---
   name: my-skill-name
   description: Clear description of what this skill does and when to use it
   ---

   # Instructions here
   ```

5. **Register in marketplace.json**: Add the skill path to the appropriate plugin

## Git Workflow

**IMPORTANT**: Each subdirectory is a separate, independent git repository.

### Working in a Subdirectory

```bash
# Navigate to the subdirectory first
cd anthropics-skills  # or automattic/ or emdashcodes/

# Then use normal git commands
git status
git add .
git commit -m "type: short message"
git push
```

## Versioning & Releases

### Plugin-Prefixed Tags

Since each marketplace repository may contain multiple plugins with independent version cycles, use **plugin-prefixed tags** instead of generic version tags.

**Tag Format:** `<plugin-name>/v<semver>`

**Examples:**
- `context-a8c/v0.1.3` - ContextA8C plugin version 0.1.3
- `my-plugin/v1.2.0` - MyPlugin version 1.2.0

### Release Process

Follow these steps to release a new plugin version:

**1. Update CHANGELOG.md**

Add a new version section following [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Fixed
- Bug fixes

### Changed
- Changes to existing functionality
```

**2. Update marketplace.json**

Update the plugin's version in `.claude-plugin/marketplace.json`:

```json
{
  "name": "plugin-name",
  "version": "X.Y.Z",
  ...
}
```

**3. Commit Changes**

Use conventional commit format with version in message:

```bash
# Navigate to marketplace directory
cd automattic/  # or emdashcodes/

# Commit with semantic type prefix
git add -A
git commit -m "fix: description of changes vX.Y.Z"
# or
git commit -m "feat: description of changes vX.Y.Z"

# Push to repository
git push
```

**Commit Types:**
- `fix:` - Bug fixes (patch version bump)
- `feat:` - New features (minor version bump)
- `BREAKING CHANGE:` - Breaking changes (major version bump)
- `docs:`, `chore:`, `refactor:` - Other changes

**4. Create Plugin-Prefixed Tag**

```bash
# Create and push tag
git tag <plugin-name>/vX.Y.Z
git push --tags
```

**5. Create GitHub Release (Optional)**

```bash
gh release create <plugin-name>/vX.Y.Z \
  --title "<plugin-name> vX.Y.Z - Title" \
  --notes "Release notes from CHANGELOG.md"
```

### Why Plugin-Prefixed Tags?

1. **Clarity** - Unambiguous which plugin a tag refers to
2. **Independence** - Each plugin can have its own release cycle
3. **Scalability** - Add more plugins without version conflicts
4. **Standard Practice** - Common pattern for monorepos

### Upgrade Commands

Plugins can implement upgrade commands that automatically detect and install plugin-specific tagged releases:

```bash
# Example: ContextA8C upgrade command
/context-a8c:upgrade
```

Upgrade commands should:
- Look for plugin-prefixed tags: `git tag -l '<plugin-name>/v*'`
- Checkout the specific tag: `git checkout <plugin-name>/v<version>`
- Rebuild the plugin after checkout
- Prompt user to restart Claude Code

## Key Differences Between Marketplaces

### anthropics-skills

- Skills at root level (no `plugins/` directory)
- Open source (Apache 2.0)
- Example/reference implementations
- Includes document-skills (DOCX, PDF, PPTX, XLSX)

### automattic

- Plugin-based structure under `plugins/`
- GPLv2 license
- Private GitHub Enterprise repository
- Automattic-specific workflows

### emdashcodes

- Plugin-based structure under `plugins/`
- MIT license
- Personal development tools
- Experimental/work-in-progress status
