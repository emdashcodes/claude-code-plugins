/**
 * Reply to email command
 */

import { Command } from 'commander';
import { getAuthenticatedClient } from '../auth.js';
import { createGmailClient, getMessage, sendEmail, parseMessage } from '../api.js';
import { GmailError } from '../types.js';

export function createReplyCommand(): Command {
  return new Command('reply')
    .description('Reply to an email')
    .argument('<message-id>', 'Message ID to reply to')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('-b, --body <text>', 'Reply body (required)')
    .option('--reply-all', 'Reply to all recipients')
    .option('--attach <path...>', 'Attach file(s)')
    .option('-j, --json', 'Output as JSON')
    .action(async (messageId: string, options) => {
      try {
        if (!options.body) {
          throw new GmailError('Reply body (-b, --body) is required', 'MISSING_BODY');
        }

        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);

        // Get original message
        const original = await getMessage(gmail, messageId);
        const parsed = await parseMessage(original);

        // Build recipient list
        const to = [parsed.from];
        const cc = options.replyAll && parsed.cc ? parsed.cc : undefined;

        // Send reply
        const result = await sendEmail(gmail, {
          to,
          cc,
          subject: parsed.subject.startsWith('Re:') ? parsed.subject : `Re: ${parsed.subject}`,
          body: options.body,
          attachments: options.attach,
          threadId: parsed.threadId,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log('\nReply sent successfully!\n');
        console.log(`Message ID: ${result.id}\n`);

      } catch (error) {
        if (error instanceof GmailError) {
          console.error(`\nError: ${error.message}\n`);
        } else {
          console.error(`\nFailed to send reply:`, error);
        }
        process.exit(1);
      }
    });
}
