---
description: Interactive setup wizard to configure Google Gmail plugin with OAuth credentials, dependencies, and first profile
tools: Read, Write, Bash, AskUserQuestion
---

# Google Gmail Setup Wizard

You are running the Google Gmail setup wizard to configure the plugin with OAuth authentication and create your first email profile.

## CRITICAL: File Locations

**ALWAYS** use the plugin root path for ALL file operations:

- **OAuth credentials**: `${CLAUDE_PLUGIN_ROOT}/google-gmail-oauth.json`
- **Config file**: `${CLAUDE_PLUGIN_ROOT}/google-gmail-config.json`
- **Profile tokens**: `${CLAUDE_PLUGIN_ROOT}/profiles/<name>/token.json`
- **Scripts**: `${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/`
- **NEVER** use `~/.claude/` paths
- **NEVER** write to the current working directory

All token and config files MUST use `${CLAUDE_PLUGIN_ROOT}` paths.

## Your Task

Guide the user through setup to configure Gmail access with account profiles.

**Setup Philosophy:**

- **Simple & Guided**: Clear step-by-step instructions
- **Safe**: Store credentials securely in plugin directory
- **Multi-Account**: Support multiple Gmail accounts from the start
- **Automatic**: Validate connection automatically

**What Setup Does:**

1. Check and install Node.js dependencies
2. Set up OAuth authentication with Gmail API
3. Create Gmail account profile(s)
4. Authenticate with Google
5. Test connection and verify access

**Begin setup:**

### Part 0: Check Existing Setup (0/5)

First, check if the plugin is already configured:

1. Check if config file exists and has profiles:
   ```bash
   test -f ${CLAUDE_PLUGIN_ROOT}/google-gmail-config.json && echo "EXISTS" || echo "NOT_FOUND"
   ```

2. If EXISTS:
   - Read the config to see existing profiles
   - Show existing profiles to user:
     ```bash
     ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail accounts list
     ```

   - Use `AskUserQuestion`:
     - "You already have Gmail profiles configured. What would you like to do?"
     - **Options**:
       - "Add another account" → Skip to Part 3 to add new profile
       - "Reconfigure from scratch" → Continue with Part 1
       - "Exit setup" → Exit

3. If NOT_FOUND:
   - This is first-time setup
   - Continue to Part 1

### Part 1: Dependencies Check (1/5)

Check if Node.js dependencies are installed and install if needed.

**Check dependencies:**

1. Check if node_modules exists and is valid:
   ```bash
   test -d ${CLAUDE_PLUGIN_ROOT}/node_modules && echo "EXISTS" || echo "NOT_FOUND"
   ```

2. If EXISTS:
   - Show: "✅ Dependencies already installed"
   - Skip to Part 2

3. If NOT_FOUND:
   - Show: "📦 Installing required Node.js packages (googleapis, commander, nodemailer, mailparser)..."
   - Run installation:
     ```bash
     cd ${CLAUDE_PLUGIN_ROOT} && npm install && npm run build
     ```
   - Wait for completion
   - Show installation summary

### Part 2: OAuth Credentials Check (2/5)

Check if OAuth credentials are available and guide user through setup.

**Check for existing credentials:**

1. Check if OAuth credentials exist in plugin directory:
   ```bash
   test -f ${CLAUDE_PLUGIN_ROOT}/google-gmail-oauth.json && echo "EXISTS" || echo "NOT_FOUND"
   ```

2. If credentials exist (EXISTS):
   - Show: "✅ Found OAuth credentials in plugin directory"
   - Skip credential setup, proceed to profile creation

3. If credentials don't exist (NOT_FOUND):
   - Show instructions for getting OAuth credentials:
     ```
     📋 Gmail API Setup Required

     To use this plugin, you need OAuth 2.0 credentials from Google:

     1. Go to: https://console.cloud.google.com/apis/credentials
     2. Create a new project (or select existing)
     3. Enable Gmail API:
        → https://console.cloud.google.com/apis/library/gmail.googleapis.com
     4. Create OAuth 2.0 Client ID:
        - Application type: Desktop app
        - Name: Claude Code Gmail
     5. Download credentials as JSON
     6. Save to: ${CLAUDE_PLUGIN_ROOT}/google-gmail-oauth.json

     💡 Tip: These credentials can be shared across multiple Gmail accounts.
        Each account will have its own secure token.
     ```

   - Use `AskUserQuestion`:
     - "Have you downloaded your OAuth credentials JSON file from Google?"
     - **Options**:
       - "Yes, I have the file" → Continue to file location
       - "No, show me how" → Show detailed instructions again
       - "Skip for now" → Exit setup

   - If user chose "Yes, I have the file":
     - Ask them to provide the path to the downloaded credentials file
     - Validate the file exists and is valid JSON
     - Copy file to ${CLAUDE_PLUGIN_ROOT}/google-gmail-oauth.json using:
       ```bash
       cp <user-provided-path> ${CLAUDE_PLUGIN_ROOT}/google-gmail-oauth.json
       ```
     - Verify copy succeeded
     - Show: "✅ Credentials saved to plugin directory"
     - Continue to profile creation

   - If user chose "Skip", exit with message:
     ```
     Setup paused. Run /gmail-setup when you're ready to continue.

     When ready, download OAuth credentials from Google Cloud Console
     and run /gmail-setup again.
     ```

### Part 3: Create First Profile (3/5)

Create the user's first Gmail account profile.

**Profile creation:**

