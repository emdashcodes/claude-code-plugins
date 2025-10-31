/**
 * MessageCleaner - Shared conversation history cleaning
 *
 * Extracts only text content from Claude Code session messages,
 * removing tool calls, results, and metadata.
 */

/**
 * Clean conversation history for mem0
 * Extracts only text content, removing tool calls, results, and metadata
 */
export function cleanConversationHistory(messages) {
  const cleaned = [];

  for (const msg of messages) {
    // Skip sidechain messages (injected context from hooks)
    if (msg.isSidechain === true) {
      continue;
    }

    // Skip messages without proper structure
    if (!msg?.message?.role || !msg?.message?.content) {
      continue;
    }

    const role = msg.message.role;

    // Only process user and assistant messages
    if (role !== 'user' && role !== 'assistant') {
      continue;
    }

    // Extract text content - handle both string and array formats
    const textContent = [];
    const content = msg.message.content;

    if (typeof content === 'string') {
      // User messages: content is a plain string
      // Skip command output messages (caveat messages, command XML tags)
      if (content.startsWith('Caveat:') ||
          content.includes('<command-name>') ||
          content.includes('<local-command-stdout>')) {
        continue;
      }
      textContent.push(content);
    } else if (Array.isArray(content)) {
      // Assistant messages: content is array of blocks
      for (const block of content) {
        if (block?.type === 'text' && block?.text) {
          textContent.push(block.text);
        }
      }
    }

    // Skip if no text content
    if (textContent.length === 0) {
      continue;
    }

    // Format as standard OpenAI message format
    const text = textContent.join('\n\n');

    // Skip "No response requested" messages
    if (text.trim() === 'No response requested.') {
      continue;
    }

    cleaned.push({
      role,
      content: text
    });
  }

  return cleaned;
}
