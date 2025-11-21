---
name: google-gmail
description: Manage Gmail with full email operations including send, read, search, organize messages, manage drafts, labels, and attachments. Supports multiple Google accounts with profile-based authentication. This skill should be used when the user needs to work with Gmail, send emails, read messages, search inbox, or manage email organization.
allowed-tools: Bash, Read, Write
---

# Google Gmail Management

This skill provides comprehensive Gmail management with full email operations, multi-account support, and complete CRUD capabilities for messages, drafts, labels, and attachments.

## When to Use This Skill

Activate this skill when the user:

- Wants to read, search, or list Gmail messages
- Needs to send, reply to, or forward emails
- Wants to manage drafts (create, send, delete)
- Needs to organize emails with labels
- Wants to download email attachments
- Asks about their Gmail, inbox, or email
- Mentions sending an email or checking messages
- Needs to manage multiple Gmail accounts

## Context

**Connected Gmail Accounts:**

- Account profiles: !`${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail accounts list`

## Multi-Account Profile System

The gmail CLI supports multiple Google accounts through a profile-based system. Each profile has its own OAuth tokens and can optionally use separate OAuth credentials.

### Profile Management

```bash
# Add a new account profile (starts OAuth flow)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail accounts add personal

# Add with profile-specific OAuth credentials
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail accounts add work --oauth ./work-oauth.json

# List all profiles
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail accounts list

# Set default profile
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail accounts set-default personal

# Remove a profile
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail accounts remove work --force
```

### Using Profiles

All commands support the `-p, --profile` option to specify which account to use:

```bash
# Use default profile (no flag needed)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list

# Use specific profile
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --profile work
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail send --profile personal --to user@example.com
```

## Core Commands

### Authentication Testing

Test OAuth authentication and connection:

```bash
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail auth
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail auth --profile work
```

### Listing Messages

List and search Gmail messages with powerful filtering:

```bash
# Basic listing (searches all mail by default)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --max 20

# Filter by label
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --label INBOX
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --label SENT

# Search with Gmail query syntax
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --query "from:boss@company.com subject:meeting"

# Filter by category (Gmail automatically categorizes emails)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --query "category:primary"
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --query "category:social"
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --query "category:promotions"

# Quick filters (automatically applies primary + uncategorized default)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --unread
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --has-attachment
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --from user@example.com
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --subject "project update"

# Date range
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --after 2024/01/01 --before 2024/12/31

# Search ALL categories (override default)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --query "in:inbox"

# Search specific category only
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --query "category:social"

# JSON output for processing
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --json
```

**Search Behavior:**

By default, the list command searches **all mail** unless you specify a category or label filter.

**To filter by category:**
- Use `--query "category:primary"` for personal/important emails only
- Use `--query "category:social"` for social network emails
- Use `--query "category:promotions"` for marketing/deals
- Use `--query "category:updates"` for confirmations/receipts
- Use `--query "category:forums"` for mailing lists/forums

**To search all inbox categories:**
- Use `--query "in:inbox"` or `--label INBOX`

**Available options:**
- `--profile <name>` - Use specific account profile
- `--label <name>` - Filter by label (INBOX, SENT, DRAFTS, STARRED, etc.)
- `--query <text>` - Gmail search query
- `--max <number>` - Maximum results (default: 10)
- `--unread` - Only unread messages
- `--has-attachment` - Only messages with attachments
- `--from <email>` - Filter by sender
- `--to <email>` - Filter by recipient
- `--subject <text>` - Filter by subject text
- `--after <date>` - Messages after YYYY/MM/DD
- `--before <date>` - Messages before YYYY/MM/DD
- `--json` - Output as JSON

### Reading Messages

Read message content in various formats:

```bash
# Plain text (default)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail read <message-id>

# Markdown format (better for analysis)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail read <message-id> --format markdown

# HTML format
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail read <message-id> --format html

# Structured JSON
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail read <message-id> --json
```

### Sending Emails

Send new emails with full control:

