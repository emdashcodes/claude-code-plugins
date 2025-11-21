/**
 * Filter management commands
 */

import { Command } from 'commander';
import { getAuthenticatedClient } from '../auth.js';
import { createGmailClient, listFilters, createFilter, deleteFilter, getFilter, listLabels } from '../api.js';
import { GmailError } from '../types.js';

export function createFiltersCommand(): Command {
  const filters = new Command('filters')
    .description('Manage Gmail filters');

  // List filters
  filters
    .command('list')
    .option('-p, --profile <name>', 'Account profile to use')
    .description('List all filters')
    .action(async (options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);
        const filterList = await listFilters(gmail);

        console.log(`\n🔍 Filters (${filterList.length}):\n`);

        if (filterList.length === 0) {
          console.log('  No filters found\n');
          return;
        }

        filterList.forEach((filter, index) => {
          console.log(`${index + 1}. Filter ID: ${filter.id}`);

          // Show criteria
          const criteria = filter.criteria || {};
          if (criteria.from) console.log(`   From: ${criteria.from}`);
          if (criteria.to) console.log(`   To: ${criteria.to}`);
          if (criteria.subject) console.log(`   Subject: ${criteria.subject}`);
          if (criteria.query) console.log(`   Query: ${criteria.query}`);
          if (criteria.hasAttachment) console.log(`   Has attachment: ${criteria.hasAttachment}`);

          // Show actions
          const action = filter.action || {};
          if (action.addLabelIds && action.addLabelIds.length > 0) {
            console.log(`   → Add labels: ${action.addLabelIds.join(', ')}`);
          }
          if (action.removeLabelIds && action.removeLabelIds.length > 0) {
            console.log(`   → Remove labels: ${action.removeLabelIds.join(', ')}`);
          }
          if (action.forward) console.log(`   → Forward to: ${action.forward}`);

          console.log('');
        });
      } catch (error) {
        console.error('\nFailed to list filters:', error);
        process.exit(1);
      }
    });

  // Create filter
  filters
    .command('create')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('--from <email>', 'Filter emails from this sender')
    .option('--to <email>', 'Filter emails to this recipient')
    .option('--subject <text>', 'Filter emails with this subject text')
    .option('--query <text>', 'Gmail search query for criteria')
    .option('--has-attachment', 'Filter emails with attachments')
    .option('--add-label <label>', 'Add this label (can specify multiple times)', collect, [])
    .option('--remove-label <label>', 'Remove this label (can specify multiple times)', collect, [])
    .option('--star', 'Star matching messages')
    .option('--mark-read', 'Mark matching messages as read')
    .option('--archive', 'Archive matching messages (skip inbox)')
    .option('--forward <email>', 'Forward matching messages to this email')
    .description('Create a new filter')
    .action(async (options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);

        // Build criteria
        const criteria: any = {};
        if (options.from) criteria.from = options.from;
        if (options.to) criteria.to = options.to;
        if (options.subject) criteria.subject = options.subject;
        if (options.query) criteria.query = options.query;
        if (options.hasAttachment) criteria.hasAttachment = true;

        if (Object.keys(criteria).length === 0) {
          throw new GmailError('At least one filter criterion must be specified', 'MISSING_CRITERIA');
        }

        // Build action
        const action: any = {};

        // Handle label operations
        if (options.addLabel.length > 0) {
          const labels = await listLabels(gmail);
          const labelIds = options.addLabel.map((labelName: string) => {
            const label = labels.find(l => l.name === labelName);
            if (!label) {
              throw new GmailError(`Label not found: ${labelName}`, 'LABEL_NOT_FOUND');
            }
            return label.id;
          });
          action.addLabelIds = labelIds;
        }

        if (options.removeLabel.length > 0) {
          const labels = await listLabels(gmail);
          const labelIds = options.removeLabel.map((labelName: string) => {
            const label = labels.find(l => l.name === labelName);
            if (!label) {
              throw new GmailError(`Label not found: ${labelName}`, 'LABEL_NOT_FOUND');
            }
            return label.id;
          });
          action.removeLabelIds = labelIds;
        }

        // Handle other actions
        if (options.star) {
          action.addLabelIds = action.addLabelIds || [];
          action.addLabelIds.push('STARRED');
        }

        if (options.markRead) {
          action.removeLabelIds = action.removeLabelIds || [];
          action.removeLabelIds.push('UNREAD');
        }

        if (options.archive) {
          action.removeLabelIds = action.removeLabelIds || [];
          action.removeLabelIds.push('INBOX');
        }

        if (options.forward) {
          action.forward = options.forward;
        }

        if (Object.keys(action).length === 0) {
          throw new GmailError('At least one filter action must be specified', 'MISSING_ACTION');
        }

        const filter = await createFilter(gmail, criteria, action);

        console.log(`\n✅ Filter created successfully!`);
        console.log(`Filter ID: ${filter.id}\n`);

        // Show summary
        console.log('Criteria:');
        Object.entries(criteria).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });

        console.log('\nActions:');
        if (action.addLabelIds) console.log(`  Add labels: ${action.addLabelIds.join(', ')}`);
        if (action.removeLabelIds) console.log(`  Remove labels: ${action.removeLabelIds.join(', ')}`);
        if (action.forward) console.log(`  Forward to: ${action.forward}`);
        console.log('');
      } catch (error) {
        console.error('\nFailed to create filter:', error);
        process.exit(1);
      }
    });

  // Update filter (delete + recreate)
  filters
    .command('update')
    .argument('<filter-id>', 'Filter ID to update')
    .option('-p, --profile <name>', 'Account profile to use')
    .option('--from <email>', 'Filter emails from this sender')
    .option('--to <email>', 'Filter emails to this recipient')
    .option('--subject <text>', 'Filter emails with this subject text')
    .option('--query <text>', 'Gmail search query for criteria')
    .option('--has-attachment', 'Filter emails with attachments')
    .option('--add-label <label>', 'Add this label (can specify multiple times)', collect, [])
    .option('--remove-label <label>', 'Remove this label (can specify multiple times)', collect, [])
    .option('--star', 'Star matching messages')
    .option('--mark-read', 'Mark matching messages as read')
    .option('--archive', 'Archive matching messages (skip inbox)')
    .option('--forward <email>', 'Forward matching messages to this email')
    .description('Update a filter (replaces the filter with new settings)')
    .action(async (filterId: string, options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);

        // Get existing filter
        console.log(`\n🔍 Getting existing filter...`);
        const existingFilter = await getFilter(gmail, filterId);

        // Build new criteria (use provided options or fall back to existing)
        const criteria: any = {};
        if (options.from !== undefined) criteria.from = options.from;
        else if (existingFilter.criteria?.from) criteria.from = existingFilter.criteria.from;

        if (options.to !== undefined) criteria.to = options.to;
        else if (existingFilter.criteria?.to) criteria.to = existingFilter.criteria.to;

        if (options.subject !== undefined) criteria.subject = options.subject;
        else if (existingFilter.criteria?.subject) criteria.subject = existingFilter.criteria.subject;

        if (options.query !== undefined) criteria.query = options.query;
        else if (existingFilter.criteria?.query) criteria.query = existingFilter.criteria.query;

        if (options.hasAttachment !== undefined) criteria.hasAttachment = true;
        else if (existingFilter.criteria?.hasAttachment) criteria.hasAttachment = existingFilter.criteria.hasAttachment;

        if (Object.keys(criteria).length === 0) {
          throw new GmailError('At least one filter criterion must be specified', 'MISSING_CRITERIA');
        }

        // Build new action
        const action: any = {};

        // Handle label operations
        if (options.addLabel.length > 0) {
          const labels = await listLabels(gmail);
          const labelIds = options.addLabel.map((labelName: string) => {
            const label = labels.find(l => l.name === labelName);
            if (!label) {
              throw new GmailError(`Label not found: ${labelName}`, 'LABEL_NOT_FOUND');
            }
            return label.id;
          });
          action.addLabelIds = labelIds;
        } else if (existingFilter.action?.addLabelIds) {
          action.addLabelIds = existingFilter.action.addLabelIds;
        }

        if (options.removeLabel.length > 0) {
          const labels = await listLabels(gmail);
          const labelIds = options.removeLabel.map((labelName: string) => {
            const label = labels.find(l => l.name === labelName);
            if (!label) {
              throw new GmailError(`Label not found: ${labelName}`, 'LABEL_NOT_FOUND');
            }
            return label.id;
          });
          action.removeLabelIds = labelIds;
        } else if (existingFilter.action?.removeLabelIds) {
          action.removeLabelIds = existingFilter.action.removeLabelIds;
        }

        // Handle other actions
        if (options.star) {
          action.addLabelIds = action.addLabelIds || [];
          if (!action.addLabelIds.includes('STARRED')) {
            action.addLabelIds.push('STARRED');
          }
        }

        if (options.markRead) {
          action.removeLabelIds = action.removeLabelIds || [];
          if (!action.removeLabelIds.includes('UNREAD')) {
            action.removeLabelIds.push('UNREAD');
          }
        }

        if (options.archive) {
          action.removeLabelIds = action.removeLabelIds || [];
          if (!action.removeLabelIds.includes('INBOX')) {
            action.removeLabelIds.push('INBOX');
          }
        }

        if (options.forward !== undefined) {
          action.forward = options.forward;
        } else if (existingFilter.action?.forward) {
          action.forward = existingFilter.action.forward;
        }

        if (Object.keys(action).length === 0) {
          throw new GmailError('At least one filter action must be specified', 'MISSING_ACTION');
        }

        // Delete old filter
        console.log(`🗑️  Deleting old filter...`);
        await deleteFilter(gmail, filterId);

        // Create new filter
        console.log(`✨ Creating updated filter...`);
        const newFilter = await createFilter(gmail, criteria, action);

        console.log(`\n✅ Filter updated successfully!`);
        console.log(`New Filter ID: ${newFilter.id}\n`);

        // Show summary
        console.log('Criteria:');
        Object.entries(criteria).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });

        console.log('\nActions:');
        if (action.addLabelIds) console.log(`  Add labels: ${action.addLabelIds.join(', ')}`);
        if (action.removeLabelIds) console.log(`  Remove labels: ${action.removeLabelIds.join(', ')}`);
        if (action.forward) console.log(`  Forward to: ${action.forward}`);
        console.log('');
      } catch (error) {
        console.error('\nFailed to update filter:', error);
        process.exit(1);
      }
    });

  // Delete filter
  filters
    .command('delete')
    .argument('<filter-id>', 'Filter ID to delete')
    .option('-p, --profile <name>', 'Account profile to use')
    .description('Delete a filter')
    .action(async (filterId: string, options) => {
      try {
        const auth = await getAuthenticatedClient(options.profile);
        const gmail = createGmailClient(auth);
        await deleteFilter(gmail, filterId);

        console.log(`\nFilter deleted: ${filterId}\n`);
      } catch (error) {
        console.error('\nFailed to delete filter:', error);
        process.exit(1);
      }
    });

  return filters;
}

// Helper to collect multiple values for options
function collect(value: string, previous: string[]) {
  return previous.concat([value]);
}
