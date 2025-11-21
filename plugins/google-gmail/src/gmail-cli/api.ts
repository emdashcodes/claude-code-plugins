/**
 * Gmail API wrapper functions
 */

import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import {
  MessageListOptions,
  SendEmailOptions,
  ParsedMessage,
  MessageAttachment,
  GmailError,
  LabelInfo,
  UnsubscribeInfo,
  UnsubscribeResult,
} from './types.js';

/**
 * Create Gmail API client
 */
export function createGmailClient(auth: OAuth2Client): gmail_v1.Gmail {
  return google.gmail({ version: 'v1', auth });
}

/**
 * List messages with filtering
 */
export async function listMessages(
  gmail: gmail_v1.Gmail,
  options: MessageListOptions = {}
): Promise<gmail_v1.Schema$Message[]> {
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: options.labelIds,
      q: options.query,
      maxResults: options.maxResults || 10,
      pageToken: options.pageToken,
      includeSpamTrash: options.includeSpamTrash || false,
    });

    const messageIds = response.data.messages || [];

    // Fetch full message details
    const messages: gmail_v1.Schema$Message[] = [];
    for (const msg of messageIds) {
      if (msg.id) {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date', 'Cc'],
        });
        messages.push(fullMessage.data);
      }
    }

    return messages;
  } catch (error) {
    throw new GmailError(
      'Failed to list messages',
      'LIST_MESSAGES_FAILED',
      error
    );
  }
}

/**
 * Get a single message by ID
 */
export async function getMessage(
  gmail: gmail_v1.Gmail,
  messageId: string,
  format: 'full' | 'metadata' | 'minimal' | 'raw' = 'full'
): Promise<gmail_v1.Schema$Message> {
  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format,
    });

    return response.data;
  } catch (error) {
    throw new GmailError(
      `Failed to get message ${messageId}`,
      'GET_MESSAGE_FAILED',
      error
    );
  }
}

/**
 * Parse message to extract readable content
 */
export async function parseMessage(message: gmail_v1.Schema$Message): Promise<ParsedMessage> {
  const headers = message.payload?.headers || [];

  const getHeader = (name: string): string => {
    const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  };

  const from = getHeader('From');
  const to = getHeader('To').split(',').map(e => e.trim()).filter(Boolean);
  const cc = getHeader('Cc').split(',').map(e => e.trim()).filter(Boolean);
  const subject = getHeader('Subject');
  const dateStr = getHeader('Date');

  // Extract body
  let body = '';
  let htmlBody = '';
  const attachments: MessageAttachment[] = [];

  const extractParts = (parts: gmail_v1.Schema$MessagePart[] | undefined) => {
    if (!parts) return;

    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        htmlBody += Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.filename && part.body?.attachmentId) {
        attachments.push({
          id: part.body.attachmentId,
          filename: part.filename,
          mimeType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
        });
      }

      // Recursively process multipart messages
      if (part.parts) {
        extractParts(part.parts);
      }
    }
  };

  if (message.payload?.parts) {
    extractParts(message.payload.parts);
  } else if (message.payload?.body?.data) {
    // Single-part message
    const decodedBody = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    const mimeType = message.payload.mimeType;

    if (mimeType === 'text/html') {
      htmlBody = decodedBody;
    } else {
      body = decodedBody;
    }
  }

  return {
    id: message.id || '',
    threadId: message.threadId || '',
    labelIds: message.labelIds || [],
    snippet: message.snippet || '',
    internalDate: message.internalDate || '',
    from,
    to,
    cc: cc.length > 0 ? cc : undefined,
    subject,
    date: new Date(dateStr || message.internalDate || Date.now()),
    body: body || message.snippet || '',
    htmlBody: htmlBody || undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
  };
}

/**
 * Send an email
 */
export async function sendEmail(
  gmail: gmail_v1.Gmail,
  options: SendEmailOptions
): Promise<gmail_v1.Schema$Message> {
  try {
    const rawMessage = await createMimeMessage(options);

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
        threadId: options.threadId,
      },
    });

    return response.data;
  } catch (error) {
    throw new GmailError(
      'Failed to send email',
      'SEND_EMAIL_FAILED',
      error
    );
  }
}

/**
 * Create a MIME message for sending
 */
