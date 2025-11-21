---
description: Interactive setup wizard to configure Google Calendar plugin with OAuth credentials and dependencies
tools: Read, Write, Bash, AskUserQuestion
---

# Google Calendar Setup Wizard

You are running the Google Calendar setup wizard to configure the plugin with OAuth authentication.

## CRITICAL: File Locations

**ALWAYS** use the plugin root path for ALL file operations:

- **Token file**: `${CLAUDE_PLUGIN_ROOT}/google-calendar-token.json`
- **OAuth credentials**: `${CLAUDE_PLUGIN_ROOT}/google-calendar-oauth.json`
- **Config file**: `${CLAUDE_PLUGIN_ROOT}/google-calendar-config.json`
- **Scripts**: `${CLAUDE_PLUGIN_ROOT}/skills/google-calendar/scripts/`
- **NEVER** use `~/.claude/` paths
- **NEVER** write to the current working directory

All token and config files MUST use `${CLAUDE_PLUGIN_ROOT}` paths

## Your Task

Guide the user through a 5-part setup process to configure Google Calendar access.

**Setup Philosophy:**

- **Simple & Guided**: Clear step-by-step instructions
- **Safe**: Store credentials securely in plugin directory
- **Automatic**: Validate connection automatically

**What Setup Does:**

1. Check and install Node.js dependencies
2. Set up OAuth authentication with Google Calendar
3. Test connection and verify access to calendars
4. Configure calendar selection and aliases
5. Complete setup with usage instructions

**Begin setup:**

### Part 1: Dependencies Check

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
   - Show: "📦 Installing required Node.js packages..."
   - Run installation:
     ```bash
     cd ${CLAUDE_PLUGIN_ROOT} && npm install && npm run build
     ```
   - Wait for completion
   - Show installation summary

### Part 2: OAuth Credentials Check

Check if OAuth credentials are available and guide user through authentication.

**Check for existing credentials:**

1. Check if OAuth credentials exist in plugin directory:
   ```bash
   test -f ${CLAUDE_PLUGIN_ROOT}/google-calendar-oauth.json && echo "EXISTS" || echo "NOT_FOUND"
   ```

2. If credentials exist (EXISTS):
   - Show: "✅ Found OAuth credentials in plugin directory"
   - Skip credential setup, proceed to authentication

3. If credentials don't exist (NOT_FOUND):
   - Show instructions for getting OAuth credentials:
     ```
     📋 Google Calendar API Setup Required

     To use this plugin, you need OAuth 2.0 credentials from Google:

     1. Go to: https://console.cloud.google.com/apis/credentials
     2. Create a new project (or select existing)
     3. Enable Google Calendar API:
        → https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
     4. Create OAuth 2.0 Client ID:
        - Application type: Desktop app
        - Name: Claude Code Calendar
     5. Download credentials as JSON
     6. Save to: ${CLAUDE_PLUGIN_ROOT}/google-calendar-oauth.json
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
     - Copy file to ${CLAUDE_PLUGIN_ROOT}/google-calendar-oauth.json using:
       ```bash
       cp <user-provided-path> ${CLAUDE_PLUGIN_ROOT}/google-calendar-oauth.json
       ```
     - Verify copy succeeded
     - Show: "✅ Credentials saved to plugin directory"
     - Continue to authentication

   - If user chose "Skip", exit with message:
     ```
     Setup paused. Run /calendar-setup when you're ready to continue.

     When ready, download OAuth credentials from Google Cloud Console
     and run /calendar-setup again.
     ```

### Part 3: OAuth Authentication

Authenticate with Google and save token to plugin directory.

**Run authentication:**

1. Show message:
   ```
   🔐 Starting Google Calendar authentication...

   This will:
   1. Open a browser window for Google authorization
   2. Ask you to grant calendar access
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
     ${CLAUDE_PLUGIN_ROOT}/skills/google-calendar/scripts/google-calendar auth
     ```

   - The script will:
     - Load credentials from ${CLAUDE_PLUGIN_ROOT}/google-calendar-oauth.json
     - Open browser for Google OAuth flow
     - User grants calendar access
     - Save token to ${CLAUDE_PLUGIN_ROOT}/google-calendar-token.json
     - Test connection and list calendars

   - Wait for script to complete

4. Check if authentication succeeded:
   ```bash
   test -f ${CLAUDE_PLUGIN_ROOT}/google-calendar-token.json && echo "SUCCESS" || echo "FAILED"
   ```

5. If SUCCESS:
   - Show: "✅ Authentication successful!"
   - Show detected calendars from script output
   - Continue to completion

6. If FAILED:
   - Show error message
   - Use `AskUserQuestion`:
     - "Authentication failed. What would you like to do?"
     - **Options**:
       - "Try again" → Retry authentication
       - "Check credentials" → Show instructions for verifying credentials file
       - "Exit setup" → Exit

### Part 4: Calendar Configuration

Configure which calendars to monitor and set up aliases.

**Run calendar configuration:**

1. Show message:
   ```
   📅 Calendar Configuration

   Now let's configure which calendars you want to monitor.
   You can select multiple calendars and give them friendly names.
   ```

2. Fetch all available calendars using the CLI:
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/skills/google-calendar/scripts/google-calendar auth
   ```

