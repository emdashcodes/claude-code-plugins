/**
 * Find free time command
 */

import { getCalendarService } from '../auth';
import { FindFreeOptions, TimeSlot } from '../types';
import { parseDateTime, findFreeSlots, DEFAULT_CALENDAR_ID, getUserTimezone } from '../api';
import { resolveCalendarIds, loadConfig } from '../utils';

/**
 * Find available free time slots.
 * Supports querying multiple calendars and finding times free across ALL calendars.
 *
 * @param options - Command options
 */
export async function findFreeTime(options: FindFreeOptions): Promise<void> {
  const service = await getCalendarService();
  const config = loadConfig();

  // Resolve calendar IDs (if -c flag provided, use that; otherwise use all selected calendars)
  let calendarIds: string[];
  if (options.calendar) {
    calendarIds = resolveCalendarIds(options.calendar);
  } else if (config.calendars.length > 0 && config.defaultBehavior.queryAllByDefault) {
    // Use all selected calendars from config
    calendarIds = resolveCalendarIds();
  } else {
    // Fallback to primary calendar if no config
    calendarIds = [DEFAULT_CALENDAR_ID];
  }

  // Parse date range
  let startDate: Date;
  if (options.start) {
    startDate = new Date(parseDateTime(options.start));
  } else {
    startDate = new Date();
  }

  let endDate: Date;
  if (options.end) {
    endDate = new Date(parseDateTime(options.end));
  } else {
    // Default: 7 days from start
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
  }

  const durationMinutes = options.duration || 30;
  const workingHoursOnly = options.workingHoursOnly || false;

  // Fetch all events from all calendars and merge busy slots
  try {
    const busySlots: TimeSlot[] = [];

    // Query each calendar for busy times
    for (const calendarId of calendarIds) {
      const response = await service.events.list({
        calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      // Add busy times from this calendar
      for (const event of events) {
        // Skip all-day events
        if (event.start?.date) {
          continue;
        }

        if (event.start?.dateTime && event.end?.dateTime) {
          busySlots.push({
            start: event.start.dateTime,
            end: event.end.dateTime,
          });
        }
      }
    }

    // Find free slots (accounts for all busy times across all calendars)
    const freeSlots = findFreeSlots(
      busySlots,
      startDate,
      endDate,
      durationMinutes,
      workingHoursOnly
    );

    if (options.json) {
      // Output as JSON
      console.log(JSON.stringify(freeSlots, null, 2));
    } else {
      // Output formatted
      const calendarCount = calendarIds.length;
      const calendarInfo = calendarCount > 1 ? ` across ${calendarCount} calendar(s)` : '';

      if (freeSlots.length === 0) {
        console.log(`No free time slots found${calendarInfo}.`);
      } else {
        console.log(`Found ${freeSlots.length} free time slot(s)${calendarInfo} (${durationMinutes} minutes or more):\n`);
        const timezone = await getUserTimezone();
        for (const slot of freeSlots) {
          const start = new Date(slot.start);
          const end = new Date(slot.end);
          const durationMs = end.getTime() - start.getTime();
          const durationMins = Math.floor(durationMs / 60000);

          console.log(`${formatDateTime(start, timezone)} - ${formatTime(end, timezone)}`);
          console.log(`   Duration: ${durationMins} minutes`);
          console.log();
        }
      }
    }
  } catch (error) {
    console.error(`Error finding free time: ${error}`);
    process.exit(1);
  }
}

/**
 * Format date and time for display.
 */
function formatDateTime(date: Date, timezone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  };
  return date.toLocaleString('en-US', options);
}

/**
 * Format time only for display.
 */
function formatTime(date: Date, timezone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  };
  return date.toLocaleString('en-US', options);
}
