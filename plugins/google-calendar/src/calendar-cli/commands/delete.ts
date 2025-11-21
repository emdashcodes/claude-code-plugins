/**
 * Delete calendar event command
 */

import { getCalendarService } from '../auth';
import { DeleteOptions, Event } from '../types';
import { DEFAULT_CALENDAR_ID } from '../api';
import * as readline from 'readline';

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
 * Prompt user for confirmation.
 *
 * @param question - Question to ask
 * @returns Promise resolving to true if user confirms, false otherwise
 */
function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Delete a calendar event.
 *
 * @param options - Command options
 */
export async function deleteEvent(options: DeleteOptions): Promise<void> {
  const service = await getCalendarService();
  const calendarId = options.calendar || DEFAULT_CALENDAR_ID;

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
  console.error(`Start: ${event.start?.dateTime || event.start?.date}`);
  console.error(`End: ${event.end?.dateTime || event.end?.date}`);

  // Confirm deletion unless --force is used
  if (!options.force) {
    const confirmed = await confirm('Are you sure you want to delete this event? (y/N) ');
    if (!confirmed) {
      console.error('Deletion cancelled');
      process.exit(0);
    }
  }

  // Delete event
  try {
    await service.events.delete({
      calendarId,
      eventId: event.id!,
    });

    if (options.json) {
      console.log(JSON.stringify({ success: true, eventId: event.id }, null, 2));
    } else {
      console.log('Event deleted successfully!');
    }
  } catch (error) {
    console.error(`Error deleting event: ${error}`);
    process.exit(1);
  }
}
