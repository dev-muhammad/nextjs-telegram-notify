# 📱 nextjs-telegram-notify

A lightweight Next.js package for sending notifications to Telegram. Perfect for contact forms, bug reports, user feedback, and any notification needs.

[![npm version](https://badge.fury.io/js/nextjs-telegram-notify.svg)](https://www.npmjs.com/package/nextjs-telegram-notify)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![codecov](https://codecov.io/gh/dev-muhammmad/nextjs-telegram-notify/branch/main/graph/badge.svg)](https://codecov.io/gh/dev-muhammmad/nextjs-telegram-notify)

## ✨ Features

- 🚀 **Simple Integration** - Get started in under 5 minutes
- 🔒 **Secure** - Server-side Telegram API integration
- 📝 **TypeScript** - Full type safety out of the box
- 🎨 **Flexible** - Works with any form library or custom UI
- 📎 **File Support** - Send documents, images, and attachments
- ⚡ **Lightweight** - Minimal dependencies, < 20KB gzipped
- 🔄 **Auto Retry** - Built-in retry logic with exponential backoff
- 🎯 **Generic** - Not limited to forms - works for any notification scenario

## 📦 Installation

```bash
npm install nextjs-telegram-notify
```

```bash
yarn add nextjs-telegram-notify
```

```bash
pnpm add nextjs-telegram-notify
```

## 🚀 Quick Start

### 1. Set up your Telegram Bot

1. Create a bot via [@BotFather](https://t.me/botfather) on Telegram
2. Get your bot token
3. Get your chat ID using [@userinfobot](https://t.me/userinfobot) or [@getidsbot](https://t.me/getidsbot)

### 2. Add Environment Variables

Create a `.env.local` file in your Next.js project:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 3. Create API Route

Create `app/api/telegram-notify/route.ts`:

```typescript
// For default setup - just one line!
export { POST } from 'nextjs-telegram-notify/route';
```

### 4. Use in Your Components

```tsx
'use client';

import { useTelegramNotify } from 'nextjs-telegram-notify';

export default function ContactForm() {
  const { send, loading, error } = useTelegramNotify();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await send({
      message: 'New contact form submission!',
      parseMode: 'HTML'
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button disabled={loading}>
        {loading ? 'Sending...' : 'Submit'}
      </button>
      {error && <p>Error: {error.message}</p>}
    </form>
  );
}
```

That's it! 🎉

## 📚 Usage Examples

### Contact Form

```tsx
'use client';

import { useTelegramNotify } from 'nextjs-telegram-notify';
import { useState } from 'react';

export default function ContactForm() {
  const { send, loading, error, success } = useTelegramNotify();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const message = `
📬 <b>New Contact Form Submission</b>

👤 Name: ${formData.name}
📧 Email: ${formData.email}
💬 Message: ${formData.message}

⏰ ${new Date().toLocaleString()}
    `.trim();

    await send({ message, parseMode: 'HTML' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Name"
        required
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <textarea
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        placeholder="Message"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Message'}
      </button>
      {error && <p className="error">{error.message}</p>}
      {success && <p className="success">Message sent successfully!</p>}
    </form>
  );
}
```

### Bug Report Button

```tsx
'use client';

import { useTelegramNotify } from 'nextjs-telegram-notify';

export default function BugReportButton() {
  const { send, loading } = useTelegramNotify();

  const reportBug = async () => {
    await send({
      message: `
🐛 <b>Bug Report</b>

📄 Page: ${window.location.href}
🖥️ User Agent: ${navigator.userAgent}
⏰ Time: ${new Date().toISOString()}
      `.trim(),
      parseMode: 'HTML'
    });
  };

  return (
    <button onClick={reportBug} disabled={loading}>
      🐛 Report Bug
    </button>
  );
}
```

### File Upload

```tsx
'use client';

import { useTelegramNotify } from 'nextjs-telegram-notify';

export default function FileUploadForm() {
  const { send, loading } = useTelegramNotify();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    await send({
      message: '📎 New file uploaded',
      files: [file]
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" name="file" required />
      <button type="submit" disabled={loading}>Upload</button>
    </form>
  );
}
```

### Server-Side Usage

```typescript
// app/api/feedback/route.ts
import { sendTelegramNotification } from 'nextjs-telegram-notify/server';

export async function POST(request: Request) {
  const { rating, comment } = await request.json();

  await sendTelegramNotification({
    message: `
⭐ <b>User Feedback</b>

Rating: ${'⭐'.repeat(rating)}
Comment: ${comment}
    `.trim(),
    parseMode: 'HTML'
  });

  return Response.json({ success: true });
}
```

## Security Features

### Rate Limiting

Protect your API endpoint from abuse with built-in rate limiting:

```typescript
import { createTelegramRoute } from 'nextjs-telegram-notify/route';

export const POST = createTelegramRoute({
  rateLimit: {
    maxRequests: 10,       // Max requests per window
    windowMs: 60000,       // Time window in milliseconds (1 minute)
  }
});
```

**Default Limits:**
- Per-IP: 20 requests per minute
- Global (Telegram API): 30 requests per second

**Rate Limit Headers:**
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1234567890
```

**Disable Rate Limiting:**
```typescript
export const POST = createTelegramRoute({
  rateLimit: false
});
```

### CORS Configuration

Control which origins can access your API:

```typescript
export const POST = createTelegramRoute({
  cors: {
    origin: 'https://yourdomain.com',  // Specific origin
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: false,
  }
});
```

**Multiple Origins:**
```typescript
cors: {
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
}
```

**Wildcard (Development Only):**
```typescript
cors: {
  origin: '*',  // Allow all origins - not recommended for production
}
```

**Disable CORS:**
```typescript
export const POST = createTelegramRoute({
  cors: false
});
```

### Security Best Practices

1. **Always use environment variables** for sensitive data
2. **Enable rate limiting** to prevent abuse
3. **Restrict CORS** to your domain only
4. **Use lifecycle hooks** for logging and monitoring
5. **Validate input** on the server side

**Complete Security Example:**

```typescript
// app/api/telegram-notify/route.ts
import { createTelegramRoute } from 'nextjs-telegram-notify/route';

export const POST = createTelegramRoute({
  // Rate limiting
  rateLimit: {
    maxRequests: 10,
    windowMs: 60000,
  },
  
  // CORS protection
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL!,
    credentials: false,
  },
  
  // Logging
  onBeforeSend: async (request) => {
    console.log('Notification request:', {
      timestamp: new Date().toISOString(),
      messageLength: request.message.length,
    });
  },
  
  // Error tracking
  onError: async (error) => {
    console.error('Notification failed:', error);
    // Report to your error tracking service
  },
});
```

## 🔧 API Reference

### `useTelegramNotify(config?)`

Client-side React hook for sending notifications.

**Parameters:**
- `config` (optional):
  - `endpoint?: string` - API endpoint (default: `/api/telegram-notify`)
  - `onSuccess?: () => void` - Success callback
  - `onError?: (error: Error) => void` - Error callback

**Returns:**
- `send: (options: NotifyOptions) => Promise<void>` - Send notification function
- `loading: boolean` - Loading state
- `error: Error | null` - Error state
- `success: boolean` - Success state
- `reset: () => void` - Reset state function

### `sendTelegramNotification(options)`

Server-side function for sending notifications.

**Parameters:**
- `options: NotifyOptions`:
  - `message: string` - Message text (required)
  - `parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'` - Message formatting
  - `files?: FileAttachment[]` - File attachments
  - `chatId?: string` - Override default chat ID
  - `disableNotification?: boolean` - Silent notification
  - `threadId?: number` - Forum topic thread ID

### Utility Functions

```typescript
import {
  formatMessageWithTimestamp,
  escapeHtml,
  escapeMarkdown,
  validateFileSize,
  validateFileType,
  formatFormData,
  createNotification
} from 'nextjs-telegram-notify';
```

#### `createNotification(options)`

Helper for creating structured notification messages:

```typescript
const message = createNotification({
  title: 'New Order',
  emoji: '🛒',
  fields: {
    'Order ID': '#12345',
    'Customer': 'John Doe',
    'Total': '$99.99'
  },
  includeTimestamp: true
});
```

## 🎨 Message Formatting

### HTML Format

```typescript
await send({
  message: `
<b>Bold text</b>
<i>Italic text</i>
<code>Code</code>
<a href="https://example.com">Link</a>
  `.trim(),
  parseMode: 'HTML'
});
```

### Markdown Format

```typescript
await send({
  message: `
**Bold text**
_Italic text_
\`Code\`
[Link](https://example.com)
  `.trim(),
  parseMode: 'Markdown'
});
```

## 🔒 Security Best Practices

1. **Never expose your bot token** - Keep it in server-side environment variables
2. **Validate user input** - Sanitize data before sending to Telegram
3. **Implement rate limiting** - Prevent spam/abuse of your notification endpoint
4. **Use CAPTCHA** - For public-facing forms to prevent bot submissions
5. **Validate file uploads** - Check file types and sizes before sending

## 🛠️ Advanced Configuration

### Custom API Route with Hooks

```typescript
// app/api/telegram-notify/route.ts
import { createTelegramRoute } from 'nextjs-telegram-notify/route';

export const POST = createTelegramRoute({
  onBeforeSend: async (request) => {
    // Add custom validation, logging, etc.
    console.log('Sending notification:', request.message);
  },
  onAfterSend: async (request) => {
    // Log success, trigger webhooks, etc.
    console.log('Notification sent successfully');
  },
  onError: async (error, request) => {
    // Custom error handling
    console.error('Failed to send notification:', error);
  }
});
```

### Custom Telegram Client

```typescript
import { createTelegramClient } from 'nextjs-telegram-notify/server';

const client = createTelegramClient({
  botToken: process.env.TELEGRAM_BOT_TOKEN!,
  chatId: process.env.TELEGRAM_CHAT_ID!
});

await client.sendMessage('Custom message');
await client.sendDocument(fileAttachment, {
  caption: 'File caption'
});
```

## 📋 Use Cases

- ✅ Contact forms
- ✅ Bug reports
- ✅ Typo corrections
- ✅ User feedback & ratings
- ✅ Newsletter signups
- ✅ Order notifications
- ✅ Support tickets
- ✅ System alerts
- ✅ Analytics events
- ✅ Content moderation alerts

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © Muhammad Abdugafarov

## 🙏 Acknowledgments

Built with ❤️ for the Next.js community.

---

**Need help?** Open an issue on [GitHub](https://github.com/dev-muhammad/nextjs-telegram-notify/issues)
