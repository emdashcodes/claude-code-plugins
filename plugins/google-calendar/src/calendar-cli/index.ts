#!/usr/bin/env node

/**
 * Google Calendar CLI
 *
 * Command-line interface for Google Calendar operations.
 */

import { Command } from 'commander';
import { listEvents } from './commands/list';
import { createEvent } from './commands/create';
import { updateEvent } from './commands/update';
import { deleteEvent } from './commands/delete';
import { findFreeTime } from './commands/find-free';
import { listCalendars } from './commands/calendars';
import { getTimezone } from './commands/timezone';
import { testConnection } from './auth';

const program = new Command();

program
  .name('google-calendar')
  .description('Google Calendar CLI for Claude Code')
  .version('0.1.0');

// List events command
program
  .command('list')
  .description('List calendar events')
  .option('-c, --calendar <id>', 'Calendar ID or alias (default: all selected calendars)')
  .option('-s, --start <date>', 'Start date/time (ISO or relative like "today", "+1d")')
  .option('-e, --end <date>', 'End date/time (ISO or relative)')
  .option('-m, --max <number>', 'Maximum number of events to return', '10')
  .option('-q, --query <text>', 'Search query text')
  .option('-j, --json', 'Output as JSON', false)
  .action(async (options) => {
    try {
      await listEvents({
        calendar: options.calendar,
        start: options.start,
        end: options.end,
        max: parseInt(options.max, 10),
        query: options.query,
        json: options.json,
      });
    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  });

// Create event command
program
  .command('create <summary>')
  .description('Create a new calendar event')
  .option('-s, --start <date>', 'Start date/time (ISO or relative like "now", "+1h")')
  .option('-e, --end <date>', 'End date/time (ISO or relative)')
  .option('-d, --duration <duration>', 'Duration (e.g., "30m", "1h", "1h30m")')
  .option('-l, --location <location>', 'Event location')
  .option('--description <text>', 'Event description')
  .option('-a, --attendees <emails>', 'Comma-separated list of attendee emails')
  .option('--all-day', 'Create as all-day event', false)
  .option('-c, --calendar <id>', 'Calendar ID (default: primary)', 'primary')
  .option('-j, --json', 'Output as JSON', false)
  .action(async (summary, options) => {
    try {
      await createEvent({
        summary,
        start: options.start,
        end: options.end,
        duration: options.duration,
        location: options.location,
        description: options.description,
        attendees: options.attendees,
        allDay: options.allDay,
        calendar: options.calendar,
        json: options.json,
      });
    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  });

// Update event command
program
  .command('update')
  .description('Update an existing calendar event')
  .option('-i, --event-id <id>', 'Event ID to update')
  .option('-q, --query <text>', 'Search query to find event')
  .option('--summary <text>', 'New event summary/title')
  .option('-s, --start <date>', 'New start date/time')
  .option('-e, --end <date>', 'New end date/time')
  .option('-d, --duration <duration>', 'New duration (e.g., "30m", "1h")')
  .option('-l, --location <location>', 'New event location')
  .option('--description <text>', 'New event description')
  .option('-a, --attendees <emails>', 'New comma-separated list of attendee emails')
  .option('-c, --calendar <id>', 'Calendar ID (default: primary)', 'primary')
  .option('-j, --json', 'Output as JSON', false)
  .action(async (options) => {
    try {
      await updateEvent({
        eventId: options.eventId,
        query: options.query,
        summary: options.summary,
        start: options.start,
        end: options.end,
        duration: options.duration,
        location: options.location,
        description: options.description,
        attendees: options.attendees,
        calendar: options.calendar,
        json: options.json,
      });
    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  });

// Delete event command
program
  .command('delete')
  .description('Delete a calendar event')
  .option('-i, --event-id <id>', 'Event ID to delete')
  .option('-q, --query <text>', 'Search query to find event')
  .option('-c, --calendar <id>', 'Calendar ID (default: primary)', 'primary')
  .option('-f, --force', 'Skip confirmation prompt', false)
  .option('-j, --json', 'Output as JSON', false)
  .action(async (options) => {
    try {
      await deleteEvent({
        eventId: options.eventId,
        query: options.query,
        calendar: options.calendar,
        force: options.force,
        json: options.json,
      });
    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  });

// Find free time command
program
  .command('find-free')
  .description('Find available free time slots')
  .option('-s, --start <date>', 'Start date/time for search (default: now)')
  .option('-e, --end <date>', 'End date/time for search (default: +7d)')
  .option('-d, --duration <minutes>', 'Minimum duration in minutes (default: 30)', '30')
  .option('-w, --working-hours-only', 'Only search during working hours (9 AM - 5 PM)', false)
  .option('-c, --calendar <id>', 'Calendar ID or alias (default: all selected calendars)')
  .option('-j, --json', 'Output as JSON', false)
  .action(async (options) => {
    try {
      await findFreeTime({
        start: options.start,
        end: options.end,
        duration: parseInt(options.duration, 10),
        workingHoursOnly: options.workingHoursOnly,
        calendar: options.calendar,
        json: options.json,
      });
    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  });

// List configured calendars command
program
  .command('calendars')
  .description('List all configured calendars')
  .option('-j, --json', 'Output as JSON', false)
  .option('-f, --format <format>', 'Output format (compact for inline context)')
  .action(async (options) => {
    try {
      await listCalendars({
        json: options.json,
        format: options.format,
      });
    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  });

// Get timezone command
program
  .command('timezone')
  .description('Get user timezone from Google Calendar')
  .action(async () => {
    try {
      await getTimezone();
    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  });

// Auth test command (for setup/debugging)
program
  .command('auth')
  .description('Test OAuth authentication and connection')
  .action(async () => {
    try {
      const success = await testConnection();
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