1. Show message:
   ```
   📧 Create Your First Gmail Profile

   Profiles let you manage multiple Gmail accounts (personal, work, etc.).
   You can add more accounts later with:
     google-gmail accounts add <profile-name>

   Let's create your first profile now.
   ```

2. Use `AskUserQuestion`:
   - "What would you like to name your first profile?"
   - **Options**:
     - "default" → Use "default"
     - "personal" → Use "personal"
     - "work" → Use "work"
     - "Other" → User provides custom name

3. Store the profile name (e.g., "personal")

4. Show:
   ```
   ✅ Profile '<profile-name>' will be created
   ```

### Part 4: OAuth Authentication (4/5)

Authenticate with Google and save token for this profile.

**Run authentication:**

1. Show message:
   ```
   🔐 Starting Gmail authentication for profile '<profile-name>'...

   This will:
   1. Open a browser window for Google authorization
   2. Ask you to grant Gmail access
   3. Save the access token securely in the plugin directory

   Ready to proceed?
   ```

2. Use `AskUserQuestion`:
   - "Start OAuth authentication?"
   - **Options**:
     - "Yes, start now" → Proceed with auth
     - "Skip for now" → Exit setup

3. If user chose "Yes, start now":
   - Run authentication:
     ```bash
     ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail accounts add <profile-name>
     ```

   - The script will:
     - Load credentials from ${CLAUDE_PLUGIN_ROOT}/google-gmail-oauth.json
     - Create profile directory at ${CLAUDE_PLUGIN_ROOT}/profiles/<profile-name>/
     - Open browser for Google OAuth flow
     - User grants Gmail access
     - Save token to ${CLAUDE_PLUGIN_ROOT}/profiles/<profile-name>/token.json
     - Set as default profile
     - Return to CLI

   - Wait for script to complete

4. Check if authentication succeeded:
   ```bash
   test -f ${CLAUDE_PLUGIN_ROOT}/profiles/<profile-name>/token.json && echo "SUCCESS" || echo "FAILED"
   ```

5. If SUCCESS:
   - Show: "✅ Authentication successful for profile '<profile-name>'!"
   - Continue to testing

6. If FAILED:
   - Show error message
   - Use `AskUserQuestion`:
     - "Authentication failed. What would you like to do?"
     - **Options**:
       - "Try again" → Retry authentication
       - "Check credentials" → Show instructions for verifying credentials file
       - "Exit setup" → Exit

### Part 5: Test Connection & Save Config (5/5)

Test the connection, update config with email address, and display completion message.

**Run connection test:**

1. Show message:
   ```
   🔍 Testing connection to Gmail API...
   ```

2. Run test command:
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail auth --profile <profile-name>
   ```

3. If successful:
   - Parse the email address from the auth output
   - Update the config file to replace "pending" with actual email:
     ```bash
     # The auth command outputs: "Email: user@example.com"
     # Extract the email and update config
     ```

   - Read the config file, update the email field for this profile, and save it back

4. Show:
   ```
   ✅ Google Gmail Setup Complete!

   Profile: <profile-name> (default)
   Token saved to: ${CLAUDE_PLUGIN_ROOT}/profiles/<profile-name>/token.json

   You can now use Gmail commands:
   - Check your email: "Check my recent emails"
   - List unread: "Show me unread messages"
   - Send email: "Send an email to user@example.com"
   - Search: "Find emails from boss@company.com about Q4 project"

   Multi-Account Support:
   - Add more accounts: google-gmail accounts add work
   - List profiles: google-gmail accounts list
   - Switch accounts: Use --profile work flag

   Your access tokens will be automatically refreshed when needed.
   ```

4. Offer to test:
   Use `AskUserQuestion`:
   - "Would you like to test by listing your recent emails?"
   - **Options**:
     - "Yes, list my emails" → Run test
     - "No, I'm all set" → Exit

   If user chose "Yes":
   - Run:
     ```bash
     ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --profile <profile-name> --max 5
     ```
   - Show results

## Important Guidelines

- **Be conversational** - Guide the user with clear, friendly language
- **Handle errors gracefully** - Provide helpful error messages and recovery options
- **Use full paths** - Always use ${CLAUDE_PLUGIN_ROOT} for plugin files
- **Show progress** - Indicate which step (1/5, 2/5, 3/5, 4/5, 5/5)
- **Don't skip validation** - Always verify files exist before proceeding
- **Security** - Remind users to keep credentials secure
- **Browser flow** - Warn user that browser window will open for OAuth
- **Multi-account** - Emphasize that they can add more accounts later

## Troubleshooting

**If OAuth credentials are invalid:**
- Check JSON format is correct
- Ensure it's a "Desktop app" credential type
- Verify Gmail API is enabled in Google Cloud Console

**If browser doesn't open:**
- Copy the URL from terminal and open manually
- Check for firewall/security software blocking localhost

**If token fails to save:**
- Check ${CLAUDE_PLUGIN_ROOT} path is accessible
- Verify write permissions on plugin directory and profiles subdirectory

**Common errors:**
- "Cannot find module" → Dependencies not installed, run Part 1 again
- "Invalid client_id" → OAuth credentials file is incorrect
- "Redirect URI mismatch" → OAuth app not configured as "Desktop app"
- "Node.js not found" → Ensure Node.js >= 18 is installed
- "403 Forbidden" → Gmail API not enabled in Google Cloud Console
- "Profile not found" → Profile creation failed, try adding manually
