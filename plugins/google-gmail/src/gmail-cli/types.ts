import { gmail_v1 } from 'googleapis';

/**
 * Profile configuration for multi-account support
 */
export interface ProfileConfig {
  email: string;
  tokenPath: string;
  oauthPath: string;
}

/**
 * Full configuration file structure
 */
export interface GmailConfig {
  defaultProfile: string;
  profiles: Record<string, ProfileConfig>;
}

/**
 * Options for listing messages
 */
export interface MessageListOptions {
  labelIds?: string[];
  query?: string;
  maxResults?: number;
  pageToken?: string;
  includeSpamTrash?: boolean;
}

/**
 * Options for sending emails
 */
export interface SendEmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body?: string;
  html?: string;
  attachments?: string[];
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

/**
 * Options for reading messages
 */
export interface ReadMessageOptions {
  format?: 'text' | 'markdown' | 'html' | 'json';
  includeHeaders?: boolean;
  raw?: boolean;
}

/**
 * Parsed email message
 */
export interface ParsedMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  date: Date;
  body?: string;
  htmlBody?: string;
  attachments?: MessageAttachment[];
}

/**
 * Email attachment information
 */
export interface MessageAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Draft email information
 */
export interface DraftInfo {
  id: string;
  message: gmail_v1.Schema$Message;
}

/**
 * Label information
 */
export interface LabelInfo {
  id: string;
  name: string;
  type: string;
  messageListVisibility?: string | null;
  labelListVisibility?: string | null;
}

/**
 * Custom error class for Gmail operations
 */
export class GmailError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'GmailError';
  }
}

/**
 * OAuth credentials structure
 */
export interface OAuthCredentials {
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

/**
 * OAuth token structure
 */
export interface OAuthToken {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

/**
 * Unsubscribe method types
 */
export type UnsubscribeMethod = 'mailto' | 'https' | 'http' | 'html-link';

/**
 * Unsubscribe information extracted from message
 */
export interface UnsubscribeInfo {
  method: UnsubscribeMethod;
  url?: string;
  email?: string;
  subject?: string;
  body?: string;
  postData?: string;
}

/**
 * Result of an unsubscribe attempt
 */
export interface UnsubscribeResult {
  messageId: string;
  from: string;
  subject: string;
  success: boolean;
  method?: UnsubscribeMethod;
  error?: string;
  details?: string;
}
