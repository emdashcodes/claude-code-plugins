---
name: google-calendar
description: Manage Google Calendar events with full read-write access. This skill should be used when the user asks about their schedule, wants to create/update/delete events, find free time, or needs other calendar-related assistance.
allowed-tools: Bash, Read
---

# Google Calendar Management

This skill provides Google Calendar management across the user's calendars with intelligent scheduling, event management, and free time finding.

## When to Use This Skill

Activate this skill when the user:

- Asks about their schedule ("What's on my calendar today?")
- Wants to create new events ("Schedule a meeting tomorrow at 2pm")
- Needs to update existing events ("Move my 3pm meeting to 4pm")
- Wants to delete events ("Cancel my standup tomorrow")
- Needs to find free time ("When am I free this week for a 1-hour meeting?")
- Wants a daily summary or schedule overview
- Mentions calendar, events, meetings, or scheduling

## Context

**Current Date and Time:**

- Current date: !`date +"%A, %B %-d, %Y"`
- Current time: !`date +"%I:%M %p %Z"`
- ISO timestamp: !`date -u +"%Y-%m-%dT%H:%M:%SZ"`

**Calendar Configuration:**

- Configured calendars: !`${CLAUDE_PLUGIN_ROOT}/skills/google-calendar/scripts/google-calendar calendars --format compact`

**Timezone:**

- User timezone: !`${CLAUDE_PLUGIN_ROOT}/skills/google-calendar/scripts/google-calendar timezone`

## Available Commands

All calendar operations use the `google-calendar` CLI with subcommands:

### 1. Authentication (`google-calendar auth`)

Test OAuth authentication and connection:

```bash
./scripts/google-calendar auth
```

Run this to verify authentication is working. It will:

- Check for valid OAuth credentials
- Test API connection
- List available calendars

### 2. Calendar Configuration (`google-calendar calendars`)

**NEW**: List and view configured calendars with aliases:

```bash
./scripts/google-calendar calendars
```

The calendar configuration system allows you to:

- Select multiple calendars to monitor (work, personal, shared, etc.)
- Assign friendly aliases to calendars (e.g., "work", "personal", "family")
- Query all selected calendars by default
- Filter by specific calendar using alias or ID

**Configuration File:**

The configuration is stored in `google-calendar-config.json` in the plugin directory. This file contains:

- Selected calendars with their IDs, names, and aliases
- Default behavior settings (query all by default, show calendar labels)

**Calendar Aliases:**

Once configured, you can use aliases instead of calendar IDs:

```bash
# Query specific calendar by alias
./scripts/google-calendar list -c work

# Query specific calendar by alias for free time
./scripts/google-calendar find-free -c personal --duration 60
```

**Multi-Calendar Queries:**

By default (after configuration), commands query **all selected calendars** and merge results:

- **List events**: Shows events from all calendars, labeled by calendar name/alias
- **Find free time**: Finds slots that are free across ALL selected calendars

**Setup During Installation:**

The `/calendar-setup` wizard now includes calendar selection as part of the setup process:

1. OAuth authentication
2. Calendar discovery
3. **Calendar selection** (multi-select which calendars to monitor)
4. **Alias assignment** (optional friendly names for each calendar)
5. Configuration saved to plugin directory

To re-configure calendars later, run `/calendar-setup` again.

### 3. List Events (`google-calendar list`)

List and search calendar events:

- Show upcoming events
- Search by date range
- Filter by query text
- Output as formatted text or JSON

**Common usage patterns:**

```bash
# Show next 10 upcoming events (queries ALL configured calendars)
./scripts/google-calendar list

# Show events today across all calendars
./scripts/google-calendar list --start today --end tomorrow

# Show events this week
./scripts/google-calendar list --start today --max 20

# Search for specific events across all calendars
./scripts/google-calendar list --query "standup"

# Query specific calendar by alias
./scripts/google-calendar list -c work

# Query specific calendar by ID
./scripts/google-calendar list -c "user@example.com"

# Get JSON output for parsing
./scripts/google-calendar list --json
```

**Options:**