async function createMimeMessage(options: SendEmailOptions): Promise<string> {
  const transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
  });

  const attachments = options.attachments?.map(filePath => ({
    path: filePath,
  })) || [];

  const mailOptions: any = {
    from: 'me',
    to: options.to.join(', '),
    cc: options.cc?.join(', '),
    bcc: options.bcc?.join(', '),
    subject: options.subject,
    text: options.body,
    html: options.html,
    attachments,
  };

  // Add threading headers if replying
  if (options.inReplyTo) {
    mailOptions.inReplyTo = options.inReplyTo;
  }
  if (options.references) {
    mailOptions.references = options.references;
  }

  const info = await transporter.sendMail(mailOptions);

  // Read the stream to get the raw message
  const chunks: Buffer[] = [];
  for await (const chunk of info.message) {
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString();

  // Convert to base64url
  return Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Download attachment
 */
export async function downloadAttachment(
  gmail: gmail_v1.Gmail,
  messageId: string,
  attachmentId: string,
  outputPath: string
): Promise<void> {
  try {
    const response = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId,
    });

    const data = response.data.data;
    if (!data) {
      throw new Error('No attachment data received');
    }

    // Decode base64url data
    const buffer = Buffer.from(data, 'base64url');
    fs.writeFileSync(outputPath, buffer);
  } catch (error) {
    throw new GmailError(
      `Failed to download attachment ${attachmentId}`,
      'DOWNLOAD_ATTACHMENT_FAILED',
      error
    );
  }
}

/**
 * List labels
 */
export async function listLabels(gmail: gmail_v1.Gmail): Promise<LabelInfo[]> {
  try {
    const response = await gmail.users.labels.list({
      userId: 'me',
    });

    const labels = response.data.labels || [];
    return labels.map(label => ({
      id: label.id || '',
      name: label.name || '',
      type: label.type || '',
      messageListVisibility: label.messageListVisibility,
      labelListVisibility: label.labelListVisibility,
    }));
  } catch (error) {
    throw new GmailError(
      'Failed to list labels',
      'LIST_LABELS_FAILED',
      error
    );
  }
}

/**
 * Create a label
 */
export async function createLabel(
  gmail: gmail_v1.Gmail,
  name: string
): Promise<LabelInfo> {
  try {
    const response = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    });

    const label = response.data;
    return {
      id: label.id || '',
      name: label.name || '',
      type: label.type || '',
      messageListVisibility: label.messageListVisibility,
      labelListVisibility: label.labelListVisibility,
    };
  } catch (error) {
    throw new GmailError(
      `Failed to create label '${name}'`,
      'CREATE_LABEL_FAILED',
      error
    );
  }
}

/**
 * Delete a label
 */
export async function deleteLabel(
  gmail: gmail_v1.Gmail,
  labelId: string
): Promise<void> {
  try {
    await gmail.users.labels.delete({
      userId: 'me',
      id: labelId,
    });
  } catch (error) {
    throw new GmailError(
      `Failed to delete label ${labelId}`,
      'DELETE_LABEL_FAILED',
      error
    );
  }
}

/**
 * Modify message labels
 */
export async function modifyMessageLabels(
  gmail: gmail_v1.Gmail,
  messageId: string,
  addLabels: string[] = [],
  removeLabels: string[] = []
): Promise<gmail_v1.Schema$Message> {
  try {
    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: addLabels,
        removeLabelIds: removeLabels,
      },
    });

    return response.data;
  } catch (error) {
    throw new GmailError(
      `Failed to modify labels for message ${messageId}`,
      'MODIFY_LABELS_FAILED',
      error
    );
  }
}

/**
 * Trash a message
 */
