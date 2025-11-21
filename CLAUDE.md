# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is **emdashcodes-claude-code-plugins** - Em's personal Claude Code plugin marketplace featuring specialized plugins for development workflows, productivity, and AI-powered tools.

## Architecture

### Plugin Structure

```text
emdashcodes/
├── .claude-plugin/
│   └── marketplace.json          # Plugin registry
├── plugins/
│   └── plugin-name/
│       ├── CHANGELOG.md           # Version history
│       ├── commands/              # Slash commands (optional)
│       │   └── command.md
│       ├── skills/                # Skills with SKILL.md files (optional)
│       │   └── skill-name/
│       │       └── SKILL.md
│       └── scripts/               # Helper scripts (optional)
└── CLAUDE.md                      # This file
```

### Skills Specification

All skills must have a `SKILL.md` file with YAML frontmatter:

- **Required frontmatter fields**:
  - `name` - hyphen-case, lowercase alphanumeric + hyphens
  - `description` - when Claude should use this skill
- **Optional frontmatter fields**:
  - `license`
  - `metadata` - custom key-value pairs
- **Body**: Markdown instructions, examples, and guidelines

## Using This Marketplace

### Adding to Claude Code

```bash
/plugin marketplace add emdashcodes/claude-code-plugins
```

### Installing Plugins

```bash
# Browse available plugins
/plugin

# Install specific plugin
/plugin install <plugin-name>@emdashcodes-claude-code-plugins
```

## Creating New Plugins

1. **Create plugin directory** under `plugins/`:

   ```bash
   mkdir -p plugins/my-plugin/{skills,commands,scripts}
   ```

2. **Add CHANGELOG.md**:

   ```markdown
   # Changelog

   ## [1.0.0] - YYYY-MM-DD

   ### Added
   - Initial release
   ```

3. **Create skills/commands** as needed

4. **Register in marketplace.json**:

   ```json
   {
     "name": "my-plugin",
     "source": "./plugins/my-plugin",
     "description": "Plugin description",
     "version": "1.0.0",
     "author": { "name": "Em" },
     "repository": "https://github.com/emdashcodes/claude-code-plugins",
     "license": "MIT",
     "keywords": ["keyword1", "keyword2"],
     "category": "productivity",
     "strict": true,
     "skills": ["./skills/my-skill"],
     "commands": ["./commands/my-command.md"]
   }
   ```

## Versioning & Releases

### Plugin-Prefixed Tags

Since this repository contains multiple plugins with independent version cycles, use **plugin-prefixed tags**:

**Tag Format:** `<plugin-name>/v<semver>`

**Examples:**
- `nano-banana-image-editor/v1.0.1`
- `google-calendar/v1.0.0`

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

**5. Create GitHub Release**

```bash
gh release create <plugin-name>/vX.Y.Z \
  --title "<plugin-name> vX.Y.Z" \
  --notes "## Fixed

- Bug fix description

## Added

- New feature description"
```

Copy the relevant sections from CHANGELOG.md for the release notes.

### Why Plugin-Prefixed Tags?

1. **Clarity** - Unambiguous which plugin a tag refers to
2. **Independence** - Each plugin can have its own release cycle
3. **Scalability** - Add more plugins without version conflicts
4. **Standard Practice** - Common pattern for monorepos

### Upgrade Commands

Plugins can implement upgrade commands that automatically detect and install plugin-specific tagged releases.

Upgrade commands should:
- Look for plugin-prefixed tags: `git tag -l '<plugin-name>/v*'`
- Checkout the specific tag: `git checkout <plugin-name>/v<version>`
- Rebuild the plugin after checkout
- Prompt user to restart Claude Code

## License

MIT License - See LICENSE file for details.
