/**
 * Format a message with timestamp
 */
export function formatMessageWithTimestamp(message: string): string {
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `${message}\n\n ${timestamp}`;
}

/**
 * Escape HTML special characters for Telegram HTML parse mode
 */
export function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  };

  return text.replace(/[&<>"]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Escape Markdown special characters for Telegram Markdown parse mode
 */
export function escapeMarkdown(text: string): string {
  const markdownEscapeChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  
  return text.split('').map(char => 
    markdownEscapeChars.includes(char) ? '\\' + char : char
  ).join('');
}

/**
 * Convert File to base64 string (browser environment)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64.split(',')[1] || base64;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validate file size (in bytes)
 */
export function validateFileSize(file: File, maxSize: number = 50 * 1024 * 1024): boolean {
  return file.size <= maxSize; // Telegram limit is 50MB
}

/**
 * Validate file type against whitelist
 */
export function validateFileType(file: File, allowedTypes?: string[]): boolean {
  if (!allowedTypes || allowedTypes.length === 0) {
    return true;
  }

  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const baseType = type.split('/')[0];
      return file.type.startsWith(baseType + '/');
    }
    return file.type === type;
  });
}

/**
 * Format form data as a readable message
 */
export function formatFormData(data: Record<string, any>, title?: string): string {
  let message = title ? `<b>${title}</b>\n\n` : '';

  for (const [key, value] of Object.entries(data)) {
    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    message += `${label}: ${value}\n`;
  }

  return message.trim();
}

/**
 * Create a structured notification message
 */
export function createNotification(options: {
  title: string;
  emoji?: string;
  fields: Record<string, string | number | boolean>;
  includeTimestamp?: boolean;
}): string {
  const { title, emoji, fields, includeTimestamp = true } = options;
  
  let message = `${emoji ? emoji + ' ' : ''}<b>${title}</b>\n\n`;

  for (const [key, value] of Object.entries(fields)) {
    message += `${key}: ${value}\n`;
  }

  if (includeTimestamp) {
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    message += `\n ${timestamp}`;
  }

  return message.trim();
}
