/**
 * Google Calendar OAuth Authentication
 *
 * Handles OAuth 2.0 authentication flow for Google Calendar API access.
 * Loads credentials from plugin directory and stores access tokens in plugin directory.
 *
 * Environment Variables:
 *   CALENDAR_CREDENTIALS_PATH: Optional path to OAuth credentials file
 *   CALENDAR_TOKEN_PATH: Optional path to store token (defaults to plugin directory)
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as http from 'http';
import { URL } from 'url';
import { getCredentialsPath, getTokenPath, fileExists, readJsonFile, writeJsonFile } from './utils';
import { CalendarListEntry } from './types';

// Scopes required for full calendar access
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Port for local OAuth redirect server
const REDIRECT_PORT = 3000;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

interface OAuthCredentials {
  installed?: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
  web?: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

interface TokenData {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

/**
 * Load OAuth credentials from file.
 *
 * @returns OAuth2Client configured with credentials
 */
function loadCredentials(): OAuth2Client {
  const credentialsPath = getCredentialsPath();

  if (!fileExists(credentialsPath)) {
    console.error(`Error: OAuth credentials not found at ${credentialsPath}`);
    console.error('Please ensure your OAuth credentials are stored at the correct location.');
    process.exit(1);
  }

  const credentials = readJsonFile<OAuthCredentials>(credentialsPath);
  const { client_id, client_secret } = credentials.installed || credentials.web || {};

  if (!client_id || !client_secret) {
    console.error('Error: Invalid credentials file format');
    process.exit(1);
  }

  return new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);
}

/**
 * Load existing token from file.
 *
 * @param oauth2Client - OAuth2 client to set credentials on
 * @returns true if token was loaded successfully, false otherwise
 */
function loadToken(oauth2Client: OAuth2Client): boolean {
  const tokenPath = getTokenPath();

  if (!fileExists(tokenPath)) {
    return false;
  }

  try {
    const token = readJsonFile<TokenData>(tokenPath);
    oauth2Client.setCredentials(token);
    return true;
  } catch (error) {
    console.error(`Warning: Could not load existing token: ${error}`);
    return false;
  }
}

/**
 * Save token to file.
 *
 * @param oauth2Client - OAuth2 client with credentials
 */
function saveToken(oauth2Client: OAuth2Client): void {
  const tokenPath = getTokenPath();
  const credentials = oauth2Client.credentials;

  try {
    writeJsonFile(tokenPath, credentials);
    console.error(`Token saved to ${tokenPath}`);
  } catch (error) {
    console.error(`Warning: Could not save token: ${error}`);
  }
}

/**
 * Run OAuth flow by opening browser and starting local server.
 *
 * @param oauth2Client - OAuth2 client
 * @returns Promise that resolves when authorization is complete
 */
async function runOAuthFlow(oauth2Client: OAuth2Client): Promise<void> {
  return new Promise((resolve, reject) => {
    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.error('Starting OAuth authorization flow...');
    console.error('A browser window will open for authorization.');
    console.error(`If it doesn't open automatically, visit: ${authUrl}`);

    // Create local server to receive OAuth callback
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url) {
          return;
        }

        const url = new URL(req.url, REDIRECT_URI);
        const code = url.searchParams.get('code');

        if (code) {
          // Send success response to browser
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>Authorization successful!</h1>
                <p>You can close this window and return to your terminal.</p>
              </body>
            </html>
          `);

          // Exchange code for tokens
          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);

          console.error('Authorization successful!');

          // Close server
          server.close();
          resolve();
        } else {
          // Error in OAuth flow
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Authorization failed</h1><p>No code received.</p>');
          server.close();
          reject(new Error('No authorization code received'));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>Error</h1><p>${error}</p>`);
        server.close();
        reject(error);
      }
    });

    // Start server
    server.listen(REDIRECT_PORT, async () => {
      // Open browser
      try {
        const open = (await import('open')).default;
        await open(authUrl);
      } catch (error) {
        console.error(`Could not open browser automatically: ${error}`);
        console.error(`Please open this URL in your browser: ${authUrl}`);
      }
    });
  });
}

/**
 * Get authenticated OAuth2 client.
 *
 * Handles OAuth flow:
 * 1. Check for existing token
 * 2. Refresh if expired
 * 3. Run OAuth flow if needed
 * 4. Save token for future use
 *
 * @returns Authenticated OAuth2 client
 */
export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  const oauth2Client = loadCredentials();

  // Try to load existing token
  const hasToken = loadToken(oauth2Client);

  // Check if token is valid or needs refresh
  if (hasToken) {
    const credentials = oauth2Client.credentials;

    // Check if token is expired
    if (credentials.expiry_date && credentials.expiry_date < Date.now()) {
      // Token is expired, try to refresh
      if (credentials.refresh_token) {
        console.error('🔄 Refreshing expired access token...');
        try {
          await oauth2Client.refreshAccessToken();
          saveToken(oauth2Client);
          return oauth2Client;
        } catch (error) {
          console.error(`Error refreshing token: ${error}`);
          console.error('Running OAuth flow to get new credentials...');
        }
      }
    } else {
      // Token is still valid
      return oauth2Client;
    }
  }

  // No valid token, run OAuth flow
  await runOAuthFlow(oauth2Client);
  saveToken(oauth2Client);

  return oauth2Client;
}

/**
 * Get authenticated Google Calendar service.
 *
 * @returns Calendar API service
 */
export async function getCalendarService() {
  try {
    const auth = await getAuthenticatedClient();
    return google.calendar({ version: 'v3', auth });
  } catch (error) {
    console.error(`Error building Calendar API service: ${error}`);
    process.exit(1);
  }
}

/**
 * Test Calendar API connection by fetching calendar list.
 *
 * @returns true if connection successful, false otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    const service = await getCalendarService();

    console.error('Testing connection by fetching calendar list...');
    const response = await service.calendarList.list();
    const calendars = response.data.items || [];

    console.error('\nSuccessfully connected to Google Calendar!');
    console.error(`Found ${calendars.length} calendars:\n`);

    for (const calendar of calendars) {
      console.error(`  • ${calendar.summary || 'Unknown'} (${calendar.id})`);
    }

    return true;
  } catch (error) {
    console.error(`Connection test failed: ${error}`);
    return false;
  }
}

/**
 * List all accessible calendars.
 *
 * @returns Array of calendar list entries
 */
export async function listAllCalendars(): Promise<CalendarListEntry[]> {
  try {
    const service = await getCalendarService();
    const response = await service.calendarList.list();
    return response.data.items || [];
  } catch (error) {
    console.error(`Error fetching calendar list: ${error}`);
    throw error;
  }
}

/**
 * Get the user's timezone from their primary calendar.
 *
 * @returns Timezone string (e.g., 'America/Los_Angeles')
 */
export async function getCalendarTimezone(): Promise<string> {
  try {
    const service = await getCalendarService();
    const response = await service.calendars.get({ calendarId: 'primary' });
    return response.data.timeZone || 'America/Los_Angeles';
  } catch (error) {
    console.error(`Error fetching calendar timezone: ${error}`);
    return 'America/Los_Angeles'; // Fallback
  }
}