```bash
# Simple email
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail send \
  --to user@example.com \
  --subject "Hello" \
  --body "Message text"

# Multiple recipients
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail send \
  --to user1@example.com \
  --to user2@example.com \
  --cc manager@company.com \
  --subject "Team Update"

# With attachments
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail send \
  --to user@example.com \
  --subject "Documents" \
  --body "See attached files" \
  --attach ./report.pdf \
  --attach ./data.xlsx

# HTML email
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail send \
  --to user@example.com \
  --subject "Newsletter" \
  --html "<h1>Welcome</h1><p>Latest updates...</p>"

# From file
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail send \
  --to user@example.com \
  --subject "Report" \
  --body-file ./message.txt \
  --attach ./report.pdf
```

### Replying to Messages

Reply to messages (automatically handles threading):

```bash
# Simple reply
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail reply <message-id> \
  --body "Thanks for your email. I'll get back to you soon."

# Reply all
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail reply <message-id> \
  --body "Thanks everyone" \
  --reply-all

# Reply with attachment
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail reply <message-id> \
  --body "See attached document" \
  --attach ./response.pdf
```

### Managing Drafts

Create, send, and delete email drafts:

```bash
# List all drafts
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail draft list

# Send a draft
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail draft send <draft-id>

# Delete a draft
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail draft delete <draft-id>
```

### Managing Labels

Organize messages with labels:

```bash
# List all labels
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels list

# Create new label (supports nesting with /)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels create "Work/Projects"
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels create "Notifications/GitHub"

# Delete a label
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels delete <label-id>

# Add label to message (use label ID, not name)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels add <message-id> --label <label-id>

# Remove label from message (use label ID, not name)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels remove <message-id> --label <label-id>
```

**Important:** When adding or removing labels from messages, you must use the label ID (e.g., `Label_30`), not the label name. Get label IDs from the `labels list` command.

### Managing Filters

Automate email organization with Gmail filters:

```bash
# List all filters
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail filters list

# Create filter to auto-archive and label
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail filters create \
  --from "newsletter@company.com" \
  --add-label "Newsletters" \
  --archive \
  --mark-read

# Create filter for GitHub notifications
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail filters create \
  --query "from:(*@github.com OR *github@company.com)" \
  --add-label "Code-Review" \
  --star

# Create filter with multiple criteria
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail filters create \
  --from "support@service.com" \
  --subject "Invoice" \
  --has-attachment \
  --add-label "Receipts"

# Update a filter (keeps existing settings, only changes what you specify)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail filters update <filter-id> \
  --archive

# Update multiple settings at once
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail filters update <filter-id> \
  --add-label "Important" \
  --star \
  --archive

# Delete a filter
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail filters delete <filter-id>
```

**Filter Options:**

Criteria (at least one required):
- `--from <email>` - Filter by sender
- `--to <email>` - Filter by recipient
- `--subject <text>` - Filter by subject text
- `--query <text>` - Gmail search query
- `--has-attachment` - Only messages with attachments

Actions (at least one required):
- `--add-label <name>` - Apply label by name (repeatable)
- `--remove-label <name>` - Remove label by name (repeatable)
- `--star` - Star matching messages
- `--mark-read` - Mark as read
- `--archive` - Skip inbox (archive)
- `--forward <email>` - Forward to email address

**Important Notes:**
- When creating or updating filters, use label **names** (e.g., "AI Notes"), not IDs
- The filter will automatically resolve label names to their IDs
- Filters apply to future incoming messages that match the criteria
- To apply a filter to existing messages, use the labels commands directly
- **Update command**: The Gmail API doesn't support updating filters directly, so the `update` command gets the existing filter, deletes it, and creates a new one with your changes. Only specify the options you want to change - existing settings are preserved.

### Bulk Email Operations

Mark messages as read, archive, or restore messages in bulk:

#### Mark All as Read

```bash
# Mark all unread messages as read
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels mark-read --all

# Mark specific message as read
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels mark-read --message-id <id>

# Mark messages from specific sender as read
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels mark-read \
  --query "from:sender@example.com is:unread"
```

**Features:**
- Uses pagination to find ALL unread messages (not limited to 500)
- Uses batch API calls for efficiency (1000 messages at a time)
- Shows progress during operation
- Works across all categories and labels

#### Archive Messages

Archive messages (removes INBOX label, messages still searchable):

