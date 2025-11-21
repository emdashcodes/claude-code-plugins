/**
 * Account/Profile management commands
 */

import { Command } from 'commander';
import {
  addProfile,
  listProfiles,
  removeProfile,
  setDefaultProfile,
} from '../config.js';
import { authenticateInteractive, testConnection } from '../auth.js';
import { GmailError } from '../types.js';

export function createAccountsCommand(): Command {
  const accounts = new Command('accounts')
    .description('Manage Gmail account profiles');

  // Add account
  accounts
    .command('add')
    .argument('<profile-name>', 'Name for this profile')
    .option('-e, --email <email>', 'Email address for this account')
    .option('--oauth <path>', 'Path to OAuth credentials file (optional, uses shared by default)')
    .description('Add a new Gmail account profile')
    .action(async (profileName: string, options: { email?: string; oauth?: string }) => {
      try {
        console.log(`\nAdding profile: ${profileName}\n`);

        // If email not provided, we'll get it after auth
        let email = options.email;

        // Add profile (email can be updated later)
        addProfile(profileName, email || 'pending', options.oauth);
        console.log(`Profile '${profileName}' created\n`);

        // Run authentication flow
        console.log('Starting OAuth authentication...\n');
        await authenticateInteractive(profileName);

        // Test connection and get email
        const result = await testConnection(profileName);

        if (result.success && result.email && !email) {
          // Update profile with actual email address
          addProfile(profileName, result.email, options.oauth);
          console.log(`\nTip: You can set a default profile with:`);
          console.log(`   google-gmail accounts set-default ${profileName}\n`);
        } else if (result.success && !email) {
          console.log(`\nTip: You can set a default profile with:`);
          console.log(`   google-gmail accounts set-default ${profileName}\n`);
        }
      } catch (error) {
        if (error instanceof GmailError) {
          console.error(`\nError: ${error.message}\n`);
        } else {
          console.error(`\nFailed to add profile:`, error);
        }
        process.exit(1);
      }
    });

  // List accounts
  accounts
    .command('list')
    .description('List all configured account profiles')
    .action(() => {
      try {
        const profiles = listProfiles();

        if (profiles.length === 0) {
          console.log('\nNo profiles configured yet.\n');
          console.log('Add a profile with: google-gmail accounts add <profile-name>\n');
          return;
        }

        console.log('\nConfigured profiles:\n');
        profiles.forEach(profile => {
          const defaultMark = profile.isDefault ? ' (default)' : '';
          console.log(`  • ${profile.name}${defaultMark}`);
          console.log(`    Email: ${profile.email}`);
        });
        console.log('');
      } catch (error) {
        if (error instanceof GmailError) {
          console.error(`\nError: ${error.message}\n`);
        } else {
          console.error(`\nFailed to list profiles:`, error);
        }
        process.exit(1);
      }
    });

  // Set default profile
  accounts
    .command('set-default')
    .argument('<profile-name>', 'Profile to set as default')
    .description('Set the default account profile')
    .action((profileName: string) => {
      try {
        setDefaultProfile(profileName);
        console.log(`\nDefault profile set to: ${profileName}\n`);
      } catch (error) {
        if (error instanceof GmailError) {
          console.error(`\nError: ${error.message}\n`);
        } else {
          console.error(`\nFailed to set default profile:`, error);
        }
        process.exit(1);
      }
    });

  // Remove profile
  accounts
    .command('remove')
    .argument('<profile-name>', 'Profile to remove')
    .option('-f, --force', 'Skip confirmation')
    .description('Remove an account profile')
    .action(async (profileName: string, options: { force?: boolean }) => {
      try {
        if (!options.force) {
          const readline = require('readline');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          const answer: string = await new Promise(resolve => {
            rl.question(
              `\n⚠️  Remove profile '${profileName}'? This will delete tokens and configuration. (y/N): `,
              (ans: string) => {
                rl.close();
                resolve(ans);
              }
            );
          });

          if (answer.toLowerCase() !== 'y') {
            console.log('\nCancelled\n');
            return;
          }
        }

        removeProfile(profileName);
        console.log(`\nProfile '${profileName}' removed\n`);
      } catch (error) {
        if (error instanceof GmailError) {
          console.error(`\nError: ${error.message}\n`);
        } else {
          console.error(`\nFailed to remove profile:`, error);
        }
        process.exit(1);
      }
    });

  return accounts;
}
