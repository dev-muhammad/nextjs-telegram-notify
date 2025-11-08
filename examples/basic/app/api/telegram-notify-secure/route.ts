/**
 * Example of a secured Telegram notification API route
 * 
 * This demonstrates:
 * - Custom rate limiting (10 requests per minute per IP)
 * - CORS configuration (specific origin only)
 * - Lifecycle hooks for logging and validation
 */
import { createTelegramRoute } from 'nextjs-telegram-notify/route';

export const POST = createTelegramRoute({
  // Rate limiting: 10 requests per minute per IP
  rateLimit: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
  },
  
  // CORS: Only allow requests from your domain
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  },
  
  // Hook: Called before sending notification
  onBeforeSend: async (request) => {
    console.log('[Security] Notification request:', {
      timestamp: new Date().toISOString(),
      hasFiles: !!request.files?.length,
      messageLength: request.message.length,
    });
    
    // Example: Add custom validation
    if (request.message.length > 4000) {
      throw new Error('Message too long');
    }
  },
  
  // Hook: Called after successful send
  onAfterSend: async (request) => {
    console.log('[Security] Notification sent successfully');
  },
  
  // Hook: Called on error
  onError: async (error, request) => {
    console.error('[Security] Notification failed:', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  },
});
