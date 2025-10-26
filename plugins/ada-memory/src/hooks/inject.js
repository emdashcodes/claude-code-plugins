#!/usr/bin/env node
/**
 * Memory Injection Hook for Claude Code
 *
 * Retrieves relevant memories using mem0ai directly
 * and injects them as additional context for the user prompt.
 *
 * Features:
 * - Uses mem0ai npm package directly (no server dependency)
 * - Session-based caching via SQLite (prevents duplicate injections)
 * - mem0 handles vector similarity, extraction, and deduplication
 */

import { createInterface } from 'readline';
import { spawn } from 'child_process';
import { mkdir, appendFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { memoryService } from '../lib/MemoryService.js';
import { sessionCache } from '../lib/SessionCache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const MEMORY_LIMIT = 10; // Top N memories to retrieve
const EXTRACTION_THRESHOLD = 5; // Trigger extraction every N messages

// Logging
const LOG_DIR = join(homedir(), '.claude', 'mem0', 'logs');
const LOG_FILE = join(LOG_DIR, 'injections.log');

/**
 * Read JSON input from stdin
 */
async function readInput() {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin });
    let data = '';

    rl.on('line', (line) => {
      data += line;
    });

    rl.on('close', () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        console.error('Failed to parse input JSON:', error.message);
        process.exit(1);
      }
    });
  });
}

/**
 * Format memories as markdown context
 */
function formatMemories(memories) {
  if (memories.length === 0) return '';

  const lines = ['## Relevant Context from Memory', ''];

  // Group by category if available
  const categorized = {};
  const uncategorized = [];

  for (const memory of memories) {
    if (memory.category) {
      if (!categorized[memory.category]) {
        categorized[memory.category] = [];
      }
      categorized[memory.category].push(memory);
    } else {
      uncategorized.push(memory);
    }
  }

  // Output categorized memories
  for (const [category, items] of Object.entries(categorized)) {
    lines.push(`### ${category.replace(/_/g, ' ')}`);
    for (const item of items) {
      const confidenceStr = item.confidence ? ` (${item.confidence}% confidence)` : '';
      lines.push(`- ${item.content}${confidenceStr}`);
    }
    lines.push('');
  }

  // Output uncategorized memories
  if (uncategorized.length > 0) {
    lines.push(`### General`);
    for (const item of uncategorized) {
      const confidenceStr = item.confidence ? ` (${item.confidence}% confidence)` : '';
      lines.push(`- ${item.content}${confidenceStr}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Log injection details to file
 */
async function logInjection(sessionId, prompt, memories) {
  try {
    await mkdir(LOG_DIR, { recursive: true });

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      sessionId,
      action: 'injected',
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      memoriesInjected: memories.length,
      memories: memories.map(m => ({
        content: m.content,
        category: m.category,
        confidence: m.confidence,
        similarity: m.similarity ? `${(m.similarity * 100).toFixed(1)}%` : undefined,
      })),
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    await appendFile(LOG_FILE, logLine);
  } catch (error) {
    // Don't fail the injection if logging fails
    console.error('Logging failed:', error.message);
  }
}

/**
 * Trigger background memory extraction
 */
function triggerExtraction(sessionId) {
  try {
    const extractScript = join(__dirname, 'extract.js');
    const input = JSON.stringify({ session_id: sessionId });

    // Spawn extraction process in background (detached, don't wait)
    const child = spawn('node', [extractScript], {
      detached: true,
      stdio: ['pipe', 'ignore', 'ignore'],
    });

    // Write input and close stdin
    child.stdin.write(input);
    child.stdin.end();

    // Detach so it continues after parent exits
    child.unref();
  } catch (error) {
    // Don't fail injection if background extraction fails
    console.error('Failed to trigger background extraction:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Read hook input
    const input = await readInput();
    const { session_id, prompt } = input;

    if (!prompt) {
      // No prompt provided, exit gracefully
      process.exit(0);
    }

    // Search memories via mem0ai
    const memories = await memoryService.search(prompt, 'em', MEMORY_LIMIT);

    // Check session cache
    const memoryIds = memories.map(m => m.id);
    const newMemoryIds = await sessionCache.checkCache(session_id, memoryIds);

    // Filter to only new memories
    const newMemories = memories.filter(m => newMemoryIds.includes(m.id));

    // Increment message count and check if we should extract (do this regardless of new memories)
    const messageCount = await sessionCache.incrementMessageCount(session_id);
    const shouldExtract = await sessionCache.shouldExtract(session_id, EXTRACTION_THRESHOLD);

    if (shouldExtract) {
      console.error(`[inject] Triggering extraction at message ${messageCount} (threshold: ${EXTRACTION_THRESHOLD})`);
      triggerExtraction(session_id);
      await sessionCache.markExtracted(session_id);
    }

    // If no new context to inject, exit gracefully
    if (newMemories.length === 0) {
      process.exit(0);
    }

    // Log injection details
    await logInjection(session_id, prompt, newMemories);

    // Format context
    const additionalContext = formatMemories(newMemories);

    // Output JSON with additionalContext
    const output = {
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext,
      },
    };

    console.log(JSON.stringify(output));
    process.exit(0);

  } catch (error) {
    console.error('Memory injection failed:', error.message);
    // Exit gracefully on error - don't block the prompt
    process.exit(0);
  } finally {
    // Cleanup session cache connection
    sessionCache.close();
  }
}

main();
