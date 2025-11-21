/**
 * OAuth authentication for Google Gmail API with multi-profile support
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as http from 'http';
import { URL } from 'url';
import open from 'open';
import { GmailError, OAuthCredentials } from './types.js';
import { getOAuthPath, getTokenPath, resolvePath } from './config.js';

// OAuth2 scopes required for Gmail access
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.settings.basic',
];

const REDIRECT_PORT = 3000;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

/**
 * Load OAuth2 credentials from file for a specific profile
 */
function loadCredentials(profileName?: string): { client_id: string; client_secret: string; redirect_uris: string[] } {
  const credPath = resolvePath(getOAuthPath(profileName));

  if (!fs.existsSync(credPath)) {
    throw new GmailError(
      `OAuth credentials not found at ${credPath}. Please run the setup command first.`,
      'CREDENTIALS_NOT_FOUND',
      { path: credPath }
    );
  }

  try {
    const content = fs.readFileSync(credPath, 'utf-8');
    const credentials: OAuthCredentials = JSON.parse(content);

    // Handle both Desktop app format and Web app format
    if (credentials.installed) {
      return credentials.installed;
    } else if (credentials.web) {
      return credentials.web;
    } else {
      throw new Error('Invalid credentials format');
    }
  } catch (error) {
    throw new GmailError(
      'Failed to load OAuth credentials',
      'CREDENTIALS_INVALID',
      error
    );
  }
}

/**
 * Create OAuth2 client for a specific profile
 */
export function createOAuth2Client(profileName?: string): OAuth2Client {
  const credentials = loadCredentials(profileName);
  const { client_id, client_secret } = credentials;

  return new google.auth.OAuth2(
    client_id,
    client_secret,
    REDIRECT_URI
  );
}

/**
 * Get authorization URL for OAuth flow
 */
export function getAuthUrl(client: OAuth2Client): string {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokenFromCode(
  client: OAuth2Client,
  code: string,
  profileName?: string
): Promise<void> {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  saveToken(tokens, profileName);
}

/**
 * Save tokens to file for a specific profile
 */
function saveToken(tokens: unknown, profileName?: string): void {
  const tokenPath = resolvePath(getTokenPath(profileName));

  // Ensure directory exists
  const dir = require('path').dirname(tokenPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
  fs.chmodSync(tokenPath, 0o600); // Secure permissions
}

/**
 * Load tokens from file for a specific profile
 */
function loadToken(profileName?: string): unknown | null {
  const tokenPath = resolvePath(getTokenPath(profileName));

  if (!fs.existsSync(tokenPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(tokenPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load token:', error);
    return null;
  }
}

/**
 * Get authenticated OAuth2 client for a specific profile
 * Loads existing token or throws error if not authenticated
 */
export async function getAuthenticatedClient(profileName?: string): Promise<OAuth2Client> {
  const client = createOAuth2Client(profileName);
  const token = loadToken(profileName);

  if (token) {
    client.setCredentials(token);

    // Check if token needs refresh
    try {
      await client.getAccessToken();
      return client;
    } catch (error) {
      console.log('Token expired or invalid, attempting to refresh...');
      try {
        await refreshTokenIfNeeded(client, profileName);
        return client;
      } catch (refreshError) {
        console.error('Token refresh failed');
      }
    }
  }

  // If we get here, we need to authenticate
  const profileMsg = profileName ? ` for profile '${profileName}'` : '';
  throw new GmailError(
    `Not authenticated${profileMsg}. Please run 'google-gmail accounts add ${profileName || 'default'}' first.`,
    'NOT_AUTHENTICATED'
  );
}

/**
 * Run interactive OAuth flow
 * Opens browser for user authorization and starts local server to receive callback
 */
export async function authenticateInteractive(profileName?: string): Promise<OAuth2Client> {
  const client = createOAuth2Client(profileName);
  const authUrl = getAuthUrl(client);

  const profileMsg = profileName ? ` for profile '${profileName}'` : '';
  console.log(`\nOpening browser for Google authorization${profileMsg}...\n`);
  console.log('If the browser doesn\'t open, visit this URL:');
  console.log(authUrl);
  console.log('');

  return new Promise((resolve, reject) => {
    let authHandled = false;

    // Create local server to receive OAuth callback
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url) {
          return;
        }

        // Ignore requests that aren't the OAuth callback (e.g., favicon)
        if (!req.url.startsWith('/?')) {
          res.writeHead(404);
          res.end();
          return;
        }

        // If we've already handled auth, ignore subsequent requests
        if (authHandled) {
          res.writeHead(200);
          res.end('Already authenticated');
          return;
        }

        const url = new URL(req.url, REDIRECT_URI);
        const code = url.searchParams.get('code');

        if (code) {
          authHandled = true;
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
          try {
            await getTokenFromCode(client, code, profileName);
            console.log('\nAuthentication successful!\n');
            server.close();
            resolve(client);
          } catch (error) {
            console.error('\nToken exchange failed:', error);
            server.close();
            reject(new GmailError(
              'Authentication failed',
              'AUTH_FAILED',
              error
            ));
          }
        } else {
          // Error in OAuth flow
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Authorization failed</h1><p>No code received.</p>');
          server.close();
          reject(new GmailError(
            'No authorization code received',
            'AUTH_FAILED'
          ));
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
        await open(authUrl);
      } catch (error) {
        console.error(`Could not open browser automatically: ${error}`);
        console.error(`Please open this URL in your browser: ${authUrl}`);
      }
    });
  });
}

/**
 * Test connection to Google Gmail API
 */
export async function testConnection(profileName?: string): Promise<{ success: boolean; email?: string }> {
  try {
    const client = await getAuthenticatedClient(profileName);
    const gmail = google.gmail({ version: 'v1', auth: client });

    const profileMsg = profileName ? ` (profile: ${profileName})` : '';
    console.log(`Testing Google Gmail API access${profileMsg}...`);

    // Get user profile
    const profile = await gmail.users.getProfile({ userId: 'me' });
    console.log(`\nConnection successful!`);
    console.log(`Email: ${profile.data.emailAddress}`);
    console.log(`Total messages: ${profile.data.messagesTotal}`);
    console.log(`Total threads: ${profile.data.threadsTotal}`);

    // List a few recent messages
    const messages = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 5,
    });

    if (messages.data.messages && messages.data.messages.length > 0) {
      console.log(`\nRecent messages: ${messages.data.messages.length}`);
    }
    console.log('');

    return { success: true, email: profile.data.emailAddress || undefined };
  } catch (error) {
    console.error('\nConnection failed:', error);
    return { success: false };
  }
}

/**
 * Refresh token if needed
 */
export async function refreshTokenIfNeeded(client: OAuth2Client, profileName?: string): Promise<void> {
  try {
    const accessToken = client.credentials.access_token;
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const tokenInfo = await client.getTokenInfo(accessToken);

    // If token expires in less than 5 minutes, refresh it
    if (tokenInfo.expiry_date && tokenInfo.expiry_date < Date.now() + 5 * 60 * 1000) {
      const { credentials } = await client.refreshAccessToken();
      client.setCredentials(credentials);
      saveToken(credentials, profileName);
    }
  } catch (error) {
    // If we can't check or refresh, try to refresh anyway
    try {
      const { credentials } = await client.refreshAccessToken();
      client.setCredentials(credentials);
      saveToken(credentials, profileName);
    } catch (refreshError) {
      throw new GmailError(
        'Failed to refresh token',
        'TOKEN_REFRESH_FAILED',
        refreshError
      );
    }
  }
}
