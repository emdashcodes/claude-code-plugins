/**
 * TypeScript type definitions for Google Calendar CLI
 */

import { calendar_v3 } from 'googleapis';

// Re-export googleapis types for convenience
export type Calendar = calendar_v3.Schema$Calendar;
export type CalendarList = calendar_v3.Schema$CalendarList;
export type CalendarListEntry = calendar_v3.Schema$CalendarListEntry;
export type Event = calendar_v3.Schema$Event;
export type Events = calendar_v3.Schema$Events;
export type EventDateTime = calendar_v3.Schema$EventDateTime;
export type EventAttendee = calendar_v3.Schema$EventAttendee;
export type FreeBusyRequest = calendar_v3.Schema$FreeBusyRequest;
export type FreeBusyResponse = calendar_v3.Schema$FreeBusyResponse;

/**
 * Command options for listing events
 */
export interface ListOptions {
  calendar?: string;
  start?: string;
  end?: string;
  max?: number;
  query?: string;
  json?: boolean;
}

/**
 * Command options for creating events
 */
export interface CreateOptions {
  summary: string;
  start?: string;
  end?: string;
  duration?: string;
  location?: string;
  description?: string;
  attendees?: string;
  allDay?: boolean;
  calendar?: string;
  json?: boolean;
}

/**
 * Command options for updating events
 */
export interface UpdateOptions {
  eventId?: string;
  query?: string;
  summary?: string;
  start?: string;
  end?: string;
  duration?: string;
  location?: string;
  description?: string;
  attendees?: string;
  calendar?: string;
  json?: boolean;
}

/**
 * Command options for deleting events
 */
export interface DeleteOptions {
  eventId?: string;
  query?: string;
  calendar?: string;
  force?: boolean;
  json?: boolean;
}

/**
 * Command options for finding free time
 */
export interface FindFreeOptions {
  start?: string;
  end?: string;
  duration?: number;
  workingHoursOnly?: boolean;
  calendar?: string;
  json?: boolean;
}

/**
 * Parsed event data for display
 */
export interface ParsedEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  attendees?: string[];
  htmlLink?: string;
}

/**
 * Free/busy time slot
 */
export interface TimeSlot {
  start: string;
  end: string;
}

/**
 * Result of event operation
 */
export interface EventOperationResult {
  success: boolean;
  event?: Event;
  error?: string;
}

/**
 * Calendar configuration for a single calendar
 */
export interface CalendarConfig {
  id: string;           // Google Calendar ID
  summary: string;      // Name from Google
  alias?: string;       // User-friendly name
  selected: boolean;    // Include in default queries
  primary?: boolean;    // Whether this is the primary calendar
  accessRole?: string;  // User's access level (owner, writer, reader, etc.)
}

/**
 * Configuration file schema
 */
export interface Config {
  calendars: CalendarConfig[];
  defaultBehavior: {
    queryAllByDefault: boolean;  // Query all selected calendars by default
    showCalendarLabels: boolean; // Show which calendar each event belongs to
  };
  timezone?: string;  // User's calendar timezone
}

/**
 * Event with calendar information
 */
export interface EventWithCalendar extends Event {
  calendarId: string;
  calendarName: string;  // Alias if available, otherwise summary
}