- `-c, --calendar <id|alias>` - Calendar ID or alias (default: all selected calendars)
- `-s, --start <date>` - Start time (ISO format or "today"/"tomorrow"/"+1d")
- `-e, --end <date>` - End time (ISO format or relative)
- `-m, --max <number>` - Maximum results (default: 10)
- `-q, --query <text>` - Search query text
- `-j, --json` - Output as JSON

**Multi-Calendar Behavior:**

- By default, queries **all selected calendars** from your configuration
- Events are merged and sorted by start time
- Calendar labels are shown for each event (e.g., "📅 Work Calendar")
- Use `-c` flag to query a specific calendar by alias or ID

### 3. Create Event (`google-calendar create`)

Create new calendar events:

- Support for timed and all-day events
- Flexible date/time parsing
- Attendees, location, description
- Duration-based or explicit end times

**Common usage patterns:**

```bash
# Create a 1-hour meeting tomorrow at 2pm
./scripts/google-calendar create "Team Standup" --start "tomorrow 14:00" --duration 1h

# Create all-day event
./scripts/google-calendar create "Conference" --start 2025-01-20 --all-day

# Create meeting with attendees and location
./scripts/google-calendar create "Planning Meeting" \
  --start "2025-01-15T14:00:00" \
  --duration 1h30m \
  --location "Conference Room A" \
  --attendees "colleague@example.com,manager@example.com" \
  --description "Q1 planning discussion"

# Output as JSON
./scripts/google-calendar create "Meeting" --start tomorrow --duration 30m --json
```

**Options:**

- `<summary>` (required) - Event title
- `-s, --start <date>` - Start time (ISO, relative, or "now") (default: now)
- `-e, --end <date>` - End time
- `-d, --duration <duration>` - Duration (e.g., "30m", "1h", "1h30m")
- `--description <text>` - Event description
- `-l, --location <location>` - Event location
- `-a, --attendees <emails>` - Comma-separated attendee emails
- `-c, --calendar <id>` - Calendar ID (default: primary)
- `--all-day` - Create all-day event
- `-j, --json` - Output as JSON

### 4. Update Event (`google-calendar update`)

Update existing calendar events:

- Find events by ID or search query
- Update any event property
- Modify attendees
- Reschedule events

**Common usage patterns:**

```bash
# Reschedule an event (searches by title)
./scripts/google-calendar update --query "Team Standup" --start "tomorrow 15:00"

# Update event details
./scripts/google-calendar update --query "Planning Meeting" \
  --summary "Q1 Planning Session" \
  --location "Zoom" \
  --duration 2h

# Update attendees (replaces all attendees)
./scripts/google-calendar update --query "Meeting" --attendees "person1@example.com,person2@example.com"

# Update by event ID
./scripts/google-calendar update --event-id "abc123eventid" --start "2025-01-16T10:00:00"
```

**Options:**

- `-i, --event-id <id>` - Event ID to update
- `-q, --query <text>` - Search query to find event
- `--summary <text>` - New event title
- `-s, --start <date>` - New start time
- `-e, --end <date>` - New end time
- `-d, --duration <duration>` - New duration
- `--description <text>` - New description
- `-l, --location <location>` - New location
- `-a, --attendees <emails>` - New comma-separated attendee emails (replaces all)
- `-c, --calendar <id>` - Calendar ID (default: primary)
- `-j, --json` - Output as JSON

### 5. Delete Event (`google-calendar delete`)

Delete calendar events:

- Find by ID or search query
- Confirmation prompt (unless `--force` flag used)
- Shows event details before deletion

**Common usage patterns:**

```bash
# Delete event (with confirmation)
./scripts/google-calendar delete --query "Team Standup"

# Delete without confirmation prompt
./scripts/google-calendar delete --query "Old Meeting" --force

# Delete by event ID
./scripts/google-calendar delete --event-id "abc123eventid" --force
```

**Options:**

- `-i, --event-id <id>` - Event ID to delete
- `-q, --query <text>` - Search query to find event
- `-c, --calendar <id>` - Calendar ID (default: primary)
- `-f, --force` - Skip confirmation prompt
- `-j, --json` - Output as JSON

