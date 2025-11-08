# Security Guide

This document outlines the security features and best practices for `nextjs-telegram-notify`.

## Overview

The package includes built-in security features to protect your API endpoints from:
- Abuse and spam (rate limiting)
- Unauthorized cross-origin requests (CORS)
- Telegram API rate limit violations (global rate limiting)

## Rate Limiting

### Default Configuration

The built-in `POST` handler includes rate limiting by default:
- **Per-IP Limit**: 20 requests per minute
- **Global Limit**: 30 requests per second (respects Telegram API limits)

```typescript
// app/api/telegram-notify/route.ts
export { POST } from 'nextjs-telegram-notify/route';
```

### Custom Rate Limits

Adjust rate limits based on your needs:

```typescript
import { createTelegramRoute } from 'nextjs-telegram-notify/route';

export const POST = createTelegramRoute({
  rateLimit: {
    maxRequests: 10,       // Max requests per window
    windowMs: 60000,       // Time window (1 minute)
  }
});
```

### Disable Rate Limiting

For testing or trusted environments:

```typescript
export const POST = createTelegramRoute({
  rateLimit: false
});
```

### Rate Limit Response

When rate limited, clients receive:
- HTTP 429 status code
- `Retry-After` header with seconds until reset
- Rate limit headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Timestamp when limit resets

### How It Works

The rate limiter uses a **sliding window algorithm**:
1. Tracks requests per IP address
2. Maintains a window of recent requests
3. Removes expired requests automatically
4. Prevents abuse while allowing legitimate traffic

## CORS Configuration

### Default Configuration

By default, CORS allows all origins (`*`) for maximum compatibility:

```typescript
{
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400,
}
```

### Production Configuration

**Always restrict CORS in production:**

```typescript
export const POST = createTelegramRoute({
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL!,
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: false,
  }
});
```

### Multiple Origins

Support multiple domains:

```typescript
cors: {
  origin: [
    'https://yourdomain.com',
    'https://app.yourdomain.com',
    'https://beta.yourdomain.com',
  ],
}
```

### Disable CORS

For same-origin requests only:

```typescript
export const POST = createTelegramRoute({
  cors: false
});
```

## IP Detection

The package detects client IP from various sources:
1. `x-forwarded-for` header (most proxies)
2. `x-real-ip` header (nginx)
3. `cf-connecting-ip` header (Cloudflare)
4. Direct connection IP

Works seamlessly with:
- Vercel
- Cloudflare
- Nginx
- AWS CloudFront
- Any standard reverse proxy

## Lifecycle Hooks

Add custom security logic with hooks:

```typescript
export const POST = createTelegramRoute({
  // Before sending notification
  onBeforeSend: async (request) => {
    // Log request
    console.log('Notification request:', {
      timestamp: new Date().toISOString(),
      messageLength: request.message.length,
      hasFiles: !!request.files,
    });
    
    // Custom validation
    if (request.message.includes('spam')) {
      throw new Error('Suspected spam');
    }
    
    // Check against database
    // await checkUserPermissions();
  },
  
  // After successful send
  onAfterSend: async (request) => {
    // Log success
    console.log('Notification sent successfully');
    
    // Update analytics
    // await trackNotification();
  },
  
  // On error
  onError: async (error, request) => {
    // Log error
    console.error('Notification failed:', error);
    
    // Report to error tracking
    // await Sentry.captureException(error);
  },
});
```

## Advanced Security

### Create Custom Rate Limiter

For advanced use cases:

```typescript
import { RateLimiter } from 'nextjs-telegram-notify';

const customLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 30000, // 30 seconds
  perIP: true,
  message: 'Too many requests from this IP',
});

// Check rate limit
const result = customLimiter.check(clientIp);
if (!result.allowed) {
  console.log(`Rate limited. Retry after ${result.retryAfter}s`);
}

// Get usage stats
const usage = customLimiter.getUsage(clientIp);
console.log(`Requests: ${usage.count}/${maxRequests}`);

// Reset specific IP
customLimiter.reset(clientIp);
```

### Strict Configuration

Maximum security preset:

```typescript
import { createStrictRateLimiter, createStrictCorsConfig } from 'nextjs-telegram-notify';

export const POST = createTelegramRoute({
  rateLimit: {
    maxRequests: 5,    // Very strict
    windowMs: 60000,   // 1 minute
  },
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL!,
    methods: ['POST'],
    allowedHeaders: ['Content-Type'],
    credentials: false,
  },
  onBeforeSend: async (request) => {
    // Add custom authentication
    // await verifyToken(request);
  },
});
```

## Best Practices

### ✅ Do

1. **Use environment variables** for sensitive data
2. **Enable rate limiting** in production
3. **Restrict CORS** to your domain(s)
4. **Monitor and log** security events
5. **Test rate limits** before deploying
6. **Keep dependencies updated**
7. **Use HTTPS only** in production

### ❌ Don't

1. **Don't commit** `.env` files
2. **Don't disable security** in production
3. **Don't allow all origins** in production
4. **Don't ignore rate limit errors**
5. **Don't set limits too low** (breaks UX)
6. **Don't set limits too high** (allows abuse)

## Security Checklist

Before deploying to production:

- [ ] Environment variables configured (`.env.local`)
- [ ] Rate limiting enabled
- [ ] CORS restricted to your domain
- [ ] HTTPS enforced
- [ ] Error logging configured
- [ ] Rate limits tested
- [ ] Security headers configured (via Next.js)
- [ ] Dependencies up to date

## Testing Security

Use the security test page to verify configuration:

```bash
npm run dev
# Visit http://localhost:3000/security-test
```

Test scenarios:
1. **Single request** - Should succeed
2. **Burst test (15 requests)** - First 10 succeed, rest rate limited
3. **Wait 60 seconds** - Rate limit resets
4. **CORS test** - Check Network tab for CORS headers

## Monitoring

### Log Rate Limit Events

```typescript
onBeforeSend: async (request) => {
  console.log('[Security]', {
    timestamp: new Date().toISOString(),
    messageLength: request.message.length,
    // Add more context
  });
}
```

### Track Rate Limit Hits

```typescript
onError: async (error) => {
  if (error.message.includes('Rate limit exceeded')) {
    // Alert or track rate limit violations
    console.warn('[Security] Rate limit hit');
  }
}
```

## Deployment Platforms

### Vercel

Works out of the box. IP detection automatic.

### Cloudflare

IP detection via `CF-Connecting-IP` header.

### Nginx

Configure proxy headers:
```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

### Custom Server

Ensure proxy headers are forwarded correctly.

## Report Security Issues

If you discover a security vulnerability, please email security@example.com instead of using the public issue tracker.

## Updates

Security features are continuously improved. Keep the package updated:

```bash
npm update nextjs-telegram-notify
```

Check `CHANGELOG.md` for security-related updates.