```bash
# Archive all messages from a sender
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels archive \
  --from sender@example.com

# Archive using custom query
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels archive \
  --query "from:newsletter@company.com in:inbox"

# Archive entire category (Social, Promotions, Updates)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels archive \
  --query "category:social in:inbox"

# Archive multiple senders at once
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels archive \
  --query "in:inbox (from:sender1@example.com OR from:sender2@example.com)"

# Archive specific message
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels archive \
  --message-id <id>
```

#### Unarchive Messages

Restore archived messages back to inbox:

```bash
# Unarchive all messages from a sender
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels unarchive \
  --from important@example.com

# Unarchive using custom query
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels unarchive \
  --query "from:important@example.com"

# Unarchive specific message
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels unarchive \
  --message-id <id>
```

**Use cases:**
- Restore accidentally archived emails
- Bring back important messages to inbox
- Undo bulk archive operations

### Managing Attachments

Download email attachments:

```bash
# List attachments in a message
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail attachment list <message-id>

# Download attachment by index (easiest method - 1-based)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail attachment download \
  <message-id> \
  1 \
  --output ./document.pdf

# Download by attachment ID (also works)
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail attachment download \
  <message-id> \
  <attachment-id> \
  --output ./document.pdf
```

**Best Practice:** Use the index number (1, 2, 3...) from the `attachment list` command rather than the long attachment ID. This is much simpler and less error-prone.

## Gmail Categories & Inbox Organization

Gmail automatically categorizes emails into tabs. Understanding these is crucial for effective inbox cleanup:

### Gmail Categories

- `category:primary` - Personal and important emails (healthcare, friends, family)
- `category:social` - Social networks, media sharing (Facebook, Reddit, Tumblr, LinkedIn)
- `category:promotions` - Deals, offers, marketing (stores, newsletters, sales)
- `category:updates` - Confirmations, receipts, statements (bills, shipping, subscriptions)
- `category:forums` - Online groups and forums

### Inbox Cleanup Strategy

When cleaning up an inbox with hundreds/thousands of emails:

1. **Start with automated/marketing categories first:**
   ```bash
   # Clear Promotions tab completely
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels archive \
     --query "category:promotions in:inbox"

   # Clear Social tab
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels archive \
     --query "category:social in:inbox"

   # Clear Updates tab
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels archive \
     --query "category:updates in:inbox"
   ```

2. **Then tackle Primary tab selectively:**
   - First, identify top senders with sample query
   - Archive automated/newsletter senders in bulk
   - Keep personal correspondence and healthcare emails

3. **Example Primary cleanup workflow:**
   ```bash
   # 1. See what's taking up space
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list \
     --query "category:primary in:inbox" --max 50 --json | \
     jq -r '.[] | .from' | sort | uniq -c | sort -rn

   # 2. Archive automated emails by sender
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels archive \
     --query "category:primary in:inbox (from:noreply@company.com OR from:support@service.com)"

   # 3. Verify what remains
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list \
     --query "category:primary in:inbox"
   ```

### Important Notes

- **Archiving is safe**: Archived emails are NOT deleted, just removed from inbox
- **Always searchable**: Archived emails can still be found via search
- **Use unarchive to restore**: If you archive something by mistake, use the unarchive command
- **Categories ≠ Labels**: `category:primary` is different from `label:INBOX`
  - `in:inbox` searches ALL inbox messages across all categories
  - `category:primary in:inbox` searches only Primary tab messages

## Gmail Search Query Syntax

Use powerful Gmail search operators with the `--query` option:

**Sender/Recipient:**
- `from:user@example.com` - From specific sender
- `to:colleague@company.com` - To specific recipient

**Content:**
- `subject:meeting` - Subject contains "meeting"
- `has:attachment` - Has any attachment
- `filename:pdf` - Has PDF attachment
- `larger:5M` - Larger than 5 MB

**Status:**
- `is:unread` - Unread messages
- `is:read` - Read messages
- `is:starred` - Starred messages
- `is:important` - Marked as important

**Labels:**
- `label:INBOX` or `in:inbox` - In inbox (any category)
- `label:Work/Projects` - Custom label

