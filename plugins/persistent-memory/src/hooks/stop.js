#!/usr/bin/env node
/**
 * Stop Hook - Trigger Memory Extraction
 *
 * Fires after Claude finishes responding, ensuring JSONL is flushed.
 * Triggers extraction on EVERY agent turn (best practice for incremental memory updates).
 * Uses Haiku for fast, cost-effective extraction.
 *
 * ARCHITECTURE NOTE: Why this wrapper exists
 * ==========================================
 * Claude Code hooks are SYNCHRONOUS - they block until the process exits.
 * Memory extraction takes 1-3 seconds (spawns Haiku via Claude Code Agent SDK).
 *
 * We can't call extract.js directly because it would block the Stop hook,
 * causing user-visible latency after every response.
 *
 * This wrapper:
 * 1. Validates input (fast)
 * 2. Spawns extract.js as detached background process (spawn + unref)
 * 3. Exits immediately (no blocking)
 * 4. extract.js runs asynchronously in background
 *
 * Result: Zero user-perceived latency, extraction happens invisibly.
 */

import { createInterface } from 'readline';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
 * Trigger background memory extraction
 *
 * Spawns extract.js as a detached background process:
 * - stdio: 'ignore' = don't pipe stdout/stderr back to parent
 * - child.unref() = allow parent to exit without waiting for child
 *
 * This makes extraction truly asynchronous - stop.js exits immediately
 * while extract.js continues running in the background.
 */
function triggerExtraction(sessionId) {
  try {
    const extractScript = join(__dirname, 'extract.js');
    const input = JSON.stringify({
      session_id: sessionId
    });

    const child = spawn('node', [extractScript], {
      stdio: ['pipe', 'ignore', 'ignore'],  // Detach stdout/stderr
    });

    child.stdin.write(input);
    child.stdin.end();
    child.unref();  // Critical: allows parent process to exit

    console.error(`[stop] Triggered extraction (every-turn mode)`);
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


    // Trigger extraction on every Stop hook (incremental best practice)
    triggerExtraction(session_id);

    process.exit(0);
  } catch (error) {
    console.error('[stop] Hook failed:', error.message);
    process.exit(0); // Exit gracefully - don't block Stop event
  }
}

main();
