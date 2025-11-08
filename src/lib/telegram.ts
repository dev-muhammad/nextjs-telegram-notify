import type {
  TelegramConfig,
  TelegramResponse,
  TelegramMessage,
  TelegramError,
  ParseMode,
  FileAttachment,
} from '../types';

/**
 * Telegram Bot API Client
 */
export class TelegramClient {
  private botToken: string;
  private chatId: string;
  private apiUrl: string;

  constructor(config: TelegramConfig) {
    this.botToken = config.botToken;
    this.chatId = config.chatId;
    this.apiUrl = config.apiUrl || 'https://api.telegram.org';
  }

  /**
   * Send a text message to Telegram
   */
  async sendMessage(
    text: string,
    options: {
      parseMode?: ParseMode;
      chatId?: string;
      disableNotification?: boolean;
      threadId?: number;
    } = {}
  ): Promise<TelegramMessage> {
    const url = `${this.apiUrl}/bot${this.botToken}/sendMessage`;
    
    const body: any = {
      chat_id: options.chatId || this.chatId,
      text: this.truncateMessage(text),
    };

    if (options.parseMode) {
      body.parse_mode = options.parseMode;
    }

    if (options.disableNotification) {
      body.disable_notification = true;
    }

    if (options.threadId) {
      body.message_thread_id = options.threadId;
    }

    return this.makeRequest(url, body);
  }

  /**
   * Send a document/file to Telegram
   */
  async sendDocument(
    file: FileAttachment,
    options: {
      caption?: string;
      parseMode?: ParseMode;
      chatId?: string;
      disableNotification?: boolean;
      threadId?: number;
    } = {}
  ): Promise<TelegramMessage> {
    const url = `${this.apiUrl}/bot${this.botToken}/sendDocument`;
    
    const formData = new FormData();
    formData.append('chat_id', options.chatId || this.chatId);

    // Handle file data
    if (typeof file.data === 'string') {
      // File path - read file in Node.js environment
      const fs = await import('fs');
      const fileBuffer = fs.readFileSync(file.data);
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: file.mimeType });
      formData.append('document', blob, file.filename);
    } else {
      // Buffer
      const blob = new Blob([new Uint8Array(file.data)], { type: file.mimeType });
      formData.append('document', blob, file.filename);
    }

    if (options.caption) {
      formData.append('caption', options.caption);
    }

    if (options.parseMode) {
      formData.append('parse_mode', options.parseMode);
    }

    if (options.disableNotification) {
      formData.append('disable_notification', 'true');
    }

    if (options.threadId) {
      formData.append('message_thread_id', options.threadId.toString());
    }

    return this.makeRequest(url, formData, true);
  }

  /**
   * Make a request to Telegram API
   */
  private async makeRequest(
    url: string,
    body: any,
    isFormData: boolean = false
  ): Promise<TelegramMessage> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const headers: HeadersInit = isFormData
          ? {}
          : { 'Content-Type': 'application/json' };

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: isFormData ? body : JSON.stringify(body),
        });

        const data: TelegramResponse = await response.json();

        if (!data.ok) {
          const error = new Error(
            data.description || 'Telegram API error'
          ) as TelegramError;
          error.name = 'TelegramError';
          error.code = data.error_code;
          error.description = data.description;
          throw error;
        }

        if (!data.result) {
          throw new Error('No result from Telegram API');
        }

        return data.result;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (
          error instanceof Error &&
          'code' in error &&
          typeof error.code === 'number' &&
          error.code >= 400 &&
          error.code < 500
        ) {
          throw error;
        }

        // Wait before retry with exponential backoff
        if (attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('Failed to send message to Telegram');
  }

  /**
   * Truncate message to Telegram's limit (4096 characters)
   */
  private truncateMessage(text: string): string {
    const maxLength = 4096;
    if (text.length <= maxLength) {
      return text;
    }

    const truncated = text.substring(0, maxLength - 3);
    return truncated + '...';
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