**Categories:**
- `category:primary` - Primary tab
- `category:social` - Social tab
- `category:promotions` - Promotions tab
- `category:updates` - Updates tab
- `category:forums` - Forums tab

**Dates:**
- `after:2024/01/01` - After specific date
- `before:2024/12/31` - Before specific date
- `newer_than:7d` - Last 7 days
- `older_than:30d` - Older than 30 days

**Combine operators with OR and parentheses:**
```bash
# Multiple senders
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list \
  --query "in:inbox (from:sender1@example.com OR from:sender2@example.com)"

# Complex query
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list \
  --query "from:boss@company.com has:attachment subject:quarterly after:2024/01/01"
```

## Unsubscribe from Mailing Lists

The Gmail plugin supports automatic unsubscribing from mailing lists and newsletters using RFC-compliant List-Unsubscribe headers.

### Unsubscribe from a Specific Message

```bash
# Unsubscribe from the mailing list that sent a message
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail unsubscribe message <message-id>

# Check if a message has unsubscribe capability
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail unsubscribe check <message-id>
```

### Bulk Unsubscribe

Unsubscribe from multiple senders at once:

```bash
# Unsubscribe from all messages from a specific sender
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail unsubscribe bulk \
  --from "newsletter@company.com"

# Bulk unsubscribe using search query
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail unsubscribe bulk \
  --query "category:promotions in:inbox" \
  --max 20

# Unsubscribe from multiple specific senders
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail unsubscribe bulk \
  --query "from:sender1@example.com OR from:sender2@example.com"
```

### How It Works

The unsubscribe command supports multiple methods:

1. **HTTPS/HTTP (One-Click)** - Preferred method using `List-Unsubscribe` and `List-Unsubscribe-Post` headers (RFC 8058)
2. **Mailto** - Sends an unsubscribe email to the address specified in the `List-Unsubscribe` header (RFC 2369)
3. **HTML Link** - Fallback method that extracts and follows unsubscribe links from the email body

### Important Notes

- **Unsubscribing from a message** unsubscribes you from **all future emails** from that sender/mailing list
- Each message contains a unique unsubscribe token - you must use a message ID from that sender
- The command extracts and follows the unsubscribe method automatically
- Bulk operations process one message per unique sender (up to `--max` limit)
- Success/failure is reported for each unsubscribe attempt

### Example Workflow

```bash
# 1. Find promotional emails
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list \
  --query "category:promotions in:inbox" --max 10

# 2. Check if one has unsubscribe
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail unsubscribe check <message-id>

# 3. Unsubscribe from it
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail unsubscribe message <message-id>

# Or bulk unsubscribe from all promotions
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail unsubscribe bulk \
  --query "category:promotions in:inbox" --max 50
```

## Common Workflows

### Email Triage

Help user manage their inbox:

1. Show unread messages:
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --unread --max 20
   ```

2. Read important/urgent ones
3. Draft replies for user approval
4. Organize with labels

### Finding Specific Emails

When user needs to locate emails:

1. Use precise search:
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list \
     --query "from:client@company.com subject:contract after:2024/01/01"
   ```

2. Read and summarize results

### Sending Emails

When user wants to send email:

1. Gather details (recipient, subject, body)
2. Send:
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail send \
     --to colleague@company.com \
     --subject "Meeting follow-up" \
     --body "..." \
     --attach ./notes.pdf
   ```

3. Confirm sent with message ID

### Multi-Account Usage

When user has multiple accounts:

1. Check work inbox:
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list --profile work --unread
   ```

2. Send from personal:
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail send \
     --profile personal \
     --to friend@example.com
   ```

### Downloading Attachments

When user needs files from email:

1. List attachments:
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail attachment list <message-id>
   ```

