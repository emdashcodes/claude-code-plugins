/**
 * Draft management commands
 */

import { Command } from 'commander';
import { getAuthenticatedClient } from '../auth.js';
import { createGmailClient, listDrafts, createDraft, sendDraft, deleteDraft } from '../api.js';
import { GmailError } from '../types.js';

export function createDraftCommand(): Command {
  const draft = new Command('draft')
    .description('Manage email drafts');

  // List drafts
  draft
    .command('list')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('-m, --max <number>', 'Maximum results', '10')
    .description('List drafts')
    .action(async (options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);
        const drafts = await listDrafts(gmail, parseInt(options.max));

        if (drafts.length === 0) {
          console.log('\n📭 No drafts found\n');
          return;
        }

        console.log(`\n📝 Found ${drafts.length} draft(s):\n`);
        drafts.forEach(d => {
          console.log(`  ID: ${d.id}`);
        });
        console.log('');
      } catch (error) {
        console.error('\nFailed to list drafts:', error);
        process.exit(1);
      }
    });

  // Send draft
  draft
    .command('send')
    .argument('<draft-id>', 'Draft ID to send')
    .option('-p, --profile <name>', 'Account profile to use')
    .description('Send a draft')
    .action(async (draftId: string, options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);
        const result = await sendDraft(gmail, draftId);

        console.log(`\nDraft sent! Message ID: ${result.id}\n`);
      } catch (error) {
        console.error('\nFailed to send draft:', error);
        process.exit(1);
      }
    });

  // Delete draft
  draft
    .command('delete')
    .argument('<draft-id>', 'Draft ID to delete')
    .option('-p, --profile <name>', 'Account profile to use')
    .description('Delete a draft')
    .action(async (draftId: string, options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);
        await deleteDraft(gmail, draftId);

        console.log('\nDraft deleted\n');
      } catch (error) {
        console.error('\nFailed to delete draft:', error);
        process.exit(1);
      }
    });

  return draft;
}
