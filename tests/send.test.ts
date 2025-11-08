import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { sendTelegramNotification, createTelegramClient } from '../src/server/send';
import { TelegramClient } from '../src/lib/telegram';
import type { NotifyOptions, TelegramMessage, FileAttachment, ParseMode } from '../src/types';

// Mock the TelegramClient
jest.mock('../src/lib/telegram');

describe('sendTelegramNotification', () => {
  const mockSendMessage = jest.fn<(text: string, options?: any) => Promise<TelegramMessage>>();
  const mockSendDocument = jest.fn<(file: FileAttachment, options?: any) => Promise<TelegramMessage>>();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock TelegramClient methods
    (TelegramClient as jest.MockedClass<typeof TelegramClient>).mockImplementation(() => ({
      sendMessage: mockSendMessage,
      sendDocument: mockSendDocument,
    } as any));
  });

  describe('Configuration', () => {
    it('should throw error when TELEGRAM_BOT_TOKEN is not set', async () => {
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;

      await expect(
        sendTelegramNotification({ message: 'Test' })
      ).rejects.toThrow('TELEGRAM_BOT_TOKEN is not set');

      process.env.TELEGRAM_BOT_TOKEN = originalToken;
    });

    it('should throw error when TELEGRAM_CHAT_ID is not set', async () => {
      const originalChatId = process.env.TELEGRAM_CHAT_ID;
      delete process.env.TELEGRAM_CHAT_ID;

      await expect(
        sendTelegramNotification({ message: 'Test' })
      ).rejects.toThrow('TELEGRAM_CHAT_ID is not set');

      process.env.TELEGRAM_CHAT_ID = originalChatId;
    });

    it('should create TelegramClient with env config', async () => {
      await sendTelegramNotification({ message: 'Test' });

      expect(TelegramClient).toHaveBeenCalledWith({
        botToken: 'test_bot_token_12345',
        chatId: '12345678',
      });
    });
  });

  describe('Text messages', () => {
    it('should send text message without files', async () => {
      const options: NotifyOptions = {
        message: 'Hello, world!',
      };

      await sendTelegramNotification(options);

      expect(mockSendMessage).toHaveBeenCalledWith('Hello, world!', {
        parseMode: undefined,
        chatId: undefined,
        disableNotification: undefined,
        threadId: undefined,
      });
      expect(mockSendDocument).not.toHaveBeenCalled();
    });

    it('should pass parse mode to sendMessage', async () => {
      await sendTelegramNotification({
        message: '<b>Bold text</b>',
        parseMode: 'HTML',
      });

      expect(mockSendMessage).toHaveBeenCalledWith('<b>Bold text</b>', {
        parseMode: 'HTML',
        chatId: undefined,
        disableNotification: undefined,
        threadId: undefined,
      });
    });

    it('should pass custom chat ID', async () => {
      await sendTelegramNotification({
        message: 'Test',
        chatId: '123456789',
      });

      expect(mockSendMessage).toHaveBeenCalledWith('Test', {
        parseMode: undefined,
        chatId: '123456789',
        disableNotification: undefined,
        threadId: undefined,
      });
    });

    it('should pass disableNotification option', async () => {
      await sendTelegramNotification({
        message: 'Test',
        disableNotification: true,
      });

      expect(mockSendMessage).toHaveBeenCalledWith('Test', {
        parseMode: undefined,
        chatId: undefined,
        disableNotification: true,
        threadId: undefined,
      });
    });

    it('should pass threadId option', async () => {
      await sendTelegramNotification({
        message: 'Test',
        threadId: 456,
      });

      expect(mockSendMessage).toHaveBeenCalledWith('Test', {
        parseMode: undefined,
        chatId: undefined,
        disableNotification: undefined,
        threadId: 456,
      });
    });
  });

  describe('File attachments', () => {
    it('should send file with sendDocument', async () => {
      const fileData = Buffer.from('test content');
      const options: NotifyOptions = {
        message: 'File attached',
        files: [
          {
            data: fileData,
            filename: 'test.txt',
            mimeType: 'text/plain',
          },
        ],
      };

      await sendTelegramNotification(options);

      expect(mockSendDocument).toHaveBeenCalledWith(
        {
          data: fileData,
          filename: 'test.txt',
          mimeType: 'text/plain',
        },
        {
          caption: 'File attached',
          parseMode: undefined,
          chatId: undefined,
          disableNotification: undefined,
          threadId: undefined,
        }
      );
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('should send multiple files separately', async () => {
      const file1 = Buffer.from('content 1');
      const file2 = Buffer.from('content 2');

      await sendTelegramNotification({
        message: 'Multiple files',
        files: [
          { data: file1, filename: 'file1.txt', mimeType: 'text/plain' },
          { data: file2, filename: 'file2.txt', mimeType: 'text/plain' },
        ],
      });

      expect(mockSendDocument).toHaveBeenCalledTimes(2);
      expect(mockSendDocument).toHaveBeenNthCalledWith(
        1,
        { data: file1, filename: 'file1.txt', mimeType: 'text/plain' },
        expect.any(Object)
      );
      expect(mockSendDocument).toHaveBeenNthCalledWith(
        2,
        { data: file2, filename: 'file2.txt', mimeType: 'text/plain' },
        expect.any(Object)
      );
    });

    it('should pass all options when sending files', async () => {
      const fileData = Buffer.from('test');

      await sendTelegramNotification({
        message: 'File with options',
        parseMode: 'Markdown',
        chatId: '987654321',
        disableNotification: true,
        threadId: 123,
        files: [
          { data: fileData, filename: 'test.txt', mimeType: 'text/plain' },
        ],
      });

      expect(mockSendDocument).toHaveBeenCalledWith(
        expect.any(Object),
        {
          caption: 'File with options',
          parseMode: 'Markdown',
          chatId: '987654321',
          disableNotification: true,
          threadId: 123,
        }
      );
    });

    it('should handle empty files array as no files', async () => {
      await sendTelegramNotification({
        message: 'No files',
        files: [],
      });

      expect(mockSendMessage).toHaveBeenCalled();
      expect(mockSendDocument).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from sendMessage', async () => {
      const error = new Error('Telegram API error');
      mockSendMessage.mockRejectedValueOnce(error);

      await expect(
        sendTelegramNotification({ message: 'Test' })
      ).rejects.toThrow('Telegram API error');
    });

    it('should propagate errors from sendDocument', async () => {
      const error = new Error('File upload error');
      mockSendDocument.mockRejectedValueOnce(error);

      await expect(
        sendTelegramNotification({
          message: 'Test',
          files: [
            { data: Buffer.from('test'), filename: 'test.txt', mimeType: 'text/plain' },
          ],
        })
      ).rejects.toThrow('File upload error');
    });
  });
});

