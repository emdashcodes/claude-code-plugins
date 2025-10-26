/**
 * SessionCache - SQLite-based session memory cache
 *
 * Tracks which memories have been injected into each session
 * to avoid duplicate injections within the same conversation.
 */

import Database from 'better-sqlite3';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SessionCache {
  constructor() {
    this.db = null;
  }

  /**
   * Load configuration to get session cache path
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
        storage: { ...defaultConfig.storage, ...(userConfig.storage || {}) }
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
   * Initialize database connection
   */
  async initialize() {
    if (this.db) return;

    try {
      const config = await this.loadConfig();
      const dbPath = this.expandPath(config.storage.sessionCachePath);

      // Ensure directory exists
      const dir = dirname(dbPath);
      mkdirSync(dir, { recursive: true });

      // Open database
      this.db = new Database(dbPath);

      // Create tables if they don't exist
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS session_cache (
          session_id TEXT NOT NULL,
          memory_id TEXT NOT NULL,
          injected_at INTEGER NOT NULL,
          PRIMARY KEY (session_id, memory_id)
        );
        CREATE INDEX IF NOT EXISTS idx_session_id ON session_cache(session_id);

        CREATE TABLE IF NOT EXISTS session_stats (
          session_id TEXT PRIMARY KEY,
          message_count INTEGER DEFAULT 0,
          last_extraction_at INTEGER,
          created_at INTEGER NOT NULL
        );
      `);
    } catch (error) {
      console.error('Failed to initialize SessionCache:', error.message);
    }
  }

  /**
   * Check which memories have already been injected in this session
   * Returns list of memory IDs that are NEW (not yet injected)
   */
  async checkCache(sessionId, memoryIds) {
    await this.initialize();

    if (!this.db || memoryIds.length === 0) {
      return memoryIds;
    }

    try {
      // Get already-injected memories for this session
      const placeholders = memoryIds.map(() => '?').join(',');
      const stmt = this.db.prepare(`
        SELECT memory_id FROM session_cache
        WHERE session_id = ? AND memory_id IN (${placeholders})
      `);

      const cached = stmt.all(sessionId, ...memoryIds).map(row => row.memory_id);

      // Filter to only NEW memories
      const newMemoryIds = memoryIds.filter(id => !cached.includes(id));

      // Add new memories to cache
      if (newMemoryIds.length > 0) {
        const insertStmt = this.db.prepare(`
          INSERT OR IGNORE INTO session_cache (session_id, memory_id, injected_at)
          VALUES (?, ?, ?)
        `);

        const now = Date.now();
        const insertMany = this.db.transaction((ids) => {
          for (const id of ids) {
            insertStmt.run(sessionId, id, now);
          }
        });

        insertMany(newMemoryIds);
      }

      return newMemoryIds;
    } catch (error) {
      console.error('Session cache check failed:', error.message);
      // Fail open - return all memories if cache fails
      return memoryIds;
    }
  }

  /**
   * Clean up cache entries for a specific session
   * Called by SessionEnd hook
   */
  async cleanupSession(sessionId) {
    await this.initialize();

    if (!this.db) {
      return;
    }

    try {
      const cacheStmt = this.db.prepare('DELETE FROM session_cache WHERE session_id = ?');
      const cacheResult = cacheStmt.run(sessionId);

      const statsStmt = this.db.prepare('DELETE FROM session_stats WHERE session_id = ?');
      statsStmt.run(sessionId);

      console.log(`Cleaned up ${cacheResult.changes} cache entries for session ${sessionId}`);
    } catch (error) {
      console.error('Session cleanup failed:', error.message);
    }
  }

  /**
   * Increment message count for session and return new count
   */
  async incrementMessageCount(sessionId) {
    await this.initialize();

    if (!this.db) {
      return 1;
    }

    try {
      const now = Date.now();

      // Insert or update session stats
      const stmt = this.db.prepare(`
        INSERT INTO session_stats (session_id, message_count, created_at)
        VALUES (?, 1, ?)
        ON CONFLICT(session_id) DO UPDATE SET
          message_count = message_count + 1
      `);

      stmt.run(sessionId, now);

      // Get current count
      const countStmt = this.db.prepare('SELECT message_count FROM session_stats WHERE session_id = ?');
      const result = countStmt.get(sessionId);

      return result?.message_count || 1;
    } catch (error) {
      console.error('Failed to increment message count:', error.message);
      return 1;
    }
  }

  /**
   * Check if extraction should be triggered based on message count threshold
   */
  async shouldExtract(sessionId, threshold = 5) {
    await this.initialize();

    if (!this.db) {
      return false;
    }

    try {
      const stmt = this.db.prepare('SELECT message_count, last_extraction_at FROM session_stats WHERE session_id = ?');
      const result = stmt.get(sessionId);

      if (!result) {
        return false; // No messages yet
      }

      // Extract every N messages
      return result.message_count % threshold === 0;
    } catch (error) {
      console.error('Failed to check extraction threshold:', error.message);
      return false;
    }
  }

  /**
   * Mark that extraction has been triggered for this session
   */
  async markExtracted(sessionId) {
    await this.initialize();

    if (!this.db) {
      return;
    }

    try {
      const now = Date.now();
      const stmt = this.db.prepare('UPDATE session_stats SET last_extraction_at = ? WHERE session_id = ?');
      stmt.run(now, sessionId);
    } catch (error) {
      console.error('Failed to mark extraction:', error.message);
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const sessionCache = new SessionCache();
