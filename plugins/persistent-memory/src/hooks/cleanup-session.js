#!/usr/bin/env node
/**
 * Session Cleanup Script
 *
 * Removes session cache entries to reset memory injection tracking.
 *
 * Used by:
 * - SessionEnd: When session ends (cleanup)
 * - SessionStart (compact matcher): After compaction to allow memory re-injection
 *
 * No extraction needed - Stop hook already extracts on every turn.
 */

import { createInterface } from 'readline';
import { sessionCache } from '../lib/SessionCache.js';

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
 * Main execution
 */
async function main() {
  try {
    // Read hook input
    const input = await readInput();
    const { session_id } = input;

    if (!session_id) {
      console.error('[cleanup] No session_id provided');
      process.exit(0);
    }

    await sessionCache.cleanupSession(session_id);
    process.exit(0);
  } catch (error) {
    console.error('[cleanup] Session cleanup failed:', error.message);
    process.exit(0); // Exit gracefully - don't block SessionEnd
  } finally {
    sessionCache.close();
  }
}

main();
