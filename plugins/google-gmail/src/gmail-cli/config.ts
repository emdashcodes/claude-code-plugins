import * as fs from 'fs';
import * as path from 'path';
import { GmailConfig, ProfileConfig, GmailError } from './types.js';

// Use CLAUDE_PLUGIN_ROOT if set (from wrapper), otherwise calculate from __dirname
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT
  ? process.env.CLAUDE_PLUGIN_ROOT
  : path.resolve(__dirname, '../../../../..');
const CONFIG_FILE = path.join(PLUGIN_ROOT, 'google-gmail-config.json');
const PROFILES_DIR = path.join(PLUGIN_ROOT, 'profiles');

/**
 * Load configuration from file
 */
export function loadConfig(): GmailConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {
      defaultProfile: 'default',
      profiles: {}
    };
  }

  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new GmailError(
      `Failed to load configuration: ${(error as Error).message}`,
      'CONFIG_LOAD_ERROR',
      error
    );
  }
}

/**
 * Save configuration to file
 */
export function saveConfig(config: GmailConfig): void {
  try {
    const content = JSON.stringify(config, null, 2);
    fs.writeFileSync(CONFIG_FILE, content, { mode: 0o600 });
  } catch (error) {
    throw new GmailError(
      `Failed to save configuration: ${(error as Error).message}`,
      'CONFIG_SAVE_ERROR',
      error
    );
  }
}

/**
 * Get profile configuration
 */
export function getProfile(profileName?: string): ProfileConfig {
  const config = loadConfig();
  const name = profileName || config.defaultProfile;

  const profile = config.profiles[name];
  if (!profile) {
    throw new GmailError(
      `Profile '${name}' not found. Run 'google-gmail accounts add ${name}' to create it.`,
      'PROFILE_NOT_FOUND'
    );
  }

  return profile;
}

/**
 * Add or update a profile
 */
export function addProfile(
  name: string,
  email: string,
  oauthPath?: string
): void {
  const config = loadConfig();

  // Ensure profiles directory exists
  if (!fs.existsSync(PROFILES_DIR)) {
    fs.mkdirSync(PROFILES_DIR, { mode: 0o700, recursive: true });
  }

  // Create profile directory
  const profileDir = path.join(PROFILES_DIR, name);
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { mode: 0o700 });
  }

  const tokenPath = path.join(profileDir, 'token.json');
  const profileOAuthPath = oauthPath || path.join(PLUGIN_ROOT, 'google-gmail-oauth.json');

  config.profiles[name] = {
    email,
    tokenPath,
    oauthPath: profileOAuthPath
  };

  // Set as default if it's the first profile
  if (Object.keys(config.profiles).length === 1) {
    config.defaultProfile = name;
  }

  saveConfig(config);
}

/**
 * Remove a profile
 */
export function removeProfile(name: string): void {
  const config = loadConfig();

  if (!config.profiles[name]) {
    throw new GmailError(
      `Profile '${name}' does not exist`,
      'PROFILE_NOT_FOUND'
    );
  }

  // Don't allow removing the default profile if there are others
  if (config.defaultProfile === name && Object.keys(config.profiles).length > 1) {
    throw new GmailError(
      `Cannot remove default profile '${name}'. Set another profile as default first.`,
      'CANNOT_REMOVE_DEFAULT'
    );
  }

  delete config.profiles[name];

  // If this was the default and no profiles remain, clear default
  if (config.defaultProfile === name) {
    const remainingProfiles = Object.keys(config.profiles);
    config.defaultProfile = remainingProfiles.length > 0 ? remainingProfiles[0] : '';
  }

  saveConfig(config);

  // Optionally remove profile directory
  const profileDir = path.join(PROFILES_DIR, name);
  if (fs.existsSync(profileDir)) {
    fs.rmSync(profileDir, { recursive: true, force: true });
  }
}

/**
 * List all profiles
 */
export function listProfiles(): Array<{ name: string; email: string; isDefault: boolean }> {
  const config = loadConfig();

  return Object.entries(config.profiles).map(([name, profile]) => ({
    name,
    email: profile.email,
    isDefault: name === config.defaultProfile
  }));
}

/**
 * Set default profile
 */
export function setDefaultProfile(name: string): void {
  const config = loadConfig();

  if (!config.profiles[name]) {
    throw new GmailError(
      `Profile '${name}' does not exist`,
      'PROFILE_NOT_FOUND'
    );
  }

  config.defaultProfile = name;
  saveConfig(config);
}

/**
 * Get OAuth credentials path for a profile
 */
export function getOAuthPath(profileName?: string): string {
  const profile = getProfile(profileName);
  return profile.oauthPath;
}

/**
 * Get token path for a profile
 */
export function getTokenPath(profileName?: string): string {
  const profile = getProfile(profileName);
  return profile.tokenPath;
}

/**
 * Resolve paths to absolute paths
 */
export function resolvePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.resolve(PLUGIN_ROOT, filePath);
}

/**
 * Get the plugin root directory
 */
export function getPluginRoot(): string {
  return PLUGIN_ROOT;
}