### 6. Find Free Time (`google-calendar find-free`)

Find available time slots:

- Search for free time of specific duration
- Optional working hours filter (9 AM - 5 PM)
- Configurable date range
- Avoids conflicts with existing events
- **Multi-calendar support**: Finds slots free across ALL selected calendars

**Common usage patterns:**

```bash
# Find 1-hour slots this week free across ALL calendars (working hours only)
./scripts/google-calendar find-free --duration 60 --working-hours-only

# Find 30-minute slots tomorrow
./scripts/google-calendar find-free --duration 30 --start tomorrow --end "tomorrow 23:59"

# Find slots including all hours
./scripts/google-calendar find-free --duration 120

# Search specific date range
./scripts/google-calendar find-free --duration 60 --start "+1d" --end "+7d"

# Find free time on specific calendar only
./scripts/google-calendar find-free -c work --duration 60

# Output as JSON
./scripts/google-calendar find-free --duration 60 --json
```

**Options:**

- `-d, --duration <minutes>` - Minimum duration in minutes (default: 30)
- `-s, --start <date>` - Search start date (default: now)
- `-e, --end <date>` - Search end date (default: +7 days)
- `-c, --calendar <id|alias>` - Calendar ID or alias (default: all selected calendars)
- `-w, --working-hours-only` - Only search during working hours (9 AM - 5 PM)
- `-j, --json` - Output as JSON

**Multi-Calendar Behavior:**

- By default, finds slots that are **free across ALL selected calendars**
- Merges busy times from all calendars to avoid conflicts
- Perfect for finding meeting times that work across work and personal schedules
- Use `-c` flag to check availability on a specific calendar only

## Common Workflows

### Daily Schedule Check

When the user asks "What's on my calendar today?" or "What meetings do I have?":

1. Use `google-calendar list` to fetch today's events:

   ```bash
   ./scripts/google-calendar list --start today --end tomorrow
   ```

2. Format the output in a friendly summary
3. Highlight any conflicts or back-to-back meetings

### Schedule a New Meeting

When the user asks to schedule a meeting:

1. If no time specified, use `find-free` to suggest options:

   ```bash
   ./scripts/google-calendar find-free --duration 60 --working-hours-only
   ```

2. Once time is confirmed, use `create`:

   ```bash
   ./scripts/google-calendar create "Meeting Title" --start "2025-01-15T14:00:00" --duration 1h
   ```

3. Confirm creation with event link

### Find Free Time for Meeting

When the user asks "When am I free for a meeting?":

1. Clarify duration if not specified (default: 60 minutes)
2. Use `find-free` to find slots:

   ```bash
   ./scripts/google-calendar find-free --duration 60 --start today --working-hours-only
   ```

3. Present options in a clear format
4. Offer to schedule if the user chooses a slot

### Reschedule Existing Event

When the user asks to move or reschedule a meeting:

1. Find the event first with `list`:

   ```bash
   ./scripts/google-calendar list --query "meeting name"
   ```

2. Use `update` to reschedule:

   ```bash
   ./scripts/google-calendar update --query "meeting name" --start "new time"
   ```

3. Confirm the change

### Cancel/Delete Event

When the user asks to cancel a meeting:

1. Find and confirm the event with `list`
2. Use `delete` with force flag:

   ```bash
   ./scripts/google-calendar delete --query "meeting name" --force
   ```

3. Confirm deletion

### Weekly Overview

When the user asks for a weekly summary:

1. Fetch all events for the week:

   ```bash
   ./scripts/google-calendar list --start today --max 50
   ```

2. Group by day
3. Identify patterns (heavy days, free time, etc.)
4. Present organized summary

## Error Handling

### Authentication Errors

If commands fail with authentication errors:

1. Run `/calendar-setup` to re-authenticate
2. Ensure OAuth credentials exist in plugin directory (`google-calendar-oauth.json`)
3. Check that token file has valid permissions (`google-calendar-token.json`)
4. Test with: `./scripts/google-calendar auth`

### Event Not Found

