---
description: Upgrade the video-toolkit plugin to the latest version from the marketplace repository
tools: Bash, AskUserQuestion
---

# Video Toolkit Plugin Upgrade

You are running the video-toolkit upgrade command to update the plugin to the latest version.

## Your Task

Guide the user through upgrading the video-toolkit plugin by pulling the latest changes from the marketplace repository.

## Workflow

### Step 1: Verify Current Installation

Check the current version and installation location:

```bash
# Get marketplace directory
MARKETPLACE_DIR=$(dirname $(dirname ${CLAUDE_PLUGIN_ROOT}))

# Get current version from marketplace.json
CURRENT_VERSION=$(jq -r '.plugins[] | select(.name=="video-toolkit") | .version' "$MARKETPLACE_DIR/.claude-plugin/marketplace.json")

# Verify git repository
cd "$MARKETPLACE_DIR" && git rev-parse --git-dir >/dev/null 2>&1 && echo "✓ Git repository found" || echo "✗ Not a git repository"
```

**Output to user:**

```
Current version: [version]
Marketplace directory: [path]
```

### Step 2: Check for Updates

Fetch the latest tags and check for updates:

```bash
cd "$MARKETPLACE_DIR"
git fetch --tags origin
```

Then get the version information:

```bash
# Get the latest version tag for this plugin
LATEST_TAG=$(git tag -l 'video-toolkit/v*' --sort=-v:refname | head -n 1)

# Get current tag (if on a tag)
CURRENT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "none")

# Filter to only video-toolkit tags if we're on a tag
if [ "$CURRENT_TAG" != "none" ]; then
  echo "$CURRENT_TAG" | grep -q '^video-toolkit/' || CURRENT_TAG="none"
fi

echo "Latest tag: $LATEST_TAG"
echo "Current tag: $CURRENT_TAG"
```

**Analyze the output:**

- If `LATEST_TAG` is empty → No tagged releases available yet
- If `CURRENT_TAG` equals `LATEST_TAG` → Already on latest version
- If `LATEST_TAG` is newer → Continue to Step 3
- If git fetch fails → Inform user there's a connection issue

**Output to user:**

```
Current version: [CURRENT_VERSION] (tag: [CURRENT_TAG or "not on a tagged release"])
Latest available: [LATEST_TAG]
```

### Step 3: Show Release Notes

If updates are available, show what's changed by reading the CHANGELOG:

```bash
cd "$MARKETPLACE_DIR" && git show "$LATEST_TAG:plugins/video-toolkit/CHANGELOG.md" | head -50
```

**Present the release notes** to the user, focusing on the latest version's changes.

### Step 4: Confirm Upgrade

Use the **AskUserQuestion** tool to ask:

- **Question**: "Ready to upgrade video-toolkit to the latest version?"
- **Options**:
  - "Yes, upgrade now" (description: "Pull latest changes from the repository")
  - "No, not now" (description: "Keep current version")

If user selects "No, not now":

- Output: "Upgrade cancelled. Your current version remains unchanged."
- Exit the command

### Step 5: Perform Upgrade

If user confirms, checkout the latest tagged release:

```bash
cd "$MARKETPLACE_DIR" && git checkout "$LATEST_TAG"
```

**Check the exit code:**

- Exit code 0 → Success, continue to Step 6
- Exit code != 0 → Error occurred, show user the error message and stop

**Note:** This checks out the specific tagged release ensuring you get a stable, tested version.

### Step 6: Rebuild Plugin Dependencies

After pulling changes, reinstall Python dependencies:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/skills/video-toolkit && bash scripts/install_dependencies.sh
```

**Monitor for errors:**

- If successful → Continue to Step 7
- If errors occur → Show errors to user and explain that manual intervention may be needed

### Step 7: Verify New Version

Check the updated version:

```bash
NEW_VERSION=$(jq -r '.plugins[] | select(.name=="video-toolkit") | .version' "$MARKETPLACE_DIR/.claude-plugin/marketplace.json")
```

### Step 8: Success Message & Restart Prompt

**Output to user:**

```
✅ Video Toolkit upgraded successfully!

Previous version: [old version]
Current version: [new version]

⚠️  Important: You must restart Claude Code to apply the changes.

To restart:
1. Close this conversation
2. Restart Claude Code
3. Start a new session

After restarting, you can verify the upgrade by running:
/video-toolkit [test_video_file]
```

## Error Handling

### Git Repository Not Found

If the marketplace directory is not a git repository:

```
❌ Upgrade failed: video-toolkit marketplace is not a git repository.

This can happen if the plugin was installed differently. To upgrade manually:

1. Navigate to: [marketplace directory]
2. Run: git fetch --tags origin
3. List tags: git tag -l 'video-toolkit/v*' --sort=-v:refname
4. Checkout latest: git checkout <latest-version-tag>
5. Navigate to: [plugin directory]/skills/video-toolkit
6. Run: bash scripts/install_dependencies.sh
7. Restart Claude Code

If you continue to have issues, try reinstalling the plugin:
/plugin marketplace remove emdashcodes-claude-code-plugins
/plugin marketplace add emdashcodes/claude-code-plugins
/plugin install video-toolkit@emdashcodes-claude-code-plugins
```

### Network/Connection Errors

If git fetch/pull fails due to network issues:

```
❌ Upgrade failed: Unable to connect to repository.

Please check your network connection and GitHub access.

To upgrade manually:
cd [marketplace directory]
git fetch --tags origin
git tag -l 'video-toolkit/v*' --sort=-v:refname  # List versions
git checkout <latest-version-tag>
cd [plugin directory]/skills/video-toolkit
bash scripts/install_dependencies.sh

Then restart Claude Code.
```

### Build Errors

If dependency installation fails:

```
❌ Upgrade completed but dependency installation failed.

The latest code was pulled, but there were errors during dependency installation.
You may need to troubleshoot manually.

Error details:
[show error output]

To retry manually:
cd [plugin directory]/skills/video-toolkit
bash scripts/install_dependencies.sh

If issues persist, report at: https://github.com/emdashcodes/claude-code-plugins/issues
```

## Important Notes

- This command upgrades to the latest **tagged release** (stable, tested versions)
- Uses plugin-prefixed semantic versioning tags (e.g., `video-toolkit/v1.0.0`, `video-toolkit/v1.1.0`)
- A restart of Claude Code is **required** for changes to take effect
- The upgrade process will reinstall FFmpeg and Whisper dependencies
