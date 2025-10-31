#!/usr/bin/env node
/**
 * Memory Extraction Script for Claude Code
 *
 * Reads conversation history from Claude Code session JSONL files
 * and extracts memories via mem0ai.
 *
 * Features:
 * - Reads session JSONL files from ~/.claude/projects/
 * - Extracts last N messages for context
 * - Uses mem0ai directly (no server dependency)
 * - mem0 handles extraction, categorization, and deduplication
 */

import { createInterface } from 'readline';
import { mkdir, appendFile, readFile, access } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { memoryService } from '../lib/MemoryService.js';
import { cleanConversationHistory } from '../lib/MessageCleaner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const EXTRACTION_CONTEXT_WINDOW = 10; // Number of cleaned messages to pass to mem0

// Logging
const LOG_DIR = join(homedir(), '.claude', 'mem0', 'logs');
const LOG_FILE = join(LOG_DIR, 'extractions.log');

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
 * Read session JSONL file to get conversation history
 */
async function readSessionHistory(sessionId) {
  try {
    // Session files are in ~/.claude/projects/{project-hash}/{session-id}.jsonl
    // We need to find the right project directory
    const claudeDir = join(homedir(), '.claude', 'projects');

    // Try to find session file in project directories
    const { readdir } = await import('fs/promises');
    const projectDirs = await readdir(claudeDir);

    for (const projectDir of projectDirs) {
      const sessionPath = join(claudeDir, projectDir, `${sessionId}.jsonl`);
      try {
        await access(sessionPath);
        // File exists, read it
        const content = await readFile(sessionPath, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line.length > 0);

        // Parse JSONL - each line is a message
        const messages = lines.map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(msg => msg !== null);

        return messages;
      } catch {
        // File doesn't exist in this project, continue searching
        continue;
      }
    }

    return []; // Session file not found
  } catch (error) {
    console.error('Failed to read session history:', error.message);
    return [];
  }
}

/**
 * Extract memories from conversation history
 */
async function extractMemories(rawMessages, userId = 'em') {
  try {
    if (rawMessages.length === 0) {
      return { success: false, reason: 'No messages to extract from', memories: [], conversationHistory: [] };
    }

    // Clean entire session first
    const allCleanedMessages = cleanConversationHistory(rawMessages);

    if (allCleanedMessages.length === 0) {
      return { success: false, reason: 'No cleaned messages', memories: [], conversationHistory: [] };
    }

    // Extract last N cleaned messages for context window
    const contextMessages = allCleanedMessages.slice(-EXTRACTION_CONTEXT_WINDOW);
    const result = await memoryService.add(contextMessages, userId);

    const memories = result?.results?.map(r => r.memory || r.content).filter(Boolean) || [];

    return {
      success: true,
      contextWindowSize: contextMessages.length,
      memoriesCreated: memories.length,
      memories,
      conversationHistory: contextMessages
    };
  } catch (error) {
    console.error('Failed to extract memories:', error.message);
    return { success: false, reason: error.message, memories: [], conversationHistory: [] };
  }
}

/**
 * Log extraction details to file
 */
async function logExtraction(sessionId, totalRawCount, result) {
  try {
    await mkdir(LOG_DIR, { recursive: true });

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      sessionId,
      action: 'extracted',
      totalRawMessages: totalRawCount,
      success: result.success,
      contextWindowSize: result.contextWindowSize || 0,
      memoriesCreated: result.memoriesCreated || 0,
      memories: result.memories || [],
      conversationHistory: result.conversationHistory || [],
      reason: result.reason,
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    await appendFile(LOG_FILE, logLine);
  } catch (error) {
    // Don't fail the extraction if logging fails
    console.error('Logging failed:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Read hook input
    const input = await readInput();
    const { session_id } = input;

    if (!session_id) {
      console.error('No session_id provided');
      process.exit(1);
    }

    // Read session history
    const rawMessages = await readSessionHistory(session_id);

    if (rawMessages.length === 0) {
      const result = { success: false, reason: 'No messages found', memories: [], conversationHistory: [] };
      await logExtraction(session_id, 0, result);
      console.log(JSON.stringify(result));
      process.exit(0);
    }

    // Extract memories from last N cleaned messages
    const result = await extractMemories(rawMessages, 'em');

    // Log extraction
    await logExtraction(session_id, rawMessages.length, result);

    // Output result
    console.log(JSON.stringify(result));
    process.exit(0);

  } catch (error) {
    console.error('Memory extraction failed:', error.message);
    console.log(JSON.stringify({ success: false, reason: error.message, memories: [], conversationHistory: [] }));
    process.exit(1);
  }
}

main();