If `update` or `delete` can't find an event:

1. Use `list --query "search term"` to verify event exists
2. Try searching with different keywords
3. Use the event ID directly with `--event-id` if available

### Dependencies Missing

If commands fail with errors:

1. Run `/calendar-setup` to install dependencies
2. Ensure Node.js >= 18 and npm are available
3. Run `npm install` in the plugin directory if needed

## Best Practices

### Natural Language Interactions

- Parse user requests naturally - don't ask for ISO timestamps if they say "tomorrow at 2pm"
- Use the CLI's flexible date parsing (supports "today", "tomorrow", "+1d", ISO format)
- Default to 1-hour duration if not specified
- Default to working hours for free time searches

### Proactive Suggestions

- When scheduling, check for conflicts first
- Suggest alternative times if requested slot is busy
- Highlight back-to-back meetings or heavy days
- Offer to find free time when asked to schedule without specific time

### Formatting Outputs

- Present event lists in chronological order
- Use friendly date/time formatting (not just ISO timestamps)
- Include relevant details: location, attendees, duration
- Provide calendar links when available

### Command Execution

- Always use the full path to the script when running commands
- Capture both stdout and stderr to catch errors
- Use `--json` flag for structured data when processing programmatically
- Use formatted output (no --json) when displaying results to the user

## Example Interactions

**User:** "What's on my calendar today?"

```bash
./scripts/google-calendar list --start today --end tomorrow
```

Then format the output as a friendly summary.

**User:** "Schedule a 1-on-1 with Sarah tomorrow at 2pm for 30 minutes"

```bash
./scripts/google-calendar create "1-on-1 with Sarah" --start "tomorrow 14:00" --duration 30m --attendees "sarah@example.com"
```

**User:** "When am I free this week for a 90-minute meeting?"

```bash
./scripts/google-calendar find-free --duration 90 --start today --working-hours-only
```

**User:** "Cancel my standup tomorrow"

```bash
# First find it
./scripts/google-calendar list --start tomorrow --end "tomorrow 23:59" --query "standup"
# Then delete
./scripts/google-calendar delete --query "standup" --force
```

**User:** "Move my 3pm meeting to 4pm"

```bash
# Find the 3pm meeting
./scripts/google-calendar list --start today --end tomorrow
# Update it (replace with actual event name/id)
./scripts/google-calendar update --query "Meeting Name" --start "today 16:00"
```

## Installation & Setup

### First-Time Setup (Recommended)

**Use the interactive setup command:**

```bash
/calendar-setup
```

The setup wizard will:

1. Check and install Node.js dependencies automatically
2. Guide you through getting OAuth credentials from Google
3. Run the OAuth authentication flow
4. Store tokens securely in the plugin directory
5. Test your connection to verify everything works

### Manual Setup (Alternative)

If the user prefers to set up manually or needs to troubleshoot:

1. **Install dependencies:**

   ```bash
   cd /path/to/plugin
   npm install
   npm run build
   ```

2. **Get OAuth credentials:**
   - Go to <https://console.cloud.google.com/apis/credentials>
   - Create OAuth 2.0 Client ID (Desktop app type)
   - Download and save to plugin directory as `google-calendar-oauth.json`

3. **Authenticate:**

   ```bash
   ./scripts/google-calendar auth
   ```

   This will open a browser for OAuth authorization and save the token.

4. **Test connection:**

   ```bash
   ./scripts/google-calendar list --max 5
   ```

### Token and Configuration Management

- **OAuth credentials**: `<plugin-directory>/google-calendar-oauth.json` (user-provided)
- **Access tokens**: `<plugin-directory>/google-calendar-token.json` (auto-managed)
- **Calendar configuration**: `<plugin-directory>/google-calendar-config.json` (created during setup)
- Tokens are automatically refreshed by all commands
- Calendar configuration includes selected calendars, aliases, and default behavior settings
- To view configured calendars: `./scripts/google-calendar calendars`
- To re-configure calendars, re-run `/calendar-setup`
- If authentication fails, re-run `/calendar-setup` or `./scripts/google-calendar auth`
