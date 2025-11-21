/**
 * Attachment management commands
 */

import { Command } from 'commander';
import { getAuthenticatedClient } from '../auth.js';
import { createGmailClient, getMessage, parseMessage, downloadAttachment } from '../api.js';
import { GmailError } from '../types.js';
import * as path from 'path';

export function createAttachmentCommand(): Command {
  const attachment = new Command('attachment')
    .description('Manage email attachments');

  // List attachments
  attachment
    .command('list')
    .argument('<message-id>', 'Message ID')
    .option('-p, --profile <name>', 'Account profile to use')
    .description('List attachments in a message')
    .action(async (messageId: string, options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);
        const message = await getMessage(gmail, messageId);
        const parsed = await parseMessage(message);

        if (!parsed.attachments || parsed.attachments.length === 0) {
          console.log('\n📭 No attachments found\n');
          return;
        }

        console.log(`\n[ATTACH] Attachments (${parsed.attachments.length}):\n`);
        parsed.attachments.forEach((att, index) => {
          console.log(`  ${index + 1}. ${att.filename}`);
          console.log(`     Type: ${att.mimeType}`);
          console.log(`     Size: ${(att.size / 1024).toFixed(1)} KB`);
          console.log(`     ID: ${att.id}`);
        });
        console.log('');
      } catch (error) {
        console.error('\nFailed to list attachments:', error);
        process.exit(1);
      }
    });

  // Download attachment
  attachment
    .command('download')
    .argument('<message-id>', 'Message ID')
    .argument('<attachment-id-or-index>', 'Attachment ID or index (1-based)')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('-o, --output <path>', 'Output file path')
    .description('Download an attachment')
    .action(async (messageId: string, attachmentIdOrIndex: string, options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);

        // Get attachment info for filename
        const message = await getMessage(gmail, messageId);
        const parsed = await parseMessage(message);

        if (!parsed.attachments || parsed.attachments.length === 0) {
          throw new GmailError('No attachments found in message', 'NO_ATTACHMENTS');
        }

        // Try to find by index first (if it's a number)
        let att;
        const index = parseInt(attachmentIdOrIndex);
        if (!isNaN(index) && index > 0 && index <= parsed.attachments.length) {
          att = parsed.attachments[index - 1];
        } else {
          // Try to find by ID
          att = parsed.attachments.find(a => a.id === attachmentIdOrIndex);
        }

        if (!att) {
          console.error(`\nAttachment not found. Available attachments:\n`);
          parsed.attachments.forEach((a, i) => {
            console.error(`  ${i + 1}. ${a.filename} (ID: ${a.id.substring(0, 20)}...)`);
          });
          throw new GmailError('Attachment not found', 'ATTACHMENT_NOT_FOUND');
        }

        const outputPath = options.output || att.filename;
        await downloadAttachment(gmail, messageId, att.id, outputPath);

        console.log(`\nDownloaded: ${outputPath}\n`);
      } catch (error) {
        console.error('\nFailed to download attachment:', error);
        process.exit(1);
      }
    });

  return attachment;
}
