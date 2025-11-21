/**
 * List messages command
 */

import { Command } from 'commander';
import { getAuthenticatedClient } from '../auth.js';
import { createGmailClient, listMessages, parseMessage } from '../api.js';
import { GmailError } from '../types.js';

export function createListCommand(): Command {
  return new Command('list')
    .description('List Gmail messages')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('-l, --label <label>', 'Filter by label (INBOX, SENT, DRAFTS, etc.)')
    .option('-q, --query <text>', 'Gmail search query')
    .option('-m, --max <number>', 'Maximum results', '10')
    .option('--unread', 'Show only unread messages')
    .option('--has-attachment', 'Show only messages with attachments')
    .option('--from <email>', 'Filter by sender')
    .option('--to <email>', 'Filter by recipient')
    .option('--subject <text>', 'Filter by subject')
    .option('--after <date>', 'Messages after date (YYYY/MM/DD)')
    .option('--before <date>', 'Messages before date (YYYY/MM/DD)')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);

        // Build query
        const queryParts: string[] = [];
        if (options.query) queryParts.push(options.query);
        if (options.unread) queryParts.push('is:unread');
        if (options.hasAttachment) queryParts.push('has:attachment');
        if (options.from) queryParts.push(`from:${options.from}`);
        if (options.to) queryParts.push(`to:${options.to}`);
        if (options.subject) queryParts.push(`subject:${options.subject}`);
        if (options.after) queryParts.push(`after:${options.after}`);
        if (options.before) queryParts.push(`before:${options.before}`);

        const query = queryParts.join(' ');
        const labelIds = options.label ? [options.label] : undefined;

        const messages = await listMessages(gmail, {
          query,
          labelIds,
          maxResults: parseInt(options.max),
        });

        if (options.json) {
          // Parse messages for JSON output
          const parsed = await Promise.all(
            messages.map(msg => parseMessage(msg))
          );
          console.log(JSON.stringify(parsed, null, 2));
          return;
        }

        // Format output
        if (messages.length === 0) {
          console.log('\nNo messages found\n');
          return;
        }

        console.log(`\nFound ${messages.length} message(s):\n`);

        for (const message of messages) {
          const parsed = await parseMessage(message);
          const unreadMark = parsed.labelIds.includes('UNREAD') ? '[UNREAD] ' : '';
          const attachMark = parsed.attachments && parsed.attachments.length > 0 ? '[ATTACH] ' : '';

          console.log(`${unreadMark}${attachMark}ID: ${parsed.id}`);
          console.log(`  From: ${parsed.from}`);
          console.log(`  Subject: ${parsed.subject || '(no subject)'}`);
          console.log(`  Date: ${parsed.date.toLocaleString()}`);
          console.log(`  Snippet: ${parsed.snippet.substring(0, 80)}${parsed.snippet.length > 80 ? '...' : ''}`);
          console.log('');
        }
      } catch (error) {
        if (error instanceof GmailError) {
          console.error(`\nError: ${error.message}\n`);
        } else {
          console.error(`\nFailed to list messages:`, error);
        }
        process.exit(1);
      }
    });
}
