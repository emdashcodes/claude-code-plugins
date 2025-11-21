/**
 * Shared utilities for Google Calendar CLI.
 *
 * Provides common path resolution and token management functions.
 */

import * as path from 'path';
import * as fs from 'fs';
import { Config, CalendarConfig } from './types';

/**
 * Get plugin root directory.
 * When running from the distributed location, we're at:
 * skills/google-calendar/scripts/dist/calendar-cli/
 * So we need to go up 5 levels to reach the plugin root.
 */
export function getPluginRoot(): string {
  return path.resolve(__dirname, '../../../../..');
}

/**
 * Get path to OAuth credentials file.
 *
 * Checks environment variable CALENDAR_CREDENTIALS_PATH first,
 * then defaults to plugin directory.
 *
 * @returns Credentials file path
 */
export function getCredentialsPath(): string {
  // Check for environment variable override
  const envPath = process.env.CALENDAR_CREDENTIALS_PATH;
  if (envPath) {
    return envPath;
  }

  // Default to plugin directory
  return path.join(getPluginRoot(), 'google-calendar-oauth.json');
}

/**
 * Get path to token storage file.
 *
 * Checks environment variable CALENDAR_TOKEN_PATH first,
 * then defaults to plugin directory.
 *
 * @returns Token file path
 */
export function getTokenPath(): string {
  // Check for environment variable override
  const envPath = process.env.CALENDAR_TOKEN_PATH;
  if (envPath) {
    return envPath;
  }

  // Default to plugin directory
  return path.join(getPluginRoot(), 'google-calendar-token.json');
}

/**
 * Check if a file exists.
 *
 * @param filePath - Path to check
 * @returns true if file exists, false otherwise
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Read JSON file.
 *
 * @param filePath - Path to JSON file
 * @returns Parsed JSON object
 */
export function readJsonFile<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Write JSON file.
 *
 * @param filePath - Path to JSON file
 * @param data - Data to write
 */
export function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Get path to calendar configuration file.
 *
 * Checks environment variable CALENDAR_CONFIG_PATH first,
 * then defaults to plugin directory.
 *
 * @returns Config file path
 */
export function getConfigPath(): string {
  // Check for environment variable override
  const envPath = process.env.CALENDAR_CONFIG_PATH;
  if (envPath) {
    return envPath;
  }

  // Default to plugin directory
  return path.join(getPluginRoot(), 'google-calendar-config.json');
}

/**
 * Load calendar configuration from file.
 * Returns default config if file doesn't exist.
 *
 * @returns Calendar configuration
 */
export function loadConfig(): Config {
  const configPath = getConfigPath();

  // Return default config if file doesn't exist
  if (!fileExists(configPath)) {
    return {
      calendars: [],
      defaultBehavior: {
        queryAllByDefault: true,
        showCalendarLabels: true,
      },
    };
  }

  try {
    return readJsonFile<Config>(configPath);
  } catch (error) {
    console.error(`Error loading config from ${configPath}:`, error);
    // Return default config on error
    return {
      calendars: [],
      defaultBehavior: {
        queryAllByDefault: true,
        showCalendarLabels: true,
      },
    };
  }
}

/**
 * Save calendar configuration to file.
 *
 * @param config - Configuration to save
 */
export function saveConfig(config: Config): void {
  const configPath = getConfigPath();
  writeJsonFile(configPath, config);
}

/**
 * Get all calendars marked as selected for default queries.
 *
 * @returns Array of selected calendar configurations
 */
export function getSelectedCalendars(): CalendarConfig[] {
  const config = loadConfig();
  return config.calendars.filter(cal => cal.selected);
}

/**
 * Resolve calendar identifier (ID or alias) to calendar ID.
 * If no identifier provided, returns IDs of all selected calendars.
 *
 * @param identifier - Calendar ID or alias (optional)
 * @returns Array of calendar IDs
 */
export function resolveCalendarIds(identifier?: string): string[] {
  const config = loadConfig();

  // If no identifier, return all selected calendars
  if (!identifier) {
    return config.calendars
      .filter(cal => cal.selected)
      .map(cal => cal.id);
  }

  // Try to find by alias first
  const byAlias = config.calendars.find(
    cal => cal.alias?.toLowerCase() === identifier.toLowerCase()
  );
  if (byAlias) {
    return [byAlias.id];
  }

  // Try to find by ID
  const byId = config.calendars.find(cal => cal.id === identifier);
  if (byId) {
    return [byId.id];
  }

  // Not found in config, return as-is (might be a valid calendar ID not in config)
  return [identifier];
}

/**
 * Get calendar name (alias if available, otherwise summary).
 *
 * @param calendarId - Calendar ID
 * @returns Calendar display name
 */
export function getCalendarName(calendarId: string): string {
  const config = loadConfig();
  const calendar = config.calendars.find(cal => cal.id === calendarId);

  if (!calendar) {
    return calendarId; // Fallback to ID if not found
  }

  return calendar.alias || calendar.summary;
}
