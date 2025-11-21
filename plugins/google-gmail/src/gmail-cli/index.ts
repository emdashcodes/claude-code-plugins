#!/usr/bin/env node

/**
 * Google Gmail CLI - Main entry point
 */

import { Command } from 'commander';
import { createAccountsCommand } from './commands/accounts.js';
import { createListCommand } from './commands/list.js';
import { createReadCommand } from './commands/read.js';
import { createSendCommand } from './commands/send.js';
import { createReplyCommand } from './commands/reply.js';
import { createDraftCommand } from './commands/draft.js';
import { createLabelsCommand } from './commands/labels.js';
import { createFiltersCommand } from './commands/filters.js';
import { createAttachmentCommand } from './commands/attachment.js';
import { createUnsubscribeCommand } from './commands/unsubscribe.js';
import { testConnection } from './auth.js';

const program = new Command();

program
  .name('google-gmail')
  .description('Google Gmail CLI for Claude Code with multi-account support')
  .version('0.1.0');

// Auth command
program
  .command('auth')
  .description('Test Gmail API authentication')
  .option('-p, --profile <name>', 'Account profile to use')
  .action(async (options) => {
    try {
      await testConnection(options.profile);
    } catch (error) {
      console.error('\nAuthentication test failed:', error);
      process.exit(1);
    }
  });

// Register subcommands
program.addCommand(createAccountsCommand());
program.addCommand(createListCommand());
program.addCommand(createReadCommand());
program.addCommand(createSendCommand());
program.addCommand(createReplyCommand());
program.addCommand(createDraftCommand());
program.addCommand(createLabelsCommand());
program.addCommand(createFiltersCommand());
program.addCommand(createAttachmentCommand());
program.addCommand(createUnsubscribeCommand());

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
