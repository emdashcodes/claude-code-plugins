/**
 * Google Calendar API helper functions
 */

import { calendar_v3 } from 'googleapis';
import { Event, ParsedEvent, TimeSlot } from './types';
import { getCalendarTimezone } from './auth';

/**
 * Default calendar ID (primary calendar)
 */
export const DEFAULT_CALENDAR_ID = 'primary';

/**
 * Cached timezone value to avoid repeated API calls
 */
let cachedTimezone: string | null = null;

/**
 * Get the user's timezone from their Google Calendar.
 * Fetches from Google Calendar API and caches for the session.
 */
export async function getUserTimezone(): Promise<string> {
  if (cachedTimezone) {
    return cachedTimezone;
  }

  try {
    cachedTimezone = await getCalendarTimezone();
    return cachedTimezone;
  } catch {
    // Fallback to America/Los_Angeles if fetch fails
    return 'America/Los_Angeles';
  }
}

/**
 * Parse datetime string to ISO format.
 * Supports:
 * - ISO format: 2024-01-15T10:00:00
 * - Date only: 2024-01-15
 * - Relative: today, tomorrow, +1d, +2h
 *
 * @param dateStr - Date/time string to parse
 * @param baseDate - Base date for relative calculations (defaults to now)
 * @returns ISO datetime string
 */
