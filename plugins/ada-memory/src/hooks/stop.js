#!/usr/bin/env node
/**
 * Stop Hook - Trigger Memory Extraction
 *
 * Fires after Claude finishes responding, ensuring JSONL is flushed.
 * Counts cleaned conversation messages and triggers extraction when threshold is reached.
 */

import { createInterface } from 'readline';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { readFile, access } from 'fs/promises';
import { sessionCache } from '../lib/SessionCache.js';
import { cleanConversationHistory } from '../lib/MessageCleaner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXTRACTION_THRESHOLD = 5; // Extract every N cleaned conversation messages

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
    const claudeDir = join(homedir(), '.claude', 'projects');
    const { readdir } = await import('fs/promises');
    const projectDirs = await readdir(claudeDir);

    for (const projectDir of projectDirs) {
      const sessionPath = join(claudeDir, projectDir, `${sessionId}.jsonl`);
      try {
        await access(sessionPath);
        const content = await readFile(sessionPath, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line.length > 0);

        const messages = lines.map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(msg => msg !== null);

        return messages;
      } catch {
        continue;
      }
    }

    return [];
  } catch (error) {
    console.error('[stop] Failed to read session history:', error.message);
    return [];
  }
}

/**
 * Trigger background memory extraction
 */
function triggerExtraction(sessionId, cleanedCount) {
  try {
    const extractScript = join(__dirname, 'extract.js');
    const input = JSON.stringify({
      session_id: sessionId,
      total_cleaned_count: cleanedCount
    });

    const child = spawn('node', [extractScript], {
      stdio: ['pipe', 'ignore', 'ignore'],
    });

    child.stdin.write(input);
    child.stdin.end();
    child.unref();

    console.error(`[stop] Triggered extraction (${cleanedCount} cleaned messages)`);
  } catch (error) {
    console.error('[stop] Failed to trigger extraction:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const input = await readInput();
    const { session_id } = input;

    if (!session_id) {
      process.exit(0);
    }

    // Read and clean entire session to count conversation messages
    const rawMessages = await readSessionHistory(session_id);
    const cleanedMessages = cleanConversationHistory(rawMessages);
    const totalCleanedCount = cleanedMessages.length;

    console.error(`[stop] Session has ${totalCleanedCount} cleaned conversation messages (${rawMessages.length} raw)`);

    // Get last extraction count
    const stats = await sessionCache.getSessionStats(session_id);
    const lastExtractedCount = stats?.last_cleaned_count_extracted || 0;

    console.error(`[stop] Last extraction at ${lastExtractedCount} cleaned messages`);

    // Check if we should extract
    if (totalCleanedCount >= lastExtractedCount + EXTRACTION_THRESHOLD) {
      console.error(`[stop] Threshold reached (${totalCleanedCount} >= ${lastExtractedCount + EXTRACTION_THRESHOLD})`);

      // Trigger extraction
      triggerExtraction(session_id, totalCleanedCount);

      // Mark as extracted with new cleaned count
      await sessionCache.markExtracted(session_id, totalCleanedCount);
    } else {
      console.error(`[stop] Threshold not reached (need ${lastExtractedCount + EXTRACTION_THRESHOLD - totalCleanedCount} more cleaned messages)`);
    }

    process.exit(0);
  } catch (error) {
    console.error('[stop] Hook failed:', error.message);
    process.exit(0); // Exit gracefully - don't block Stop event
  } finally {
    sessionCache.close();
  }
}

main();
