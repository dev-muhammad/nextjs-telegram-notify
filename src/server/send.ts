import { TelegramClient } from '../lib/telegram';
import type { NotifyOptions, FileAttachment } from '../types';

/**
 * Get Telegram configuration from environment variables
 */
function getTelegramConfig() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken) {
    throw new Error(
      'TELEGRAM_BOT_TOKEN is not set. Please add it to your environment variables.'
    );
  }

  if (!chatId) {
    throw new Error(
      'TELEGRAM_CHAT_ID is not set. Please add it to your environment variables.'
    );
  }

  return { botToken, chatId };
}

/**
 * Send a notification to Telegram (server-side)
 * 
 * @example
 * ```ts
 * import { sendTelegramNotification } from 'nextjs-telegram-notify/server';
 * 
 * await sendTelegramNotification({
 *   message: 'Hello from Next.js!',
 *   parseMode: 'HTML'
 * });
 * ```
 */
export async function sendTelegramNotification(
  options: NotifyOptions
): Promise<void> {
  const config = getTelegramConfig();
  const client = new TelegramClient(config);

  const {
    message,
    parseMode,
    files,
    chatId,
    disableNotification,
    threadId,
  } = options;

  // Send files if provided
  if (files && files.length > 0) {
    for (const file of files) {
      const fileAttachment = file as FileAttachment;
      
      await client.sendDocument(fileAttachment, {
        caption: message,
        parseMode,
        chatId,
        disableNotification,
        threadId,
      });
    }
  } else {
    // Send text message only
    await client.sendMessage(message, {
      parseMode,
      chatId,
      disableNotification,
      threadId,
    });
  }
}

/**
 * Create a configured Telegram client (server-side)
 * 
 * @example
 * ```ts
 * import { createTelegramClient } from 'nextjs-telegram-notify/server';
 * 
 * const client = createTelegramClient();
 * await client.sendMessage('Hello!');
 * ```
 */
export function createTelegramClient(customConfig?: {
  botToken?: string;
  chatId?: string;
}): TelegramClient {
  const envConfig = customConfig?.botToken && customConfig?.chatId
    ? { botToken: customConfig.botToken, chatId: customConfig.chatId }
    : getTelegramConfig();

  return new TelegramClient(envConfig);
}