2. Download needed files:
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail attachment download \
     <message-id> <attachment-id> --output ./file.pdf
   ```

## Setup & Authentication

### Initial Setup

Use the interactive setup wizard:

```bash
/gmail-setup
```

This will:
1. Install Node.js dependencies if needed
2. Guide you through OAuth credentials setup
3. Create your first profile
4. Authenticate with Google
5. Test the connection

### Adding Additional Accounts

To add more Gmail accounts after initial setup:

```bash
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail accounts add work
```

Follow the OAuth flow in your browser, then test:

```bash
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail auth --profile work
```

### OAuth Credentials

**Shared credentials** (recommended):
- File: `google-gmail-oauth.json` (plugin root)
- Used by all profiles by default
- One-time setup

**Per-profile credentials** (optional):
- File: `profiles/<name>/oauth.json`
- Use when accounts need different OAuth apps
- Specify with `--oauth` when adding profile

**Tokens:**
- Stored per profile: `profiles/<name>/token.json`
- Auto-managed and auto-refreshed
- Never commit to git (in .gitignore)

## Error Handling

### "Not authenticated" Error

```bash
# List profiles
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail accounts list

# Add missing profile
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail accounts add <profile-name>

# Test connection
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail auth --profile <profile-name>
```

### "Profile not found" Error

The specified profile doesn't exist. Add it:

```bash
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail accounts add <profile-name>
```

### "Message not found" Error

Verify the message ID by listing messages first:

```bash
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail list
```

## Best Practices

### For Claude

- Always use full script path with `${CLAUDE_PLUGIN_ROOT}`
- Use `--json` for programmatic processing
- Use readable formats (text/markdown) when presenting to user
- Extract message IDs from list command output
- Handle multiple accounts gracefully
- Summarize long email threads
- Offer to organize emails proactively

### Output Formats

- **Text**: Best for reading single messages
- **Markdown**: Best for analysis and processing
- **HTML**: When user specifically needs HTML
- **JSON**: For programmatic use only

### Profile Usage

- Ask which account if ambiguous
- Remember user's typical account
- Always include profile in output context

## Lessons Learned: Bulk Operations & Inbox Cleanup

### Understanding Scope

**Problem:** User sees different message counts in Gmail web interface vs. API results.

**Solution:** Understand the difference between:
- `in:inbox` - ALL inbox messages across all categories (~3000+ messages)
- `category:primary in:inbox` - Only Primary tab messages (~500 messages)
- `category:social in:inbox` - Only Social tab messages
- Default list queries are paginated (limited results)

**Best Practice:** When user asks about "inbox count", clarify which tab/category they mean!

### Iterative Cleanup is Not Comprehensive

**Problem:** Running multiple targeted archive commands (by specific senders) may miss many messages from other senders.

**Solution:** Use category-based bulk operations:
```bash
# Instead of targeting 20 individual senders...
# Archive the entire category at once
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels archive \
  --query "category:promotions in:inbox"
```

**Best Practice:**
1. Clear entire categories first (social, promotions, updates)
2. Then selectively clean Primary with targeted sender queries
3. Use `--query` without sender filters to see ALL messages in a category

### Accidental Archives Happen

**Problem:** When developing/testing bulk operations, important emails may get archived.

**Solution:** Always have an unarchive command ready:
```bash
# Restore healthcare emails
${CLAUDE_PLUGIN_ROOT}/skills/google-gmail/scripts/google-gmail labels unarchive \
  --query "from:doctor@hospital.com OR from:therapist@clinic.com"
```

**Best Practice:**
1. Before bulk archive, ask user which senders to keep
2. Test with smaller queries first (`--max 10`)
3. Remind user that archiving is reversible
4. Keep unarchive command readily available

### Pagination and Batch Operations

**Problem:** Early implementations only processed first 500 messages, missing thousands more.

**Solution:** Always use proper pagination in bulk operations:
- Use `do/while` loops with `nextPageToken`
- Process ALL pages, not just the first one
- Use batch API calls (1000 at a time) for efficiency

**Best Practice:**
- Show progress to user (`Found 1200 messages...`)
- Use batch operations instead of one-by-one
- Don't assume query results are complete without pagination

### Query Complexity

**Problem:** Long sender lists make queries unwieldy and hard to maintain.

**Solution:** Use OR operators for multiple senders:
```bash
--query "in:inbox (from:sender1@example.com OR from:sender2@example.com OR from:sender3@example.com)"
```

**Best Practice:**
- Group related senders in single queries (all receipts, all newsletters, etc.)
- Use category filters when possible instead of sender lists
- Document which senders should be kept vs. archived
