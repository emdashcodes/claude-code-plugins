#!/usr/bin/env node
/**
 * Session Cleanup Script for SessionEnd Hook
 *
 * 1. Triggers final memory extraction (captures any remaining messages)
 * 2. Removes session cache entries when a Claude Code session ends
 */

import { createInterface } from 'readline';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { sessionCache } from '../lib/SessionCache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
 * Trigger final extraction for any remaining messages
 */
async function triggerFinalExtraction(sessionId) {
  return new Promise((resolve) => {
    try {
      const extractScript = join(__dirname, 'extract.js');
      const input = JSON.stringify({ session_id: sessionId });

      const child = spawn('node', [extractScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Write input
      child.stdin.write(input);
      child.stdin.end();

      // Wait for completion (with timeout)
      const timeout = setTimeout(() => {
        child.kill();
        resolve({ success: false, reason: 'timeout' });
      }, 30000); // 30 second timeout

      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve({ success: code === 0 });
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        console.error('[cleanup] Final extraction failed:', error.message);
        resolve({ success: false, reason: error.message });
      });
    } catch (error) {
      console.error('[cleanup] Failed to trigger extraction:', error.message);
      resolve({ success: false, reason: error.message });
    }
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
      console.error('No session_id provided');
      process.exit(0);
    }

    console.error(`[cleanup] Session ending: ${session_id}`);

    // Step 1: Trigger final extraction to capture any remaining messages
    console.error('[cleanup] Triggering final memory extraction...');
    const extractionResult = await triggerFinalExtraction(session_id);

    if (extractionResult.success) {
      console.error('[cleanup] Final extraction completed');
    } else {
      console.error('[cleanup] Final extraction skipped or failed:', extractionResult.reason || 'unknown');
    }

    // Step 2: Cleanup session cache
    console.error('[cleanup] Cleaning up session cache...');
    await sessionCache.cleanupSession(session_id);
    console.error('[cleanup] Session cache cleaned');

    process.exit(0);
  } catch (error) {
    console.error('Session cleanup failed:', error.message);
    process.exit(0); // Exit gracefully - don't block SessionEnd
  } finally {
    // Close database connection
    sessionCache.close();
  }
}

main();
