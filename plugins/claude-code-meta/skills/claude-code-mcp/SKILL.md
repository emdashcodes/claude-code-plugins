---
name: claude-code-mcp
description: This skill should be used when configuring, installing, or managing MCP (Model Context Protocol) servers in Claude Code. Use when users need to connect Claude Code to external tools, databases, APIs, or services through MCP integration.
---

# Claude Code MCP Configuration

Guide Claude through configuring and managing MCP (Model Context Protocol) servers to connect Claude Code with external tools, databases, and services.

## Purpose

MCP servers enable Claude Code to interact with external tools and data sources through a standardized protocol. This skill helps install, configure, and manage MCP servers across different scopes (local, project, user), authenticate with remote services, and troubleshoot connection issues.

## When to Use This Skill

Use this skill when:

- Installing MCP servers (HTTP, SSE, or stdio transport)
- Configuring MCP server authentication and environment variables
- Managing MCP server scopes (local, project, user)
- Troubleshooting MCP server connectivity or authentication issues
- Setting up team-wide MCP server configurations
- Importing MCP servers from Claude Desktop
- Using MCP resources and prompts in conversations

**Do NOT use this skill for:**

- Creating or building MCP servers (use MCP SDK documentation instead)
- Writing MCP server code (this skill is for configuration only)

## MCP Server Transports

MCP servers can connect using three transport mechanisms:

### HTTP Transport (Recommended)

Best for cloud-based services with REST APIs.

**Basic syntax:**

```bash
claude mcp add --transport http <name> <url>
```

**Examples:**

```bash
# Simple HTTP server
claude mcp add --transport http notion https://mcp.notion.com/mcp

# With authentication header
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"

# With custom headers
claude mcp add --transport http custom-api https://api.example.com/mcp \
  --header "X-API-Key: key123" \
  --header "X-Custom-Header: value"
```

### SSE Transport (Deprecated)

Server-Sent Events transport. Use HTTP where available.

**Basic syntax:**

```bash
claude mcp add --transport sse <name> <url>
```

**Example:**

```bash
claude mcp add --transport sse asana https://mcp.asana.com/sse
```

### Stdio Transport

For local processes needing direct system access.

**Basic syntax:**

```bash
claude mcp add --transport stdio <name> [--env KEY=value] -- <command> [args...]
```

**Examples:**

```bash
# NPM package
claude mcp add --transport stdio airtable \
  --env AIRTABLE_API_KEY=YOUR_KEY \
  -- npx -y airtable-mcp-server

# Local script
claude mcp add --transport stdio custom-tool \
  --env CONFIG_PATH=/path/to/config \
  -- /usr/local/bin/custom-mcp-server

# Python package
claude mcp add --transport stdio python-tool \
  -- python -m my_mcp_server
```

**Important:** Use `--` to separate Claude CLI flags from MCP server command/arguments.

## MCP Server Scopes

MCP servers can be configured at three different scopes:

### Local Scope (Default)

- **Location:** Project `.mcp.json` (gitignored)
- **Visibility:** Current project only
- **Use case:** Private configurations, testing, local development
- **Command:** `claude mcp add --scope local` (or omit `--scope`)

### Project Scope

- **Location:** Project `.mcp.json` (committed to git)
- **Visibility:** All team members using the project
- **Use case:** Team-shared integrations, required tooling
- **Command:** `claude mcp add --scope project`

### User Scope

- **Location:** `~/.claude/mcp.json`
- **Visibility:** All projects for current user
- **Use case:** Personal tools, cross-project services
- **Command:** `claude mcp add --scope user`

**Scope precedence:** Local > Project > User

When the same server name exists in multiple scopes, the highest precedence wins.

## MCP Configuration Workflow

To configure an MCP server, follow this process:

### Step 1: Identify Requirements

Determine what information is needed:

1. **Transport type** - HTTP, SSE, or stdio?
2. **Server URL or command** - Where is the server?
3. **Authentication** - API keys, OAuth, headers?
4. **Environment variables** - Configuration needed?
5. **Scope** - Local, project, or user?

Example questions to ask:

- "What service are you connecting to?"
- "Do you have an API key or authentication token?"
- "Should this be available to your whole team (project scope) or just you (local/user scope)?"
- "Is this a cloud service (HTTP) or local tool (stdio)?"

### Step 2: Determine Transport and Scope

Based on the requirements:

**Choose HTTP when:**

- Connecting to cloud-based REST APIs
- Service provides an MCP endpoint URL
- No local process needed

**Choose stdio when:**

- Running local tools or scripts
- Need direct system access
- Using NPM packages or local executables

**Choose SSE when:**

- Service only supports SSE transport
- HTTP is not available (prefer HTTP if both exist)

**Choose scope based on:**

- **Local:** Testing, temporary, contains secrets not in env vars
- **Project:** Team needs access, shared configuration
- **User:** Personal tool across all projects

### Step 3: Install the MCP Server

