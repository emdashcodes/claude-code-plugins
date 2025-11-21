/**
 * Create calendar event command
 */

import { getCalendarService } from '../auth';
import { CreateOptions, Event } from '../types';
import { parseDateTime, parseDuration, calculateEndTime, DEFAULT_CALENDAR_ID, getUserTimezone } from '../api';

/**
 * Create a calendar event.
 *
 * @param options - Command options
 */
export async function createEvent(options: CreateOptions): Promise<void> {
  const service = await getCalendarService();
  const calendarId = options.calendar || DEFAULT_CALENDAR_ID;
  const timezone = await getUserTimezone();

  // Parse start time (default to now if not specified)
  let startTime: string;
  if (options.start) {
    startTime = parseDateTime(options.start);
  } else {
    startTime = new Date().toISOString();
  }

  // Calculate end time
  let endTime: string;
  if (options.end) {
    endTime = parseDateTime(options.end);
  } else if (options.duration) {
    const durationMinutes = parseDuration(options.duration);
    endTime = calculateEndTime(startTime, durationMinutes);
  } else {
    // Default: 1 hour
    endTime = calculateEndTime(startTime, 60);
  }

  // Build event object
  const event: any = {
    summary: options.summary,
  };

  // Set time fields based on all-day vs timed event
  if (options.allDay) {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    event.start = { date: startDate.toISOString().split('T')[0] };
    event.end = { date: endDate.toISOString().split('T')[0] };
  } else {
    event.start = {
      dateTime: startTime,
      timeZone: timezone,
    };
    event.end = {
      dateTime: endTime,
      timeZone: timezone,
    };
  }

  // Optional fields
  if (options.description) {
    event.description = options.description;
  }
  if (options.location) {
    event.location = options.location;
  }
  if (options.attendees) {
    const attendeeEmails = options.attendees.split(',').map((email) => email.trim());
    event.attendees = attendeeEmails.map((email) => ({ email }));
  }

  // Create event
  try {
    const response = await service.events.insert({
      calendarId,
      requestBody: event,
    });

    const createdEvent = response.data;

    if (options.json) {
      // Output as JSON
      console.log(JSON.stringify(createdEvent, null, 2));
    } else {
      // Output formatted
      console.log('Event created successfully!');
      console.log(`Title: ${createdEvent.summary}`);
      console.log(`Start: ${createdEvent.start?.dateTime || createdEvent.start?.date}`);
      console.log(`End: ${createdEvent.end?.dateTime || createdEvent.end?.date}`);
      console.log(`Link: ${createdEvent.htmlLink}`);
    }
  } catch (error) {
    console.error(`Error creating event: ${error}`);
    process.exit(1);
  }
}
