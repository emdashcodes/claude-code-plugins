/**
 * Get user timezone command
 */

import { getUserTimezone } from '../api';

/**
 * Get and display the user's timezone.
 */
export async function getTimezone(): Promise<void> {
  try {
    const timezone = await getUserTimezone();
    console.log(timezone);
  } catch (error) {
    console.error(`Error getting timezone: ${error}`);
    process.exit(1);
  }
}