describe('createTelegramClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create client with env config by default', () => {
    const client = createTelegramClient();

    expect(TelegramClient).toHaveBeenCalledWith({
      botToken: 'test_bot_token_12345',
      chatId: '12345678',
    });
    expect(client).toBeDefined();
  });

  it('should create client with custom config', () => {
    const client = createTelegramClient({
      botToken: 'custom-token',
      chatId: 'custom-chat-id',
    });

    expect(TelegramClient).toHaveBeenCalledWith({
      botToken: 'custom-token',
      chatId: 'custom-chat-id',
    });
    expect(client).toBeDefined();
  });

  it('should throw error when env vars missing and no custom config', () => {
    const originalToken = process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_BOT_TOKEN;

    expect(() => createTelegramClient()).toThrow('TELEGRAM_BOT_TOKEN is not set');

    process.env.TELEGRAM_BOT_TOKEN = originalToken;
  });

  it('should prefer custom config over env vars', () => {
    createTelegramClient({
      botToken: 'override-token',
      chatId: 'override-chat-id',
    });

    expect(TelegramClient).toHaveBeenCalledWith({
      botToken: 'override-token',
      chatId: 'override-chat-id',
    });
  });

  it('should require both botToken and chatId in custom config', () => {
    // Only botToken provided should still use env config
    const client1 = createTelegramClient({
      botToken: 'custom-token',
    } as any);

    expect(TelegramClient).toHaveBeenCalledWith({
      botToken: 'test_bot_token_12345',
      chatId: '12345678',
    });
  });
});
