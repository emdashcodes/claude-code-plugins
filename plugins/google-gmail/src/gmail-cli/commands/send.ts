/**
 * Send email command
 */

import { Command } from 'commander';
import { getAuthenticatedClient } from '../auth.js';
import { createGmailClient, sendEmail } from '../api.js';
import { GmailError } from '../types.js';
import * as fs from 'fs';

export function createSendCommand(): Command {
  return new Command('send')
    .description('Send an email')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('--to <email...>', 'Recipient email(s)')
    .option('--cc <email...>', 'CC recipient(s)')
    .option('--bcc <email...>', 'BCC recipient(s)')
    .option('-s, --subject <text>', 'Email subject')
    .option('-b, --body <text>', 'Plain text body')
    .option('--html <text>', 'HTML body')
    .option('--body-file <path>', 'Read body from file')
    .option('--html-file <path>', 'Read HTML body from file')
    .option('--attach <path...>', 'Attach file(s)')
    .option('--draft', 'Save as draft instead of sending')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
      try {
        // Validate required fields
        if (!options.to || options.to.length === 0) {
          throw new GmailError('Recipient (--to) is required', 'MISSING_RECIPIENT');
        }
        if (!options.subject) {
          throw new GmailError('Subject (-s, --subject) is required', 'MISSING_SUBJECT');
        }

        // Get body content
        let body = options.body;
        let html = options.html;

        if (options.bodyFile) {
          body = fs.readFileSync(options.bodyFile, 'utf-8');
        }
        if (options.htmlFile) {
          html = fs.readFileSync(options.htmlFile, 'utf-8');
        }

        if (!body && !html) {
          throw new GmailError('Email body (--body or --html) is required', 'MISSING_BODY');
        }

        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);

        const result = await sendEmail(gmail, {
          to: options.to,
          cc: options.cc,
          bcc: options.bcc,
          subject: options.subject,
          body,
          html,
          attachments: options.attach,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log('\nEmail sent successfully!\n');
        console.log(`Message ID: ${result.id}`);
        console.log(`Thread ID: ${result.threadId}\n`);

      } catch (error) {
        if (error instanceof GmailError) {
          console.error(`\nError: ${error.message}\n`);
        } else {
          console.error(`\nFailed to send email:`, error);
        }
        process.exit(1);
      }
    });
}
