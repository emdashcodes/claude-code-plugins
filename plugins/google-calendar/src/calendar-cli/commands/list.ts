/**
 * List calendar events command
 */

import { getCalendarService } from '../auth';
import { ListOptions, EventWithCalendar } from '../types';
import { parseDateTime, formatEvent, DEFAULT_CALENDAR_ID } from '../api';
import { resolveCalendarIds, getCalendarName, loadConfig } from '../utils';

/**
 * List calendar events with optional filtering.
 * Supports querying multiple calendars and merging results.
 *
 * @param options - Command options
 */
export async function listEvents(options: ListOptions): Promise<void> {
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

  // Parse time bounds
  let timeMin: string | undefined;
  let timeMax: string | undefined;

  if (options.start) {
    timeMin = parseDateTime(options.start);
  } else if (!options.query) {
    // Default: show events starting from now if no query
    timeMin = new Date().toISOString();
  }

  if (options.end) {
    timeMax = parseDateTime(options.end);
  }

  // Query each calendar and collect all events
  const allEvents: EventWithCalendar[] = [];

  try {
    for (const calendarId of calendarIds) {
      // Build request parameters
      const params: any = {
        calendarId,
        maxResults: options.max || 10,
        singleEvents: true,
        orderBy: 'startTime',
      };

      if (timeMin) {
        params.timeMin = timeMin;
      }
      if (timeMax) {
        params.timeMax = timeMax;
      }
      if (options.query) {
        params.q = options.query;
      }

      // Execute request
      const response = await service.events.list(params);
      const events = response.data.items || [];

      // Add calendar information to each event
      for (const event of events) {
        const eventWithCalendar = event as EventWithCalendar;
        eventWithCalendar.calendarId = calendarId;
        eventWithCalendar.calendarName = getCalendarName(calendarId);
        allEvents.push(eventWithCalendar);
      }
    }

    // Sort all events by start time
    allEvents.sort((a, b) => {
      const aStart = a.start?.dateTime || a.start?.date || '';
      const bStart = b.start?.dateTime || b.start?.date || '';
      return aStart.localeCompare(bStart);
    });

    // Limit to max results
    const maxResults = options.max || 10;
    const limitedEvents = allEvents.slice(0, maxResults);

    if (options.json) {
      // Output as JSON
      console.log(JSON.stringify(limitedEvents, null, 2));
    } else {
      // Output formatted
      if (limitedEvents.length === 0) {
        console.log('No events found.');
      } else {
        const calendarCount = calendarIds.length;
        const calendarInfo = calendarCount > 1 ? ` across ${calendarCount} calendar(s)` : '';
        console.log(`Found ${limitedEvents.length} event(s)${calendarInfo}:\n`);

        // Group events by calendar if querying multiple calendars
        if (calendarIds.length > 1 && config.defaultBehavior.showCalendarLabels) {
          // Group events by calendar
          const eventsByCalendar = new Map<string, EventWithCalendar[]>();

          for (const event of limitedEvents) {
            if (!eventsByCalendar.has(event.calendarId)) {
              eventsByCalendar.set(event.calendarId, []);
            }
            eventsByCalendar.get(event.calendarId)!.push(event);
          }

          // Display grouped by calendar
          for (const calendarId of calendarIds) {
            const events = eventsByCalendar.get(calendarId);
            if (!events || events.length === 0) continue;

            const calendarName = getCalendarName(calendarId);
            console.log(`## ${calendarName}\n`);

            for (const event of events) {
              console.log(await formatEvent(event));
              console.log();
            }
          }
        } else {
          // Single calendar or labels disabled - show flat list
          for (const event of limitedEvents) {
            console.log(await formatEvent(event));
            console.log();
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching events: ${error}`);
    process.exit(1);
  }
}
