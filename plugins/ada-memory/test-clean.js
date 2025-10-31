#!/usr/bin/env node
/**
 * Test script for cleanConversationHistory function
 */

import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { cleanConversationHistory } from './src/lib/MessageCleaner.js';

async function findSessionFile(sessionId) {
  const claudeDir = join(homedir(), '.claude', 'projects');
  const { readdir } = await import('fs/promises');
  const projectDirs = await readdir(claudeDir);

  for (const projectDir of projectDirs) {
    const sessionPath = join(claudeDir, projectDir, `${sessionId}.jsonl`);
    try {
      await readFile(sessionPath, 'utf-8');
      return sessionPath;
    } catch {
      continue;
    }
  }
  return null;
}

async function main() {
  const sessionId = process.argv[2] || 'd53b09af-6a45-4bc3-b8b5-992b9639a111';

  const sessionPath = await findSessionFile(sessionId);
  if (!sessionPath) {
    console.error(`Session ${sessionId} not found`);
    process.exit(1);
  }

  console.log(`Reading session from: ${sessionPath}\n`);

  const content = await readFile(sessionPath, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.length > 0);
  const messages = lines.map(line => JSON.parse(line));

  // Take last 5 messages
  const recentMessages = messages.slice(-5);
  console.log(`Total messages: ${messages.length}`);
  console.log(`Analyzing last: ${recentMessages.length}\n`);

  // Show raw vs cleaned
  console.log('=== RAW MESSAGES ===');
  recentMessages.forEach((msg, idx) => {
    const preview = JSON.stringify(msg).substring(0, 120);
    console.log(`[${idx}] ${preview}...`);
  });

  console.log('\n=== CLEANED MESSAGES ===');
  const cleaned = cleanConversationHistory(recentMessages);
  console.log(`Cleaned to ${cleaned.length} messages with text content:\n`);

  cleaned.forEach((msg, idx) => {
    const preview = msg.content.substring(0, 150).replace(/\n/g, ' ');
    console.log(`[${idx}] ${preview}${msg.content.length > 150 ? '...' : ''}\n`);
  });

  console.log('=== FULL CLEANED OUTPUT ===');
  console.log(JSON.stringify(cleaned, null, 2));
}

main().catch(console.error);
