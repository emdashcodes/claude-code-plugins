/**
 * Read message command
 */

import { Command } from 'commander';
import { getAuthenticatedClient } from '../auth.js';
import { createGmailClient, getMessage, parseMessage } from '../api.js';
import { GmailError } from '../types.js';

export function createReadCommand(): Command {
  return new Command('read')
    .description('Read a Gmail message')
    .argument('<message-id>', 'Message ID to read')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('-f, --format <format>', 'Output format: text, markdown, html, json', 'text')
    .option('--headers', 'Include full headers')
    .option('--raw', 'Show raw message')
    .option('-j, --json', 'Output as JSON (same as --format json)')
    .action(async (messageId: string, options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);

        const message = await getMessage(gmail, messageId, options.raw ? 'raw' : 'full');
        const parsed = await parseMessage(message);

        const format = options.json ? 'json' : options.format;

        if (format === 'json') {
          console.log(JSON.stringify(parsed, null, 2));
          return;
        }

        // Text/Markdown/HTML output
        console.log('\n' + '='.repeat(80));
        console.log(`Message ID: ${parsed.id}`);
        console.log('='.repeat(80));
        console.log(`From: ${parsed.from}`);
        console.log(`To: ${parsed.to.join(', ')}`);
        if (parsed.cc && parsed.cc.length > 0) {
          console.log(`Cc: ${parsed.cc.join(', ')}`);
        }
        console.log(`Subject: ${parsed.subject || '(no subject)'}`);
        console.log(`Date: ${parsed.date.toLocaleString()}`);
        console.log(`Labels: ${parsed.labelIds.join(', ')}`);

        if (parsed.attachments && parsed.attachments.length > 0) {
          console.log(`\nAttachments (${parsed.attachments.length}):`);
          parsed.attachments.forEach(att => {
            console.log(`  [ATTACH] ${att.filename} (${(att.size / 1024).toFixed(1)} KB)`);
          });
        }

        console.log('\n' + '-'.repeat(80));

        if (format === 'html' && parsed.htmlBody) {
          console.log(parsed.htmlBody);
        } else if (format === 'markdown') {
          // Simple HTML to markdown conversion (basic)
          let body = parsed.htmlBody || parsed.body || '';
          body = body.replace(/<br\s*\/?>/gi, '\n');
          body = body.replace(/<\/p>/gi, '\n\n');
          body = body.replace(/<[^>]+>/g, '');
          console.log(body);
        } else {
          console.log(parsed.body || parsed.snippet);
        }

        console.log('\n' + '='.repeat(80) + '\n');

      } catch (error) {
        if (error instanceof GmailError) {
          console.error(`\nError: ${error.message}\n`);
        } else {
          console.error(`\nFailed to read message:`, error);
        }
        process.exit(1);
      }
    });
}