Use the appropriate `claude mcp add` command based on transport and scope.

**HTTP example:**

```bash
claude mcp add --transport http --scope project \
  notion https://mcp.notion.com/mcp
```

**Stdio example:**

```bash
claude mcp add --transport stdio --scope user \
  airtable \
  --env AIRTABLE_API_KEY=${AIRTABLE_API_KEY} \
  -- npx -y airtable-mcp-server
```

**With multiple environment variables:**

```bash
claude mcp add --transport stdio --scope project \
  custom-db \
  --env DB_HOST=${DB_HOST} \
  --env DB_PORT=${DB_PORT:-5432} \
  --env DB_NAME=analytics \
  -- /usr/local/bin/db-mcp-server
```

### Step 4: Verify Installation

After installation:

1. **List servers:**

   ```bash
   claude mcp list
   ```

2. **Get server details:**

   ```bash
   claude mcp get <server-name>
   ```

3. **Test in Claude Code:**
   - Start Claude Code
   - Ask the user to run `/mcp` to see server status
   - Try using a tool from the server

### Step 5: Authenticate (if required)

Some servers require OAuth or additional authentication:

1. **Start Claude Code**
2. **Run `/mcp` command**
3. **Select the server requiring authentication**
4. **Follow browser authentication flow**
5. **Verify authentication succeeded in `/mcp` menu**

Tokens are securely stored and auto-refreshed. Clear with "Clear authentication" from `/mcp` menu.

### Step 6: Troubleshoot if Needed

If the server isn't working:

**Check server status:**

```bash
claude mcp list
```

**Get detailed information:**

```bash
claude mcp get <server-name>
```

**Common issues:**

1. **Server not starting (stdio)**
   - Verify command is executable: `which npx`, `which python`
   - Check environment variables are set
   - Test command independently
   - On Windows, use `cmd /c` wrapper: `-- cmd /c npx -y package`

2. **Authentication failures (HTTP/SSE)**
   - Verify API keys are correct
   - Check headers are properly formatted
   - Use `/mcp` to re-authenticate OAuth servers
   - Verify URL is correct and accessible

3. **Server timeout**
   - Increase timeout: `MCP_TIMEOUT=10000 claude`
   - Check network connectivity
   - Verify server is responding

4. **Output limit warnings**
   - Increase output limit: `export MAX_MCP_OUTPUT_TOKENS=50000`
   - Default is 25,000 tokens
   - Warning at 10,000 tokens