3. Parse the calendar list from the auth output and use `AskUserQuestion` with multiSelect enabled:
   - "Which calendars would you like to monitor?"
   - **Options**: Create an option for each calendar with:
     - label: Calendar summary/name (e.g., "Work Calendar", "Personal", etc.)
     - description: Calendar ID and access role
   - **multiSelect**: true

4. For each selected calendar, ask if user wants to assign an alias:
   - Use `AskUserQuestion` for each calendar:
     - "Would you like to give '{{calendar_name}}' a friendly alias?"
     - **Options**:
       - "Yes, use an alias" → Ask for alias name
       - "No, use the default name"

5. If user chose "Yes, use an alias":
   - Prompt for the alias name (can use Other option for custom text)
   - Suggest common aliases like "work", "personal", "family"
   - Validate alias is lowercase, alphanumeric with hyphens only

6. Build the configuration object:
   ```json
   {
     "calendars": [
       {
         "id": "calendar_id",
         "summary": "Calendar Name",
         "alias": "work",
         "selected": true,
         "primary": false,
         "accessRole": "owner"
       }
     ],
     "defaultBehavior": {
       "queryAllByDefault": true,
       "showCalendarLabels": true
     }
   }
   ```

7. Save configuration to plugin directory:
   - Use Write tool to create: `${CLAUDE_PLUGIN_ROOT}/google-calendar-config.json`
   - Pretty-print JSON with 2-space indentation

8. Show confirmation:
   ```
   ✅ Calendar configuration saved!

   Selected calendars:
   • Work Calendar (alias: work)
   • Personal (no alias)

   By default, events will be queried across all selected calendars.
   You can use aliases in commands: google-calendar list -c work
   ```

### Part 5: Completion

Show final status and next steps.

**Display completion message:**

```
✅ Google Calendar Setup Complete!

Token saved to: ${CLAUDE_PLUGIN_ROOT}/google-calendar-token.json
Configuration saved to: ${CLAUDE_PLUGIN_ROOT}/google-calendar-config.json

Configured calendars:
[List selected calendars with their aliases]

You can now use:
- Ask about your schedule: "What's on my calendar today?"
- Create events: "Schedule a meeting tomorrow at 2pm"
- Find free time: "When am I free this week?"

By default, events will be queried across all selected calendars.
You can use aliases in commands: google-calendar list -c work

To view your configured calendars:
  google-calendar calendars

Your access token will be automatically refreshed when needed.
```

**Offer to test the connection:**

Use `AskUserQuestion`:
- "Would you like to test your calendar access?"
- **Options**:
  - "Yes, show my upcoming events" → Run test
  - "No, I'm all set" → Exit

If user chose "Yes":
- Run test command:
  ```bash
  ${CLAUDE_PLUGIN_ROOT}/skills/google-calendar/scripts/google-calendar list --max 5
  ```
- Show events or error if fails

## Important Guidelines

- **Be conversational** - Guide the user with clear, friendly language
- **Handle errors gracefully** - Provide helpful error messages and recovery options
- **Use full paths** - Always use ${CLAUDE_PLUGIN_ROOT} for plugin files
- **Show progress** - Indicate which step (1/5, 2/5, 3/5, 4/5, 5/5)
- **Don't skip validation** - Always verify files exist before proceeding
- **Security** - Remind users to keep credentials secure
- **Browser flow** - Warn user that browser window will open for OAuth
- **Config file** - Always save calendar configuration to ${CLAUDE_PLUGIN_ROOT}/google-calendar-config.json

## Troubleshooting

**If OAuth credentials are invalid:**
- Check JSON format is correct
- Ensure it's a "Desktop app" credential type
- Verify Calendar API is enabled in Google Cloud Console

**If browser doesn't open:**
- Copy the URL from terminal and open manually
- Check for firewall/security software blocking localhost

**If token fails to save:**
- Check ${CLAUDE_PLUGIN_ROOT} path is accessible
- Verify write permissions on plugin directory

**Common errors:**
- "Cannot find module" → Dependencies not installed, run Part 1 again
- "Invalid client_id" → OAuth credentials file is incorrect
- "Redirect URI mismatch" → OAuth app not configured as "Desktop app"
- "Node.js not found" → Ensure Node.js >= 18 is installed
