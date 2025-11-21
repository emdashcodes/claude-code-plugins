/**
 * Update calendar event command
 */

import { getCalendarService } from '../auth';
import { UpdateOptions, Event } from '../types';
import { parseDateTime, parseDuration, calculateEndTime, DEFAULT_CALENDAR_ID, getUserTimezone } from '../api';

/**
 * Find an event by ID or search query.
 *
 * @param service - Calendar service
 * @param eventIdOrQuery - Event ID or search query
 * @param calendarId - Calendar ID
 * @returns Event or null if not found
 */
async function findEvent(service: any, eventIdOrQuery: string, calendarId: string): Promise<Event | null> {
  // Try as event ID first
  try {
    const response = await service.events.get({
      calendarId,
      eventId: eventIdOrQuery,
    });
    return response.data;
  } catch {
    // Event ID not found, try search
  }

  // Search by text
  try {
    const response = await service.events.list({
      calendarId,
      q: eventIdOrQuery,
      maxResults: 1,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin: new Date().toISOString(),
    });

    const events = response.data.items || [];
    if (events.length > 0) {
      return events[0];
    }
  } catch (error) {
    console.error(`Error searching for event: ${error}`);
    process.exit(1);
  }

  return null;
}

/**
 * Update an existing calendar event.
 *
 * @param options - Command options
 */
export async function updateEvent(options: UpdateOptions): Promise<void> {
  const service = await getCalendarService();
  const calendarId = options.calendar || DEFAULT_CALENDAR_ID;
  const timezone = await getUserTimezone();

  // Find the event
  const eventIdOrQuery = options.eventId || options.query;
  if (!eventIdOrQuery) {
    console.error('Error: Must provide either --event-id or --query');
    process.exit(1);
  }

  const event = await findEvent(service, eventIdOrQuery, calendarId);
  if (!event) {
    console.error(`Event not found: ${eventIdOrQuery}`);
    process.exit(1);
  }

  console.error(`Found event: ${event.summary}`);

  // Update fields
  if (options.summary) {
    event.summary = options.summary;
  }

  if (options.start) {
    const startTime = parseDateTime(options.start);
    if (event.start?.dateTime) {
      event.start.dateTime = startTime;
      event.start.timeZone = timezone;
    } else if (event.start?.date) {
      const startDate = new Date(startTime);
      event.start.date = startDate.toISOString().split('T')[0];
    }
  }

  if (options.end) {
    const endTime = parseDateTime(options.end);
    if (event.end?.dateTime) {
      event.end.dateTime = endTime;
      event.end.timeZone = timezone;
    } else if (event.end?.date) {
      const endDate = new Date(endTime);
      event.end.date = endDate.toISOString().split('T')[0];
    }
  } else if (options.duration && event.start?.dateTime) {
    const durationMinutes = parseDuration(options.duration);
    const endTime = calculateEndTime(event.start.dateTime, durationMinutes);
    event.end = {
      dateTime: endTime,
      timeZone: timezone,
    };
  }

  if (options.location !== undefined) {
    event.location = options.location;
  }

  if (options.description !== undefined) {
    event.description = options.description;
  }

  if (options.attendees) {
    const attendeeEmails = options.attendees.split(',').map((email) => email.trim());
    event.attendees = attendeeEmails.map((email) => ({ email }));
  }

  // Update event
  try {
    const response = await service.events.update({
      calendarId,
      eventId: event.id!,
      requestBody: event,
    });

    const updatedEvent = response.data;

    if (options.json) {
      // Output as JSON
      console.log(JSON.stringify(updatedEvent, null, 2));
    } else {
      // Output formatted
      console.log('Event updated successfully!');
      console.log(`Title: ${updatedEvent.summary}`);
      console.log(`Start: ${updatedEvent.start?.dateTime || updatedEvent.start?.date}`);
      console.log(`End: ${updatedEvent.end?.dateTime || updatedEvent.end?.date}`);
      console.log(`Link: ${updatedEvent.htmlLink}`);
    }
  } catch (error) {
    console.error(`Error updating event: ${error}`);
    process.exit(1);
  }
}