export async function trashMessage(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<gmail_v1.Schema$Message> {
  try {
    const response = await gmail.users.messages.trash({
      userId: 'me',
      id: messageId,
    });

    return response.data;
  } catch (error) {
    throw new GmailError(
      `Failed to trash message ${messageId}`,
      'TRASH_MESSAGE_FAILED',
      error
    );
  }
}

/**
 * Permanently delete a message
 */
export async function deleteMessage(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<void> {
  try {
    await gmail.users.messages.delete({
      userId: 'me',
      id: messageId,
    });
  } catch (error) {
    throw new GmailError(
      `Failed to delete message ${messageId}`,
      'DELETE_MESSAGE_FAILED',
      error
    );
  }
}

/**
 * List drafts
 */
export async function listDrafts(
  gmail: gmail_v1.Gmail,
  maxResults: number = 10
): Promise<gmail_v1.Schema$Draft[]> {
  try {
    const response = await gmail.users.drafts.list({
      userId: 'me',
      maxResults,
    });

    return response.data.drafts || [];
  } catch (error) {
    throw new GmailError(
      'Failed to list drafts',
      'LIST_DRAFTS_FAILED',
      error
    );
  }
}

/**
 * Create a draft
 */
export async function createDraft(
  gmail: gmail_v1.Gmail,
  options: SendEmailOptions
): Promise<gmail_v1.Schema$Draft> {
  try {
    const rawMessage = await createMimeMessage(options);

    const response = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: rawMessage,
          threadId: options.threadId,
        },
      },
    });

    return response.data;
  } catch (error) {
    throw new GmailError(
      'Failed to create draft',
      'CREATE_DRAFT_FAILED',
      error
    );
  }
}

/**
 * Send a draft
 */
export async function sendDraft(
  gmail: gmail_v1.Gmail,
  draftId: string
): Promise<gmail_v1.Schema$Message> {
  try {
    const response = await gmail.users.drafts.send({
      userId: 'me',
      requestBody: {
        id: draftId,
      },
    });

    return response.data;
  } catch (error) {
    throw new GmailError(
      `Failed to send draft ${draftId}`,
      'SEND_DRAFT_FAILED',
      error
    );
  }
}

/**
 * Delete a draft
 */
export async function deleteDraft(
  gmail: gmail_v1.Gmail,
  draftId: string
): Promise<void> {
  try {
    await gmail.users.drafts.delete({
      userId: 'me',
      id: draftId,
    });
  } catch (error) {
    throw new GmailError(
      `Failed to delete draft ${draftId}`,
      'DELETE_DRAFT_FAILED',
      error
    );
  }
}

/**
 * Extract unsubscribe information from a message
 */
export async function extractUnsubscribeInfo(
  gmail: gmail_v1.Gmail,
  message: gmail_v1.Schema$Message
): Promise<UnsubscribeInfo | null> {
  const headers = message.payload?.headers || [];

  // Try to find List-Unsubscribe header (RFC 2369)
  const listUnsubHeader = headers.find(
    h => h.name?.toLowerCase() === 'list-unsubscribe'
  );

  if (listUnsubHeader?.value) {
    const headerValue = listUnsubHeader.value;

    // Parse List-Unsubscribe header - can contain multiple methods
    // Format: <mailto:unsub@example.com>, <https://example.com/unsub>

    // Try HTTPS/HTTP first (preferred for one-click)
    const httpsMatch = headerValue.match(/<(https?:\/\/[^>]+)>/);
    if (httpsMatch) {
      const url = httpsMatch[1];

      // Check for List-Unsubscribe-Post header (RFC 8058 - one-click)
      const postHeader = headers.find(
        h => h.name?.toLowerCase() === 'list-unsubscribe-post'
      );

      return {
        method: url.startsWith('https') ? 'https' : 'http',
        url,
        postData: postHeader?.value || 'List-Unsubscribe=One-Click',
      };
    }

    // Try mailto method
    const mailtoMatch = headerValue.match(/<mailto:([^>]+)>/);
    if (mailtoMatch) {
      const mailtoUrl = mailtoMatch[1];

      // Parse mailto URL: email?subject=...&body=...
      const [email, params] = mailtoUrl.split('?');
      const urlParams = new URLSearchParams(params || '');

      return {
        method: 'mailto',
        email,
        subject: urlParams.get('subject') || undefined,
        body: urlParams.get('body') || undefined,
      };
    }
  }

  // Fallback: Parse HTML body for unsubscribe links
  // If message doesn't have body/parts, fetch it with full format
  let fullMessage = message;
  if (!message.payload?.body?.data && !message.payload?.parts && message.id) {
    fullMessage = await getMessage(gmail, message.id, 'full');
  }

  const parsed = await parseMessage(fullMessage);
  if (parsed.htmlBody) {
    // Look for links containing "unsubscribe" (case insensitive)
    const unsubLinkMatch = parsed.htmlBody.match(
      /<a[^>]+href=["']([^"']*unsubscribe[^"']*)["']/i
    );

    if (unsubLinkMatch) {
      return {
        method: 'html-link',
        url: unsubLinkMatch[1],
      };
    }
  }

  return null;
}

