/**
 * Label management commands
 */

import { Command } from 'commander';
import { getAuthenticatedClient } from '../auth.js';
import { createGmailClient, listLabels, createLabel, deleteLabel, modifyMessageLabels } from '../api.js';
import { GmailError } from '../types.js';

export function createLabelsCommand(): Command {
  const labels = new Command('labels')
    .description('Manage Gmail labels');

  // List labels
  labels
    .command('list')
    .option('-p, --profile <name>', 'Account profile to use')
    .description('List all labels')
    .action(async (options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);
        const labelList = await listLabels(gmail);

        console.log(`\n🏷️  Labels (${labelList.length}):\n`);
        labelList.forEach(label => {
          console.log(`  • ${label.name} (${label.id})`);
        });
        console.log('');
      } catch (error) {
        console.error('\nFailed to list labels:', error);
        process.exit(1);
      }
    });

  // Create label
  labels
    .command('create')
    .argument('<name>', 'Label name')
    .option('-p, --profile <name>', 'Account profile to use')
    .description('Create a new label')
    .action(async (name: string, options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);
        const label = await createLabel(gmail, name);

        console.log(`\nLabel created: ${label.name} (${label.id})\n`);
      } catch (error) {
        console.error('\nFailed to create label:', error);
        process.exit(1);
      }
    });

  // Delete label
  labels
    .command('delete')
    .argument('<label-id>', 'Label ID to delete')
    .option('-p, --profile <name>', 'Account profile to use')
    .description('Delete a label')
    .action(async (labelId: string, options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);
        await deleteLabel(gmail, labelId);

        console.log(`\nLabel deleted: ${labelId}\n`);
      } catch (error) {
        console.error('\nFailed to delete label:', error);
        process.exit(1);
      }
    });

  // Add label to message
  labels
    .command('add')
    .argument('<message-id>', 'Message ID')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('-l, --label <name>', 'Label to add (required)')
    .description('Add label to message')
    .action(async (messageId: string, options) => {
      try {
        if (!options.label) {
          throw new GmailError('Label name (-l, --label) is required', 'MISSING_LABEL');
        }

        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);
        await modifyMessageLabels(gmail, messageId, [options.label], []);

        console.log(`\nLabel added to message\n`);
      } catch (error) {
        console.error('\nFailed to add label:', error);
        process.exit(1);
      }
    });

  // Remove label from message
  labels
    .command('remove')
    .argument('<message-id>', 'Message ID')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('-l, --label <name>', 'Label to remove (required)')
    .description('Remove label from message')
    .action(async (messageId: string, options) => {
      try {
        if (!options.label) {
          throw new GmailError('Label name (-l, --label) is required', 'MISSING_LABEL');
        }

        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);
        await modifyMessageLabels(gmail, messageId, [], [options.label]);

        console.log(`\nLabel removed from message\n`);
      } catch (error) {
        console.error('\nFailed to remove label:', error);
        process.exit(1);
      }
    });

  // Unarchive messages (add INBOX label back)
  labels
    .command('unarchive')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('-q, --query <query>', 'Gmail query to select messages to unarchive')
    .option('-f, --from <sender>', 'Unarchive all messages from this sender')
    .option('-m, --message-id <id>', 'Unarchive specific message')
    .description('Unarchive messages (add back to inbox)')
    .action(async (options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);

        let query = '';

        if (options.query) {
          query = options.query;
        } else if (options.from) {
          query = `from:${options.from}`;
        } else if (options.messageId) {
          await modifyMessageLabels(gmail, options.messageId, ['INBOX'], []);
          console.log(`\nMessage unarchived\n`);
          return;
        } else {
          throw new GmailError('Either --query, --from, or --message-id must be specified', 'MISSING_OPTION');
        }

        // Get all messages matching the query
        console.log(`\nSearching for messages to unarchive with query: ${query}`);
        const messageIds: string[] = [];
        let pageToken: string | undefined;

        do {
          const response = await gmail.users.messages.list({
            userId: 'me',
            q: query,
            pageToken,
          });

          const messages = response.data.messages || [];
          messageIds.push(...messages.map(m => m.id!));
          pageToken = response.data.nextPageToken || undefined;

          process.stdout.write(`\rFound ${messageIds.length} messages...`);
        } while (pageToken);

        console.log(`\n\nUnarchiving ${messageIds.length} messages...`);

        if (messageIds.length === 0) {
          console.log('\nNo messages found to unarchive!\n');
          return;
        }

        // Use batchModify for efficiency
        const batchSize = 1000;
        let totalUnarchived = 0;

        for (let i = 0; i < messageIds.length; i += batchSize) {
          const batch = messageIds.slice(i, i + batchSize);

          await gmail.users.messages.batchModify({
            userId: 'me',
            requestBody: {
              ids: batch,
              addLabelIds: ['INBOX'],
            },
          });

          totalUnarchived += batch.length;
          console.log(`Unarchived ${totalUnarchived}/${messageIds.length} messages`);
        }

        console.log(`\nSuccessfully unarchived all ${totalUnarchived} messages!\n`);
      } catch (error) {
        console.error('\nFailed to unarchive messages:', error);
        process.exit(1);
      }
    });

  // Archive messages
  labels
    .command('archive')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('-q, --query <query>', 'Gmail query to select messages to archive')
    .option('-f, --from <sender>', 'Archive all messages from this sender')
    .option('-m, --message-id <id>', 'Archive specific message')
    .description('Archive messages (remove from inbox)')
    .action(async (options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);

        let query = '';

        if (options.query) {
          query = options.query;
        } else if (options.from) {
          query = `from:${options.from} in:inbox`;
        } else if (options.messageId) {
          await modifyMessageLabels(gmail, options.messageId, [], ['INBOX']);
          console.log(`\nMessage archived\n`);
          return;
        } else {
          throw new GmailError('Either --query, --from, or --message-id must be specified', 'MISSING_OPTION');
        }

        // Get all messages matching the query
        console.log(`\nSearching for messages to archive with query: ${query}`);
        const messageIds: string[] = [];
        let pageToken: string | undefined;

        do {
          const response = await gmail.users.messages.list({
            userId: 'me',
            q: query,
            pageToken,
          });

          const messages = response.data.messages || [];
          messageIds.push(...messages.map(m => m.id!));
          pageToken = response.data.nextPageToken || undefined;

          process.stdout.write(`\rFound ${messageIds.length} messages...`);
        } while (pageToken);

        console.log(`\n\nArchiving ${messageIds.length} messages...`);

        if (messageIds.length === 0) {
          console.log('\nNo messages found to archive!\n');
          return;
        }

        // Use batchModify for efficiency
        const batchSize = 1000;
        let totalArchived = 0;

        for (let i = 0; i < messageIds.length; i += batchSize) {
          const batch = messageIds.slice(i, i + batchSize);

          await gmail.users.messages.batchModify({
            userId: 'me',
            requestBody: {
              ids: batch,
              removeLabelIds: ['INBOX'],
            },
          });

          totalArchived += batch.length;
          console.log(`Archived ${totalArchived}/${messageIds.length} messages`);
        }

        console.log(`\nSuccessfully archived all ${totalArchived} messages!\n`);
      } catch (error) {
        console.error('\nFailed to archive messages:', error);
        process.exit(1);
      }
    });

  // Mark messages as read
  labels
    .command('mark-read')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('-a, --all', 'Mark all unread messages as read')
    .option('-m, --message-id <id>', 'Mark specific message as read')
    .description('Mark messages as read')
    .action(async (options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);

        if (options.all) {
          // Get all unread messages with pagination
          console.log('\nFetching all unread messages...');
          const messageIds: string[] = [];
          let pageToken: string | undefined;

          do {
            const response = await gmail.users.messages.list({
              userId: 'me',
              q: 'is:unread',
              pageToken,
            });

            const messages = response.data.messages || [];
            messageIds.push(...messages.map(m => m.id!));
            pageToken = response.data.nextPageToken || undefined;

            process.stdout.write(`\rFound ${messageIds.length} unread messages...`);
          } while (pageToken);

          console.log(`\n\nMarking ${messageIds.length} messages as read...`);

          if (messageIds.length === 0) {
            console.log('\nNo unread messages found!\n');
            return;
          }

          // Use batchModify for efficiency (can handle up to 1000 at a time)
          const batchSize = 1000;
          let totalMarked = 0;

          for (let i = 0; i < messageIds.length; i += batchSize) {
            const batch = messageIds.slice(i, i + batchSize);

            await gmail.users.messages.batchModify({
              userId: 'me',
              requestBody: {
                ids: batch,
                removeLabelIds: ['UNREAD'],
              },
            });

            totalMarked += batch.length;
            console.log(`Marked ${totalMarked}/${messageIds.length} messages as read`);
          }

          console.log(`\nSuccessfully marked all ${totalMarked} messages as read!\n`);
        } else if (options.messageId) {
          await modifyMessageLabels(gmail, options.messageId, [], ['UNREAD']);
          console.log(`\nMessage marked as read\n`);
        } else {
          throw new GmailError('Either --all or --message-id must be specified', 'MISSING_OPTION');
        }
      } catch (error) {
        console.error('\nFailed to mark messages as read:', error);
        process.exit(1);
      }
    });

  return labels;
}
