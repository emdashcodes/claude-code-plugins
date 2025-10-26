# Ada Memory Plugin

Intelligent memory system that automatically extracts and injects relevant context from your Claude Code conversation history using semantic search and vector embeddings.

## Features

- **Automatic Extraction** - Extracts memories every 5 messages using mem0 AI
- **Semantic Search** - Retrieves relevant context based on your current prompt
- **Session Caching** - Prevents duplicate injections within same session
- **SQLite Storage** - All data stored locally in `~/.claude/mem0/`
- **Zero Configuration** - Works out of the box with sensible defaults

## Installation

### From Marketplace

```bash
# Add the marketplace (if not already added)
/plugin marketplace add emdashcodes/claude-code-plugins

# Install the plugin
/plugin install ada-memory@emdashcodes-claude-code-plugins
```

### Post-Installation Setup

**Important:** This plugin requires Node.js dependencies to be installed.

```bash
# Navigate to the plugin directory
cd ~/.claude/plugins/marketplaces/emdashcodes-claude-code-plugins/plugins/ada-memory

# Run the installation script
./install.sh
```

Or manually install dependencies:

```bash
npm install
```

### Configuration

The plugin requires an OpenAI API key for mem0's LLM and embedding models.

Create `~/.claude/plugins/ada-memory/config.json`:

```json
{
  "apiKey": "sk-your-openai-api-key-here"
}
```

**Note:** If you don't want to store your API key in a file, you can set it as an environment variable:

```bash
export OPENAI_API_KEY="sk-your-openai-api-key-here"
```

## How It Works

### Memory Extraction

The plugin monitors your conversations and automatically extracts factual information:

1. **Message Counting** - Tracks messages per session
2. **Threshold Trigger** - Extraction runs every 5 messages (configurable)
3. **AI Analysis** - mem0 uses GPT-4o-mini to extract facts, preferences, and knowledge
4. **Vector Storage** - Memories stored with semantic embeddings for retrieval

### Memory Injection

When you submit a prompt, the plugin:

1. **Semantic Search** - Searches for relevant memories using vector similarity
2. **Session Deduplication** - Filters out memories already shown in current session
3. **Context Injection** - Adds relevant memories as additional context before your message

### Session Cleanup

When a session ends, the plugin automatically:

1. **Final Extraction** - Extracts memories from any remaining messages (even if < 5 messages since last extraction)
2. **Cache Cleanup** - Cleans up session cache to free resources

This ensures no conversation context is lost, even in short sessions.

## Storage

All data is stored locally in `~/.claude/mem0/`:

```
~/.claude/mem0/
├── history.db          # Memory history (mem0)
├── vectors.db          # Vector embeddings (SQLite)
├── sessions.db         # Session cache and stats
└── logs/
    ├── injections.log  # Memory injection logs
    └── extractions.log # Memory extraction logs
```

## Configuration Options

Create `~/.claude/plugins/ada-memory/config.json` to customize:

```json
{
  "apiKey": "sk-your-openai-api-key",
  "storage": {
    "mem0HistoryPath": "~/.claude/mem0/history.db",
    "mem0VectorPath": "~/.claude/mem0/vectors.db",
    "sessionCachePath": "~/.claude/mem0/sessions.db"
  },
  "mem0": {
    "llm": {
      "provider": "openai",
      "model": "gpt-4o-mini"
    },
    "embedder": {
      "provider": "openai",
      "model": "text-embedding-3-small"
    },
    "vectorStore": {
      "provider": "memory",
      "dimension": 1536
    }
  }
}
```

## Viewing Logs

### Injection Logs

See what memories were injected for each prompt:

```bash
tail -f ~/.claude/mem0/logs/injections.log | jq '.'
```

**Example output:**

```json
{
  "timestamp": "2025-10-26T20:30:15.123Z",
  "sessionId": "abc123",
  "action": "injected",
  "prompt": "How should I structure my React components?",
  "memoriesInjected": 3,
  "memories": [
    {
      "content": "User prefers functional components with hooks over class components",
      "category": "preferences",
      "confidence": 95,
      "similarity": "87.3%"
    }
  ]
}
```

### Extraction Logs

Monitor when memories are extracted:

