import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramNotification } from '../server/send';
import type { TelegramNotifyRequest, TelegramNotifyResponse, FileAttachment, RateLimitConfig, CorsConfig } from '../types';
import { RateLimiter, createDefaultRateLimiter, createGlobalRateLimiter } from '../lib/ratelimit';
import { getClientIp, createCorsHeaders, handleCorsPreflight, createDefaultCorsConfig, isOriginAllowed } from '../lib/security';

// Global rate limiters (shared across all requests)
let ipRateLimiter: RateLimiter | null = null;
let globalRateLimiter: RateLimiter | null = null;

/**
 * Built-in API route handler for Next.js App Router with security features
 * 
 * Usage in your app:
 * Create a file at `app/api/telegram-notify/route.ts`:
 * 
 * ```ts
 * export { POST } from 'nextjs-telegram-notify/route';
 * ```
 * 
 * Or with custom configuration:
 * 
 * ```ts
 * import { createTelegramRoute } from 'nextjs-telegram-notify/route';
 * 
 * export const POST = createTelegramRoute({
 *   rateLimit: { maxRequests: 10, windowMs: 60000 },
 *   cors: { origin: 'https://yourdomain.com' }
 * });
 * ```
 */
export async function POST(request: NextRequest): Promise<NextResponse<TelegramNotifyResponse>> {
  // Initialize default rate limiters if not already created
  if (!ipRateLimiter) {
    ipRateLimiter = createDefaultRateLimiter();
  }
  if (!globalRateLimiter) {
    globalRateLimiter = createGlobalRateLimiter();
  }

  try {
    // Apply rate limiting
    const clientIp = getClientIp(request);
    
    // Check per-IP rate limit
    const ipCheck = ipRateLimiter.check(clientIp);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Rate limit exceeded. Try again in ${ipCheck.retryAfter} seconds.` 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': ipCheck.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Date.now().toString(),
          }
        }
      );
    }

    // Check global rate limit (Telegram API limit)
    const globalCheck = globalRateLimiter.check('global');
    if (!globalCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server is busy. Please try again in a moment.' 
        },
        { 
          status: 503,
          headers: {
            'Retry-After': globalCheck.retryAfter?.toString() || '1',
          }
        }
      );
    }

    const body: TelegramNotifyRequest = await request.json();

    const { message, parseMode, chatId, disableNotification, threadId, files } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Convert base64 files back to Buffer if provided
    const fileAttachments: FileAttachment[] | undefined = files?.map((file) => ({
      data: Buffer.from(file.data, 'base64'),
      filename: file.name,
      mimeType: file.type,
    }));

    await sendTelegramNotification({
      message,
      parseMode,
      chatId,
      disableNotification,
      threadId,
      files: fileAttachments,
    });

    // Add rate limit headers to successful response
    const usage = ipRateLimiter.getUsage(clientIp);
    return NextResponse.json(
      { success: true },
      {
        headers: {
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': (20 - usage.count).toString(),
          'X-RateLimit-Reset': usage.resetAt.toString(),
        }
      }
    );
  } catch (error) {
    console.error('Telegram notification error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Create a custom Telegram route handler with security and hook options
 */
export function createTelegramRoute(options?: {
  rateLimit?: RateLimitConfig | false;
  cors?: CorsConfig | false;
  onBeforeSend?: (request: TelegramNotifyRequest) => Promise<void> | void;
  onAfterSend?: (request: TelegramNotifyRequest) => Promise<void> | void;
  onError?: (error: Error, request: TelegramNotifyRequest) => Promise<void> | void;
}) {
  // Create custom rate limiters if provided
  const customIpLimiter = options?.rateLimit !== false && typeof options?.rateLimit === 'object'
    ? new RateLimiter(options.rateLimit)
    : options?.rateLimit === false ? null : undefined;
  
  const customGlobalLimiter = options?.rateLimit !== false && typeof options?.rateLimit === 'object'
    ? createGlobalRateLimiter()
    : options?.rateLimit === false ? null : undefined;

  const corsConfig = options?.cors === false ? null : (options?.cors || createDefaultCorsConfig());

  return async function handler(request: NextRequest): Promise<NextResponse<TelegramNotifyResponse>> {
    try {
      // Handle CORS preflight
      if (corsConfig && request.method === 'OPTIONS') {
        const preflightResponse = handleCorsPreflight(request, corsConfig);
        if (preflightResponse) return preflightResponse as NextResponse<TelegramNotifyResponse>;
      }

      // Use custom rate limiters or fall back to global defaults
      const ipLimiter = customIpLimiter !== undefined ? customIpLimiter : ipRateLimiter;
      const globalLimiter = customGlobalLimiter !== undefined ? customGlobalLimiter : globalRateLimiter;

      // Initialize default rate limiters if not already created and no custom ones
      if (!ipLimiter && customIpLimiter === undefined && !ipRateLimiter) {
        ipRateLimiter = createDefaultRateLimiter();
      }
      if (!globalLimiter && customGlobalLimiter === undefined && !globalRateLimiter) {
        globalRateLimiter = createGlobalRateLimiter();
      }

      const clientIp = getClientIp(request);
      const finalIpLimiter = ipLimiter || ipRateLimiter;
      const finalGlobalLimiter = globalLimiter || globalRateLimiter;

      // Apply rate limiting if enabled
      if (finalIpLimiter) {
        const ipCheck = finalIpLimiter.check(clientIp);
        if (!ipCheck.allowed) {
          const headers = corsConfig ? createCorsHeaders(request, corsConfig) : {};
          const maxRequests = typeof options?.rateLimit === 'object' 
            ? options.rateLimit.maxRequests 
            : 20;
          return NextResponse.json(
            { 
              success: false, 
              error: `Rate limit exceeded. Try again in ${ipCheck.retryAfter} seconds.` 
            },
            { 
              status: 429,
              headers: {
                ...headers,
                'Retry-After': ipCheck.retryAfter?.toString() || '60',
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': Date.now().toString(),
              }
            }
          );
        }
      }

      if (finalGlobalLimiter) {
        const globalCheck = finalGlobalLimiter.check('global');
        if (!globalCheck.allowed) {
          const headers = corsConfig ? createCorsHeaders(request, corsConfig) : {};
          return NextResponse.json(
            { 
              success: false, 
              error: 'Server is busy. Please try again in a moment.' 
            },
            { 
              status: 503,
              headers: {
                ...headers,
                'Retry-After': globalCheck.retryAfter?.toString() || '1',
              }
            }
          );
        }
      }

      // CORS validation
      if (corsConfig) {
        const origin = request.headers.get('origin');
        if (origin && !isOriginAllowed(origin, corsConfig)) {
          return NextResponse.json(
            { success: false, error: 'Origin not allowed' },
            { status: 403 }
          );
        }
      }

      const body: TelegramNotifyRequest = await request.json();

      const { message, parseMode, chatId, disableNotification, threadId, files } = body;

      if (!message) {
        const headers = corsConfig ? createCorsHeaders(request, corsConfig) : {};
        return NextResponse.json(
          { success: false, error: 'Message is required' },
          { status: 400, headers }
        );
      }

      // Call before send hook
      if (options?.onBeforeSend) {
        await options.onBeforeSend(body);
      }

      // Convert base64 files back to Buffer if provided
      const fileAttachments: FileAttachment[] | undefined = files?.map((file) => ({
        data: Buffer.from(file.data, 'base64'),
        filename: file.name,
        mimeType: file.type,
      }));

      await sendTelegramNotification({
        message,
        parseMode,
        chatId,
        disableNotification,
        threadId,
        files: fileAttachments,
      });

      // Call after send hook
      if (options?.onAfterSend) {
        await options.onAfterSend(body);
      }

      // Build response headers
      const responseHeaders = corsConfig ? createCorsHeaders(request, corsConfig) : {};
      
      // Add rate limit headers to successful response
      if (finalIpLimiter) {
        const usage = finalIpLimiter.getUsage(clientIp);
        const maxRequests = typeof options?.rateLimit === 'object'
          ? options.rateLimit.maxRequests 
          : 20;
        Object.assign(responseHeaders, {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': (maxRequests - usage.count).toString(),
          'X-RateLimit-Reset': usage.resetAt.toString(),
        });
      }

      return NextResponse.json(
        { success: true },
        { headers: responseHeaders }
      );
    } catch (error) {
      console.error('Telegram notification error:', error);

      const err = error instanceof Error ? error : new Error('Unknown error');
      const body: TelegramNotifyRequest = await request.json().catch(() => ({ message: '' }));

      // Call error hook
      if (options?.onError) {
        await options.onError(err, body);
      }

      const headers = corsConfig ? createCorsHeaders(request, corsConfig) : {};

      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500, headers }
      );
    }
  };
}