/**
 * Execute unsubscribe action
 */
async function executeUnsubscribe(
  gmail: gmail_v1.Gmail,
  unsubInfo: UnsubscribeInfo
): Promise<{ success: boolean; details?: string }> {
  try {
    switch (unsubInfo.method) {
      case 'https':
      case 'http': {
        // Send POST request with List-Unsubscribe-Post data
        const response = await fetch(unsubInfo.url!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: unsubInfo.postData,
        });

        if (response.ok) {
          return { success: true, details: `POST ${unsubInfo.url}` };
        } else {
          return {
            success: false,
            details: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
      }

      case 'mailto': {
        // Send unsubscribe email
        await sendEmail(gmail, {
          to: [unsubInfo.email!],
          subject: unsubInfo.subject || 'Unsubscribe',
          body: unsubInfo.body || '',
        });

        return { success: true, details: `Email sent to ${unsubInfo.email}` };
      }

      case 'html-link': {
        // Try GET request to unsubscribe link (less reliable)
        const response = await fetch(unsubInfo.url!);

        return {
          success: response.ok,
          details: `GET ${unsubInfo.url} (may require manual confirmation)`,
        };
      }

      default:
        return { success: false, details: 'Unknown unsubscribe method' };
    }
  } catch (error) {
    return {
      success: false,
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Unsubscribe from a mailing list based on a message
 */
export async function unsubscribeFromMessage(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<UnsubscribeResult> {
  try {
    const message = await getMessage(gmail, messageId);
    const parsed = await parseMessage(message);

    const unsubInfo = await extractUnsubscribeInfo(gmail, message);

    if (!unsubInfo) {
      return {
        messageId,
        from: parsed.from,
        subject: parsed.subject,
        success: false,
        error: 'No unsubscribe method found',
      };
    }

    const result = await executeUnsubscribe(gmail, unsubInfo);

    return {
      messageId,
      from: parsed.from,
      subject: parsed.subject,
      success: result.success,
      method: unsubInfo.method,
      details: result.details,
      error: result.success ? undefined : result.details,
    };
  } catch (error) {
    const message = await getMessage(gmail, messageId);
    const parsed = await parseMessage(message);

    return {
      messageId,
      from: parsed.from,
      subject: parsed.subject,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * List all filters
 */
export async function listFilters(
  gmail: gmail_v1.Gmail
): Promise<gmail_v1.Schema$Filter[]> {
  try {
    const response = await gmail.users.settings.filters.list({
      userId: 'me',
    });

    return response.data.filter || [];
  } catch (error) {
    throw new GmailError(
      'Failed to list filters',
      'LIST_FILTERS_FAILED',
      error
    );
  }
}

/**
 * Create a filter
 */
export async function createFilter(
  gmail: gmail_v1.Gmail,
  criteria: gmail_v1.Schema$FilterCriteria,
  action: gmail_v1.Schema$FilterAction
): Promise<gmail_v1.Schema$Filter> {
  try {
    const response = await gmail.users.settings.filters.create({
      userId: 'me',
      requestBody: {
        criteria,
        action,
      },
    });

    return response.data;
  } catch (error) {
    throw new GmailError(
      'Failed to create filter',
      'CREATE_FILTER_FAILED',
      error
    );
  }
}

/**
 * Get a filter by ID
 */
export async function getFilter(
  gmail: gmail_v1.Gmail,
  filterId: string
): Promise<gmail_v1.Schema$Filter> {
  try {
    const response = await gmail.users.settings.filters.get({
      userId: 'me',
      id: filterId,
    });

    return response.data;
  } catch (error) {
    throw new GmailError(
      'Failed to get filter',
      'GET_FILTER_FAILED',
      error
    );
  }
}

/**
 * Delete a filter
 */
export async function deleteFilter(
  gmail: gmail_v1.Gmail,
  filterId: string
): Promise<void> {
  try {
    await gmail.users.settings.filters.delete({
      userId: 'me',
      id: filterId,
    });
  } catch (error) {
    throw new GmailError(
      `Failed to delete filter ${filterId}`,
      'DELETE_FILTER_FAILED',
      error
    );
  }
}