For additional details on popular MCP servers and their specific configurations, consult the [official MCP documentation](https://docs.claude.com/en/docs/claude-code/mcp).

## Common MCP Server Patterns

### Cloud Service with API Key (HTTP)

```bash
claude mcp add --transport http --scope user \
  service-name https://api.service.com/mcp \
  --header "Authorization: Bearer ${API_KEY}"
```

### Local NPM Package (stdio)

```bash
claude mcp add --transport stdio --scope user \
  package-name \
  --env API_KEY=${API_KEY} \
  -- npx -y @org/mcp-package
```

### Team Database Access (stdio, project scope)

```bash
claude mcp add --transport stdio --scope project \
  analytics-db \
  --env DB_URL=${ANALYTICS_DB_URL} \
  -- npx -y @bytebase/dbhub
```

### Personal Tool Across Projects (stdio, user scope)

```bash
claude mcp add --transport stdio --scope user \
  my-tool \
  -- /usr/local/bin/my-mcp-tool
```

## Environment Variable Handling

MCP configurations support environment variable expansion:

**Syntax:**

- `${VAR}` - Required variable (error if not set)
- `${VAR:-default}` - Optional with default value

**Examples:**

```bash
# Required variable
--env DB_HOST=${DB_HOST}

# Optional with default
--env DB_PORT=${DB_PORT:-5432}

# Literal value
--env ENVIRONMENT=production

# Multiple variables
--env API_URL=${API_URL} \
--env API_KEY=${API_KEY} \
--env TIMEOUT=${TIMEOUT:-30}
```

**Setting environment variables:**

```bash
# In shell (temporary)
export API_KEY=your-key-here
claude mcp add --transport stdio tool --env API_KEY=${API_KEY} -- npx tool

# In .env file (project)
echo "API_KEY=your-key-here" >> .env
source .env
claude mcp add ...

# In shell profile (permanent)
echo 'export API_KEY=your-key-here' >> ~/.zshrc
source ~/.zshrc
```

## Managing MCP Servers

### List All Servers

```bash
claude mcp list
```

Shows all configured servers across all scopes with status.

### Get Server Details

```bash
claude mcp get <server-name>
```

Shows configuration, scope, transport type, and status.

### Remove a Server

```bash
claude mcp remove <server-name>
```

Removes from the scope where it was added.

### Check Status in Claude Code

Within Claude Code, use `/mcp` command to:

- View all connected servers
- See authentication status
- Re-authenticate OAuth servers
- Clear authentication tokens

## Using MCP Tools in Conversations

Once servers are connected:

### Access MCP Tools

Claude Code automatically sees MCP tools. Just ask:

```
> "Check Sentry for errors in the last 24 hours"
> "Create a GitHub issue for this bug"
> "Query the database for user count"
```

### Use MCP Resources

Type `@` to list available resources:

```
> "Analyze @github:issue://123"
> "Review @notion:page://abc123"
```

Resources are auto-fetched and attached to context.

### Use MCP Prompts as Slash Commands

MCP prompts appear as slash commands:

```
/mcp__github__list_prs
/mcp__github__pr_review 456
/mcp__jira__create_issue "Bug in login" high
```

## Plugin-Provided MCP Servers

Plugins can bundle MCP servers that start automatically:

**Plugin configuration (`.mcp.json` in plugin root):**

```json
{
  "database-tools": {
    "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
    "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
    "env": {
      "DB_URL": "${DB_URL}"
    }
  }
}
```

**Key points:**

- Managed via plugin install/uninstall, not `/mcp` commands
- Use `${CLAUDE_PLUGIN_ROOT}` for plugin-relative paths
- Start automatically when plugin is enabled
- Appear in `/mcp` menu but managed by plugin

## Team Configuration Best Practices

For team-wide MCP server setup:

### Project Scope Configuration

1. **Use project scope for shared integrations:**

   ```bash
   claude mcp add --scope project \
     github https://api.githubcopilot.com/mcp/
   ```

2. **Commit `.mcp.json` to repository**
3. **Document required environment variables in README:**

   ```markdown
   ## Required Environment Variables
   - `GITHUB_TOKEN` - GitHub personal access token
   - `JIRA_API_KEY` - Jira API key
   ```

4. **Team members set environment variables locally:**

   ```bash
   export GITHUB_TOKEN=ghp_xxxx
   export JIRA_API_KEY=xxxx
   ```

### Environment Variable Management

**For sensitive values:**

- Never commit actual secrets to `.mcp.json`
- Use `${VAR}` expansion
- Document required variables
- Use `.env` files (gitignored) for local values

**For non-sensitive values:**

- Can specify directly in configuration
- Example: `--env ENVIRONMENT=production`

## Importing from Claude Desktop

Import existing MCP servers from Claude Desktop:

```bash
claude mcp add-from-claude-desktop
```

Interactively select which servers to import. Configurations are copied to appropriate scope.

## Advanced: JSON Configuration

Add servers via JSON for programmatic setup:

```bash
# HTTP server
claude mcp add-json weather-api '{
  "type": "http",
  "url": "https://api.weather.com/mcp",
  "headers": {
    "Authorization": "Bearer token"
  }
}'

# Stdio server
claude mcp add-json db-tool '{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@tool/mcp"],
  "env": {
    "DB_URL": "${DB_URL}"
  }
}'
```

## Additional Resources

For additional information about MCP:

- **Popular MCP Servers**: Browse the [MCP servers repository](https://github.com/modelcontextprotocol/servers) for community-maintained servers
- **Building MCP Servers**: See the [MCP SDK documentation](https://modelcontextprotocol.io/quickstart/server) to create your own servers
- **Official Documentation**: Consult the [Claude Code MCP guide](https://docs.claude.com/en/docs/claude-code/mcp) for complete reference documentation

## Troubleshooting

### Server Not Appearing

**Symptoms:** Server added but not visible in `/mcp`

**Solutions:**

- Restart Claude Code after adding server
- Verify server was added: `claude mcp list`
- Check correct scope: `claude mcp get <name>`
- For stdio: verify command is executable

### Authentication Failures

**Symptoms:** OAuth flow fails or API returns 401/403

**Solutions:**

- Use `/mcp` to re-authenticate
- Verify API key is correct
- Check header format: `"Authorization: Bearer token"`
- Clear and re-authenticate: `/mcp` → Clear authentication

### Command Not Found (stdio)

**Symptoms:** "command not found" for stdio servers

**Solutions:**

- Verify command exists: `which npx`, `which python`
- Use full path: `-- /usr/local/bin/tool`
- On Windows: use `-- cmd /c npx -y package`
- Check PATH environment variable

### Environment Variable Not Expanded

**Symptoms:** `${VAR}` appears literally in configuration

**Solutions:**

- Verify variable is exported: `echo $VAR`
- Set before running command: `export VAR=value`
- Use shell substitution if needed: `--env VAR=$VAR` (expanded by shell)

### Server Timeout

**Symptoms:** Server connection times out

**Solutions:**

- Increase timeout: `MCP_TIMEOUT=10000 claude`
- Check network connectivity
- Verify server URL is correct
- For stdio: check command starts quickly

## Integration with Other Skills

This skill works alongside other claude-code-meta skills:

- **Use `claude-code-plugins`** - For bundling MCP servers in plugins

Activate these skills when working on plugin-provided MCP servers or automated MCP configuration workflows.
