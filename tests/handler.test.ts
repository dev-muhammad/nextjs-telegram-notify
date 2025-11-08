import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { POST, createTelegramRoute } from '../src/route/handler';
import * as sendModule from '../src/server/send';
import type { TelegramNotifyRequest } from '../src/types';

// Mock the send module
jest.mock('../src/server/send', () => ({
  sendTelegramNotification: jest.fn<() => Promise<void>>().mockResolvedValue(undefined as void),
}));

// Helper to create mock NextRequest
function createMockNextRequest(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  ip?: string;
}): NextRequest {
  const url = options.url || 'http://localhost:3000/api/telegram-notify';
  const headers = new Headers(options.headers || {});
  
  if (options.ip) {
    headers.set('x-forwarded-for', options.ip);
  }

  const request = new NextRequest(url, {
    method: options.method || 'POST',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  return request;
}

describe('POST Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should send notification successfully', async () => {
      const request = createMockNextRequest({
        body: { message: 'Test message' },
        ip: '1.1.1.1',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(sendModule.sendTelegramNotification).toHaveBeenCalledWith({
        message: 'Test message',
        parseMode: undefined,
        chatId: undefined,
        disableNotification: undefined,
        threadId: undefined,
        files: undefined,
      });
    });

    it('should return 400 when message is missing', async () => {
      const request = createMockNextRequest({
        body: {},
        ip: '1.1.1.1',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Message is required',
      });
      expect(sendModule.sendTelegramNotification).not.toHaveBeenCalled();
    });

    it('should pass all options to sendTelegramNotification', async () => {
      const request = createMockNextRequest({
        body: {
          message: 'Test message',
          parseMode: 'HTML',
          chatId: '123456',
          disableNotification: true,
          threadId: 789,
        },
        ip: '1.1.1.1',
      });

      await POST(request);

      expect(sendModule.sendTelegramNotification).toHaveBeenCalledWith({
        message: 'Test message',
        parseMode: 'HTML',
        chatId: '123456',
        disableNotification: true,
        threadId: 789,
        files: undefined,
      });
    });

    it('should convert base64 files to Buffer', async () => {
      const request = createMockNextRequest({
        body: {
          message: 'Test with file',
          files: [
            {
              data: Buffer.from('test content').toString('base64'),
              name: 'test.txt',
              type: 'text/plain',
            },
          ],
        },
        ip: '1.1.1.1',
      });

      await POST(request);

      const calls = (sendModule.sendTelegramNotification as jest.MockedFunction<typeof sendModule.sendTelegramNotification>).mock.calls;
      expect(calls[0][0].files).toHaveLength(1);
      const file = calls[0][0].files![0] as any;
      expect(file.data).toBeInstanceOf(Buffer);
      expect(file.filename).toBe('test.txt');
      expect(file.mimeType).toBe('text/plain');
    });
  });

  describe('Rate limiting', () => {
    it('should return 429 when IP rate limit is exceeded', async () => {
      // Create a custom handler with rate limiting disabled globally
      const handler = createTelegramRoute({
        rateLimit: { maxRequests: 20, windowMs: 60000 },
      });

      const requests = [];
      
      // Send 21 requests from same IP (limit is 20)
      for (let i = 0; i < 21; i++) {
        const request = createMockNextRequest({
          body: { message: `Message ${i}` },
          ip: '2.2.2.2',
        });
        requests.push(handler(request));
      }

      const responses = await Promise.all(requests);
      const lastResponse = responses[responses.length - 1];
      const data = await lastResponse.json();

      expect(lastResponse.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Rate limit exceeded');
      expect(lastResponse.headers.get('Retry-After')).toBeTruthy();
      expect(lastResponse.headers.get('X-RateLimit-Limit')).toBe('20');
      expect(lastResponse.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('should include rate limit headers in successful response', async () => {
      // Use handler with rate limiting to avoid global limiter
      const handler = createTelegramRoute({
        rateLimit: { maxRequests: 20, windowMs: 60000 },
      });

      const request = createMockNextRequest({
        body: { message: 'Test message' },
        ip: '3.3.3.3',
      });

      const response = await handler(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('20');
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('should track rate limits per IP', async () => {
      // Use separate handler instances to avoid interference
      const handler = createTelegramRoute({
        rateLimit: { maxRequests: 20, windowMs: 60000 },
      });

      // Send from IP 1
      for (let i = 0; i < 5; i++) {
        const request = createMockNextRequest({
          body: { message: 'Message from IP1' },
          ip: '4.4.4.4',
        });
        await handler(request);
      }

      // Send from IP 2
      const request2 = createMockNextRequest({
        body: { message: 'Message from IP2' },
        ip: '5.5.5.5',
      });
      const response2 = await handler(request2);
      const data2 = await response2.json();

      // IP 2 should not be rate limited
      expect(response2.status).toBe(200);
      expect(data2.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should return 500 when sendTelegramNotification throws', async () => {
      (sendModule.sendTelegramNotification as jest.MockedFunction<typeof sendModule.sendTelegramNotification>)
        .mockRejectedValueOnce(new Error('Telegram API error'));

      // Disable rate limiting to avoid 503
      const handler = createTelegramRoute({ rateLimit: false });

      const request = createMockNextRequest({
        body: { message: 'Test message' },
        ip: '6.6.6.6',
      });

      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Telegram API error',
      });
    });

    it('should handle non-Error exceptions', async () => {
      (sendModule.sendTelegramNotification as jest.MockedFunction<typeof sendModule.sendTelegramNotification>)
        .mockRejectedValueOnce('String error');

      // Disable rate limiting to avoid 503
      const handler = createTelegramRoute({ rateLimit: false });

      const request = createMockNextRequest({
        body: { message: 'Test message' },
        ip: '7.7.7.7',
      });

      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unknown error');
    });
  });
});

describe('createTelegramRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Custom rate limiting', () => {
    it('should use custom rate limit configuration', async () => {
      const handler = createTelegramRoute({
        rateLimit: { maxRequests: 5, windowMs: 60000 },
      });

      const requests = [];
      
      // Send 6 requests (custom limit is 5)
      for (let i = 0; i < 6; i++) {
        const request = createMockNextRequest({
          body: { message: `Message ${i}` },
          ip: '8.8.8.8',
        });
        requests.push(handler(request));
      }

      const responses = await Promise.all(requests);
      const lastResponse = responses[responses.length - 1];
      const data = await lastResponse.json();

      expect(lastResponse.status).toBe(429);
      expect(data.error).toContain('Rate limit exceeded');
      expect(lastResponse.headers.get('X-RateLimit-Limit')).toBe('5');
    });

    it('should disable rate limiting when rateLimit is false', async () => {
      const handler = createTelegramRoute({
        rateLimit: false,
      });

      const requests = [];
      
      // Send 10 requests rapidly (would exceed default limit but should succeed)
      for (let i = 0; i < 10; i++) {
        const request = createMockNextRequest({
          body: { message: `Message ${i}` },
          ip: '9.9.9.9',
        });
        requests.push(handler(request));
      }

      const responses = await Promise.all(requests);
      
      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('CORS configuration', () => {
    it('should handle CORS preflight request', async () => {
      const handler = createTelegramRoute({
        cors: { 
          origin: 'https://example.com',
          methods: ['POST', 'OPTIONS'],
        },
        rateLimit: false,
      });

      const request = createMockNextRequest({
        method: 'OPTIONS',
        headers: {
          origin: 'https://example.com',
          'access-control-request-method': 'POST',
        },
        ip: '10.10.10.10',
      });

      const response = await handler(request);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('should reject requests from unauthorized origins', async () => {
      const handler = createTelegramRoute({
        cors: { origin: 'https://example.com' },
        rateLimit: false,
      });

      const request = createMockNextRequest({
        body: { message: 'Test' },
        headers: { origin: 'https://evil.com' },
        ip: '11.11.11.11',
      });

      const response = await handler(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Origin not allowed');
    });

    it('should add CORS headers to successful response', async () => {
      const handler = createTelegramRoute({
        cors: { origin: 'https://example.com' },
        rateLimit: false,
      });

      const request = createMockNextRequest({
        body: { message: 'Test' },
        headers: { origin: 'https://example.com' },
        ip: '12.12.12.12',
      });

      const response = await handler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
    });

    it('should disable CORS when cors is false', async () => {
      const handler = createTelegramRoute({
        cors: false,
        rateLimit: false,
      });

      const request = createMockNextRequest({
        body: { message: 'Test' },
        headers: { origin: 'https://evil.com' },
        ip: '13.13.13.13',
      });

      const response = await handler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });

  describe('Lifecycle hooks', () => {
    it('should call onBeforeSend hook', async () => {
      const onBeforeSend = jest.fn<(req: TelegramNotifyRequest) => void>();
      const handler = createTelegramRoute({
        onBeforeSend,
        rateLimit: false,
      });

      const requestBody = { message: 'Test message' };
      const request = createMockNextRequest({
        body: requestBody,
        ip: '14.14.14.14',
      });

      await handler(request);

      expect(onBeforeSend).toHaveBeenCalledWith(requestBody);
    });

    it('should call onAfterSend hook', async () => {
      const onAfterSend = jest.fn<(req: TelegramNotifyRequest) => void>();
      const handler = createTelegramRoute({
        onAfterSend,
        rateLimit: false,
        cors: false,
      });

      const requestBody = { message: 'Test message' };
      const request = createMockNextRequest({
        body: requestBody,
        ip: '15.15.15.15',
      });

      await handler(request);

      expect(onAfterSend).toHaveBeenCalledWith(requestBody);
      expect(sendModule.sendTelegramNotification).toHaveBeenCalled();
    });

    it('should call onError hook when error occurs', async () => {
      const error = new Error('Test error');
      (sendModule.sendTelegramNotification as jest.MockedFunction<typeof sendModule.sendTelegramNotification>)
        .mockRejectedValueOnce(error);

      const onError = jest.fn<(err: Error, req: TelegramNotifyRequest) => void>();
      const handler = createTelegramRoute({
        onError,
        rateLimit: false,
        cors: false,
      });

      const requestBody = { message: 'Test message' };
      const request = createMockNextRequest({
        body: requestBody,
        ip: '16.16.16.16',
      });

      const response = await handler(request);

      expect(response.status).toBe(500);
      expect(onError).toHaveBeenCalledWith(error, expect.objectContaining({ message: '' }));
    });

    it('should support async hooks', async () => {
      const onBeforeSend = jest.fn<() => Promise<void>>().mockResolvedValue(undefined as void);
      const onAfterSend = jest.fn<() => Promise<void>>().mockResolvedValue(undefined as void);
      const handler = createTelegramRoute({
        onBeforeSend,
        onAfterSend,
        rateLimit: false,
        cors: false,
      });

      const request = createMockNextRequest({
        body: { message: 'Test' },
        ip: '17.17.17.17',
      });

      await handler(request);

      expect(onBeforeSend).toHaveBeenCalled();
      expect(onAfterSend).toHaveBeenCalled();
    });
  });

  describe('Combined security features', () => {
    it('should apply both rate limiting and CORS', async () => {
      const handler = createTelegramRoute({
        rateLimit: { maxRequests: 5, windowMs: 60000 },
        cors: { 
          origin: 'https://example.com',
          methods: ['POST', 'OPTIONS'],
        },
      });

      // First request should succeed
      const request1 = createMockNextRequest({
        body: { message: 'Test 1' },
        headers: { origin: 'https://example.com' },
        ip: '18.18.18.18',
      });
      const response1 = await handler(request1);
      expect(response1.status).toBe(200);
      expect(response1.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');

      // Send 4 more requests (total of 5, hitting the limit)
      for (let i = 0; i < 4; i++) {
        const request = createMockNextRequest({
          body: { message: `Test ${i + 2}` },
          headers: { origin: 'https://example.com' },
          ip: '18.18.18.18',
        });
        await handler(request);
      }

      // 6th request should be rate limited
      const request6 = createMockNextRequest({
        body: { message: 'Test 6' },
        headers: { origin: 'https://example.com' },
        ip: '18.18.18.18',
      });
      const response6 = await handler(request6);
      const data6 = await response6.json();

      expect(response6.status).toBe(429);
      expect(data6.error).toContain('Rate limit exceeded');
      // CORS headers should still be present on error
      expect(response6.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
    });
  });
});
