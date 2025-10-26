/**
 * MemoryService - Wrapper around mem0ai SDK
 *
 * Provides a simple interface for adding and searching memories
 * using the mem0ai npm package directly.
 */

import { Memory } from 'mem0ai/oss';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MemoryService {
  constructor() {
    this.memory = null;
    this.initialized = false;
  }

  /**
   * Load configuration from config.json
   * Merges user config with plugin defaults
   */
  async loadConfig() {
    // Load plugin default config
    const pluginConfigPath = join(dirname(dirname(__dirname)), 'config.json');
    const defaultContent = await readFile(pluginConfigPath, 'utf-8');
    const defaultConfig = JSON.parse(defaultContent);

    // Try to load user config and merge
    const userConfigPath = join(homedir(), '.claude', 'plugins', 'ada-memory', 'config.json');
    try {
      const userContent = await readFile(userConfigPath, 'utf-8');
      const userConfig = JSON.parse(userContent);

      // Deep merge user config into default config
      return {
        ...defaultConfig,
        ...userConfig,
        storage: { ...defaultConfig.storage, ...(userConfig.storage || {}) },
        mem0: {
          ...defaultConfig.mem0,
          ...(userConfig.mem0 || {}),
          llm: { ...defaultConfig.mem0.llm, ...(userConfig.mem0?.llm || {}) },
          embedder: { ...defaultConfig.mem0.embedder, ...(userConfig.mem0?.embedder || {}) }
        }
      };
    } catch {
      // No user config, use defaults
      return defaultConfig;
    }
  }

  /**
   * Expand ~ in paths to home directory
   */
  expandPath(path) {
    if (path.startsWith('~/')) {
      return join(homedir(), path.slice(2));
    }
    return path;
  }

  /**
   * Initialize mem0 with configuration
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const config = await this.loadConfig();

      // Get API key from config or environment
      const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('OPENAI_API_KEY not found in config or environment - memory features disabled');
        console.error('Set it in ~/.claude/plugins/ada-memory/config.json or as environment variable');
        return;
      }

      // Expand paths
      const historyDbPath = this.expandPath(config.storage.mem0HistoryPath);
      const vectorDbPath = this.expandPath(config.storage.mem0VectorPath);

      // Ensure storage directory exists
      const storageDir = dirname(historyDbPath);
      await mkdir(storageDir, { recursive: true });

      // Initialize mem0
      this.memory = new Memory({
        llm: {
          provider: config.mem0.llm.provider,
          config: {
            model: config.mem0.llm.model,
            apiKey,
            modelProperties: {
              temperature: 0.1
            }
          }
        },
        embedder: {
          provider: config.mem0.embedder.provider,
          config: {
            model: config.mem0.embedder.model,
            apiKey
          }
        },
        vectorStore: {
          provider: config.mem0.vectorStore.provider,
          config: {
            dbPath: vectorDbPath,
            dimension: config.mem0.vectorStore.dimension,
            collectionName: 'memories'
          }
        },
        historyStore: {
          provider: 'sqlite',
          config: {
            historyDbPath
          }
        }
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize MemoryService:', error.message);
    }
  }

  /**
   * Search for relevant memories
   */
  async search(query, userId = 'em', limit = 10) {
    await this.initialize();

    if (!this.memory) {
      return [];
    }

    try {
      const results = await this.memory.search(query, { userId, limit });

      // Transform mem0 results to our format
      return (results.results || []).map(result => ({
        id: result.id,
        content: result.memory || result.content || '',
        category: result.metadata?.category,
        confidence: result.score ? Math.round(result.score * 100) : undefined,
        similarity: result.score || 0,
        metadata: result.metadata
      }));
    } catch (error) {
      console.error('Failed to search memories:', error.message);
      return [];
    }
  }

  /**
   * Add memories from conversation
   */
  async add(messages, userId = 'em') {
    await this.initialize();

    if (!this.memory) {
      return;
    }

    try {
      // Format messages for mem0
      const formattedMessages = messages.map(msg => {
        if (msg.type === 'user') {
          const content = typeof msg.message?.content === 'string'
            ? msg.message.content
            : '';
          return { role: 'user', content };
        } else if (msg.type === 'assistant') {
          const contentBlocks = msg.message?.content || [];
          const textContent = Array.isArray(contentBlocks)
            ? contentBlocks
                .filter(block => block.type === 'text')
                .map(block => block.text)
                .join('\n')
            : '';
          return { role: 'assistant', content: textContent };
        }
        return null;
      }).filter(msg => msg !== null);

      const result = await this.memory.add(formattedMessages, {
        userId,
        metadata: {
          source: 'claude-code',
          timestamp: new Date().toISOString()
        }
      });

      return result;
    } catch (error) {
      console.error('[MemoryService] Failed to add memories:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const memoryService = new MemoryService();
