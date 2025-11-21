/**
 * Unsubscribe command
 */

import { Command } from 'commander';
import { getAuthenticatedClient } from '../auth.js';
import { createGmailClient, unsubscribeFromMessage, listMessages, extractUnsubscribeInfo, getMessage } from '../api.js';
import { GmailError } from '../types.js';

export function createUnsubscribeCommand(): Command {
  const unsubscribe = new Command('unsubscribe')
    .description('Unsubscribe from mailing lists');

  // Unsubscribe from specific message
  unsubscribe
    .command('message')
    .argument('<message-id>', 'Message ID to unsubscribe from')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('-j, --json', 'Output as JSON')
    .description('Unsubscribe from the mailing list that sent this message')
    .action(async (messageId: string, options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);

        const result = await unsubscribeFromMessage(gmail, messageId);

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        if (result.success) {
          console.log('\n✅ Unsubscribe successful!\n');
          console.log(`From: ${result.from}`);
          console.log(`Subject: ${result.subject}`);
          console.log(`Method: ${result.method}`);
          if (result.details) {
            console.log(`Details: ${result.details}`);
          }
          console.log('');
        } else {
          console.log('\n❌ Unsubscribe failed\n');
          console.log(`From: ${result.from}`);
          console.log(`Subject: ${result.subject}`);
          console.log(`Error: ${result.error}`);
          console.log('');
          process.exit(1);
        }
      } catch (error) {
        console.error('\nFailed to unsubscribe:', error);
        process.exit(1);
      }
    });

  // Check if message has unsubscribe capability
  unsubscribe
    .command('check')
    .argument('<message-id>', 'Message ID to check')
    .option('-p, --profile <name>', 'Account profile to use')
    .description('Check if a message has unsubscribe capability')
    .action(async (messageId: string, options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);

        const message = await getMessage(gmail, messageId);
        const unsubInfo = await extractUnsubscribeInfo(gmail, message);

        if (unsubInfo) {
          console.log('\n✅ Unsubscribe available\n');
          console.log(`Method: ${unsubInfo.method}`);
          if (unsubInfo.url) {
            console.log(`URL: ${unsubInfo.url}`);
          }
          if (unsubInfo.email) {
            console.log(`Email: ${unsubInfo.email}`);
          }
          if (unsubInfo.subject) {
            console.log(`Subject: ${unsubInfo.subject}`);
          }
          console.log('');
        } else {
          console.log('\n❌ No unsubscribe method found\n');
          process.exit(1);
        }
      } catch (error) {
        console.error('\nFailed to check unsubscribe:', error);
        process.exit(1);
      }
    });

  // Bulk unsubscribe
  unsubscribe
    .command('bulk')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('--from <email>', 'Unsubscribe from messages from this sender')
    .option('--query <text>', 'Gmail search query for messages')
    .option('--max <number>', 'Maximum number of unique senders to process', '10')
    .option('-j, --json', 'Output as JSON')
    .description('Bulk unsubscribe from multiple senders')
    .action(async (options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);

        // Build query
        let query = options.query || '';
        if (options.from) {
          query = query ? `${query} from:${options.from}` : `from:${options.from}`;
        }

        if (!query) {
          throw new GmailError('Either --from or --query is required', 'MISSING_QUERY');
        }

        const maxSenders = parseInt(options.max);

        // List messages matching query
        const messages = await listMessages(gmail, { query, maxResults: 100 });

        if (messages.length === 0) {
          console.log('\nNo messages found matching query\n');
          return;
        }

        // Group by sender (from header)
        const senderMessages = new Map<string, string>();

        for (const msg of messages) {
          const headers = msg.payload?.headers || [];
          const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
          const from = fromHeader?.value || 'unknown';

          if (!senderMessages.has(from)) {
            senderMessages.set(from, msg.id!);
          }

          if (senderMessages.size >= maxSenders) {
            break;
          }
        }

        console.log(`\nFound ${senderMessages.size} unique sender(s)\n`);

        const results = [];

        // Unsubscribe from each sender
        for (const [from, messageId] of senderMessages) {
          console.log(`Processing: ${from}...`);
          const result = await unsubscribeFromMessage(gmail, messageId);
          results.push(result);

          if (!options.json) {
            if (result.success) {
              console.log(`  ✅ Success (${result.method})`);
            } else {
              console.log(`  ❌ Failed: ${result.error}`);
            }
          }
        }

        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
        } else {
          const successful = results.filter(r => r.success).length;
          const failed = results.filter(r => !r.success).length;

          console.log(`\nResults: ${successful} successful, ${failed} failed\n`);
        }
      } catch (error) {
        console.error('\nBulk unsubscribe failed:', error);
        process.exit(1);
      }
    });

  return unsubscribe;
}