```bash
tail -f ~/.claude/mem0/logs/extractions.log | jq '.'
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Claude Code Session                    │
│                                                         │
│  User Message → UserPromptSubmit Hook                  │
│                        ↓                                │
│                 inject-memories.sh                      │
│  1. Search relevant memories (semantic)                │
│  2. Filter by session cache                            │
│  3. Inject as additionalContext                        │
│  4. Increment message counter                          │
│  5. Trigger extraction if threshold reached            │
│                        ↓                                │
│                 extract.js (background)                 │
│  1. Fetch conversation messages                        │
│  2. Call mem0 to extract memories                      │
│  3. Store with vector embeddings                       │
│                        ↓                                │
│                    SessionEnd Hook                      │
│                 cleanup-session.sh                      │
│  1. Trigger final extraction (any remaining msgs)      │
│  2. Clear session cache                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  ~/.claude/mem0/                        │
│                                                         │
│  history.db    - Memory facts and metadata             │
│  vectors.db    - Vector embeddings (SQLite)            │
│  sessions.db   - Session stats and cache               │
└─────────────────────────────────────────────────────────┘
```

## Plugin Structure

```
ada-memory/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── hooks/
│   └── hooks.json               # Hook configuration
├── src/
│   ├── lib/
│   │   ├── MemoryService.js     # mem0 wrapper
│   │   └── SessionCache.js      # Session deduplication
│   └── hooks/
│       ├── inject.js            # Memory injection logic
│       ├── extract.js           # Memory extraction logic
│       └── cleanup-session.js   # Session cleanup logic
├── bin/
│   ├── inject-memories.sh       # Injection hook wrapper
│   ├── extract.sh               # Extraction trigger wrapper
│   └── cleanup-session.sh       # Cleanup hook wrapper
├── config.json                  # Default configuration
├── package.json                 # Node.js dependencies
├── install.sh                   # Installation script
└── README.md                    # This file
```

## Troubleshooting

### Plugin Not Working

1. **Check dependencies are installed:**
   ```bash
   ls ~/.claude/plugins/marketplaces/emdashcodes-claude-code-plugins/plugins/ada-memory/node_modules
   ```

2. **Verify API key is configured:**
   ```bash
   cat ~/.claude/plugins/ada-memory/config.json
   ```

3. **Check plugin is installed:**
   ```bash
   cat ~/.claude/plugins/installed_plugins.json | jq '.plugins | keys'
   ```

### No Memories Being Extracted

1. **Check message count threshold:**
   Extraction only runs every 5 messages. Send at least 5 messages to trigger.

2. **Check extraction logs:**
   ```bash
   tail ~/.claude/mem0/logs/extractions.log
   ```

3. **Verify mem0 is working:**
   ```bash
   cd ~/.claude/plugins/marketplaces/emdashcodes-claude-code-plugins/plugins/ada-memory
   node -e "import('./src/lib/MemoryService.js').then(m => m.memoryService.initialize())"
   ```

### No Memories Being Injected

1. **Check if memories exist:**
   ```bash
   sqlite3 ~/.claude/mem0/history.db "SELECT COUNT(*) FROM memory_history;"
   ```

2. **Check injection logs:**
   ```bash
   tail ~/.claude/mem0/logs/injections.log
   ```

3. **Test injection script directly:**
   ```bash
   echo '{"session_id":"test","prompt":"test prompt"}' | \
     ~/.claude/plugins/marketplaces/emdashcodes-claude-code-plugins/plugins/ada-memory/bin/inject-memories.sh
   ```

## Advanced Configuration

### Extraction Threshold

To change how often memories are extracted, modify `EXTRACTION_THRESHOLD` in `src/hooks/inject.js`:

```javascript
const EXTRACTION_THRESHOLD = 5; // Extract every 5 messages
```

### Memory Limit

To change how many memories are retrieved, modify `MEMORY_LIMIT` in `src/hooks/inject.js`:

```javascript
const MEMORY_LIMIT = 10; // Top 10 most relevant memories
```

### Custom Storage Paths

Set custom paths in `~/.claude/plugins/ada-memory/config.json`:

```json
{
  "storage": {
    "mem0HistoryPath": "/custom/path/history.db",
    "mem0VectorPath": "/custom/path/vectors.db",
    "sessionCachePath": "/custom/path/sessions.db"
  }
}
```

## Development

### Running Tests

```bash
# Test memory service initialization
npm test

# Test injection manually
echo '{"session_id":"test-123","prompt":"How do I use React?"}' | \
  node src/hooks/inject.js

# Test extraction manually
echo '{"session_id":"test-123"}' | node src/hooks/extract.js
```

### Debugging

Enable debug logging by setting environment variable:

```bash
export DEBUG=ada-memory:*
```

## Credits

- Built with [mem0ai](https://mem0.ai/) - Memory layer for AI applications
- Uses OpenAI for LLM and embeddings
- SQLite for local vector storage via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

## License

MIT License - See LICENSE file for details
