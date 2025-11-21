/**
 * List configured calendars command
 */

import { loadConfig, fileExists, getConfigPath } from '../utils';

interface CalendarsOptions {
  json?: boolean;
  format?: string;
}

/**
 * List all configured calendars.
 *
 * @param options - Command options
 */
export async function listCalendars(options: CalendarsOptions): Promise<void> {
  const configPath = getConfigPath();

  // Check if config file exists
  if (!fileExists(configPath)) {
    console.error('No calendar configuration found.');
    console.error('Run the setup wizard to configure your calendars:');
    console.error('  google-calendar auth');
    process.exit(1);
  }

  // Load config
  const config = loadConfig();

  if (config.calendars.length === 0) {
    console.error('No calendars configured.');
    console.error('Run the setup wizard to configure your calendars:');
    console.error('  google-calendar auth');
    process.exit(1);
  }

  if (options.json) {
    // Output as JSON
    console.log(JSON.stringify(config.calendars, null, 2));
  } else if (options.format === 'compact') {
    // Compact format for inline context
    const selectedCalendars = config.calendars.filter(c => c.selected);
    const calendarList = selectedCalendars
      .map(cal => cal.alias ? `${cal.alias} (${cal.summary})` : cal.summary)
      .join(', ');
    console.log(calendarList);
  } else {
    // Output formatted
    console.log(`\nConfigured Calendars (${config.calendars.length}):\n`);

    for (const calendar of config.calendars) {
      const selectedMark = calendar.selected ? 'X' : ' ';
      const primaryMark = calendar.primary ? ' [PRIMARY]' : '';
      const alias = calendar.alias ? ` (${calendar.alias})` : '';

      console.log(`  [${selectedMark}] ${calendar.summary}${alias}${primaryMark}`);
      console.log(`      ID: ${calendar.id}`);
      if (calendar.accessRole) {
        console.log(`      Access: ${calendar.accessRole}`);
      }
      console.log();
    }

    console.log('Settings:');
    console.log(`  - Query all by default: ${config.defaultBehavior.queryAllByDefault ? 'Yes' : 'No'}`);
    console.log(`  - Show calendar labels: ${config.defaultBehavior.showCalendarLabels ? 'Yes' : 'No'}`);
    console.log();

    const selectedCount = config.calendars.filter(c => c.selected).length;
    console.log(`${selectedCount} calendar(s) selected for default queries.\n`);
  }
}