export function parseDateTime(dateStr: string, baseDate: Date = new Date()): string {
  // Handle relative dates
  if (dateStr === 'today') {
    const today = new Date(baseDate);
    today.setHours(0, 0, 0, 0);
    return today.toISOString();
  }

  if (dateStr === 'tomorrow') {
    const tomorrow = new Date(baseDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  if (dateStr === 'now') {
    return baseDate.toISOString();
  }

  // Handle relative offsets (+1d, +2h, +30m, etc.)
  const relativeMatch = dateStr.match(/^([+-])(\d+)([hdm])$/);
  if (relativeMatch) {
    const [, sign, amount, unit] = relativeMatch;
    const delta = parseInt(amount, 10) * (sign === '+' ? 1 : -1);
    const result = new Date(baseDate);

    switch (unit) {
      case 'd':
        result.setDate(result.getDate() + delta);
        break;
      case 'h':
        result.setHours(result.getHours() + delta);
        break;
      case 'm':
        result.setMinutes(result.getMinutes() + delta);
        break;
    }

    return result.toISOString();
  }

  // Try parsing as ISO or standard date format
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  return parsed.toISOString();
}

/**
 * Parse duration string to minutes.
 * Supports: 30m, 1h, 1h30m, 90m
 *
 * @param durationStr - Duration string
 * @returns Duration in minutes
 */
export function parseDuration(durationStr: string): number {
  const match = durationStr.match(/^(?:(\d+)h)?(?:(\d+)m)?$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${durationStr}. Use format like: 30m, 1h, 1h30m`);
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);

  return hours * 60 + minutes;
}

/**
 * Calculate end time from start time and duration.
 *
 * @param startTime - Start time ISO string
 * @param durationMinutes - Duration in minutes
 * @returns End time ISO string
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return end.toISOString();
}

/**
 * Format event for human-readable display.
 *
 * @param event - Calendar event
 * @param timezone - Timezone for display
 * @returns Formatted string
 */
export async function formatEvent(event: Event, timezone?: string): Promise<string> {
  const tz = timezone || await getUserTimezone();
  const parts: string[] = [];

  // Title
  parts.push(`${event.summary || '(No title)'}`);

  // Time
  if (event.start?.dateTime && event.end?.dateTime) {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    parts.push(`   ${formatDateTime(start, tz)} - ${formatTime(end, tz)}`);
  } else if (event.start?.date && event.end?.date) {
    parts.push(`   All day: ${event.start.date}`);
  }

  // Location
  if (event.location) {
    parts.push(`   Location: ${event.location}`);
  }

  // Description (truncate if too long)
  if (event.description) {
    const desc = event.description.length > 100
      ? event.description.substring(0, 97) + '...'
      : event.description;
    parts.push(`   Description: ${desc}`);
  }

  // Attendees
  if (event.attendees && event.attendees.length > 0) {
    const attendeeList = event.attendees
      .map((a) => a.email)
      .join(', ');
    parts.push(`   Attendees: ${attendeeList}`);
  }

  // Link
  if (event.htmlLink) {
    parts.push(`   Link: ${event.htmlLink}`);
  }

  // ID (for reference)
  parts.push(`   ID: ${event.id}`);

  return parts.join('\n');
}

/**
 * Format date and time for display.
 *
 * @param date - Date to format
 * @param timezone - Timezone for display
 * @returns Formatted string (e.g., "Mon Jan 15, 2024 at 10:00 AM")
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
 *
 * @param date - Date to format
 * @param timezone - Timezone for display
 * @returns Formatted string (e.g., "10:00 AM")
 */
function formatTime(date: Date, timezone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  };
  return date.toLocaleString('en-US', options);
}

/**
 * Convert event to parsed event data.
 *
 * @param event - Calendar event
 * @returns Parsed event data
 */
export function parseEventData(event: Event): ParsedEvent {
  return {
    id: event.id || '',
    summary: event.summary || '(No title)',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    location: event.location || undefined,
    description: event.description || undefined,
    attendees: event.attendees?.map((a) => a.email || '') || [],
    htmlLink: event.htmlLink || undefined,
  };
}

/**
 * Find free time slots within a time range.
 *
 * @param busySlots - Busy time slots from freebusy query
 * @param start - Search start time
 * @param end - Search end time
 * @param durationMinutes - Minimum duration for free slots
 * @param workingHoursOnly - Only include working hours (9 AM - 5 PM)
 * @returns Array of free time slots
 */
export function findFreeSlots(
  busySlots: TimeSlot[],
  start: Date,
  end: Date,
  durationMinutes: number,
  workingHoursOnly: boolean = false
): TimeSlot[] {
  const freeSlots: TimeSlot[] = [];
  let currentStart = new Date(start);

  // Sort busy slots by start time
  const sorted = [...busySlots].sort((a, b) =>
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  for (const busy of sorted) {
    const busyStart = new Date(busy.start);
    const busyEnd = new Date(busy.end);

    // Check if there's a gap before this busy slot
    if (currentStart < busyStart) {
      const slotEnd = busyStart;
      addFreeSlot(freeSlots, currentStart, slotEnd, durationMinutes, workingHoursOnly);
    }

    // Move current start to end of busy period
    currentStart = busyEnd > currentStart ? busyEnd : currentStart;
  }

  // Check for gap after last busy slot
  if (currentStart < end) {
    addFreeSlot(freeSlots, currentStart, end, durationMinutes, workingHoursOnly);
  }

  return freeSlots;
}

/**
 * Add free slot if it meets duration and working hours requirements.
 */
function addFreeSlot(
  slots: TimeSlot[],
  start: Date,
  end: Date,
  durationMinutes: number,
  workingHoursOnly: boolean
): void {
  const durationMs = durationMinutes * 60 * 1000;

  // Check if slot is long enough
  if (end.getTime() - start.getTime() < durationMs) {
    return;
  }

  if (workingHoursOnly) {
    // Filter to working hours (9 AM - 5 PM)
    const workStart = new Date(start);
    workStart.setHours(9, 0, 0, 0);

    const workEnd = new Date(start);
    workEnd.setHours(17, 0, 0, 0);

    const slotStart = start < workStart ? workStart : start;
    const slotEnd = end > workEnd ? workEnd : end;

    if (slotEnd.getTime() - slotStart.getTime() >= durationMs) {
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      });
    }
  } else {
    slots.push({
      start: start.toISOString(),
      end: end.toISOString(),
    });
  }
}
