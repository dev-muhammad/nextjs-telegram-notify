/**
 * Telegram parse modes for message formatting
 */
export type ParseMode = 'HTML' | 'Markdown' | 'MarkdownV2';

/**
 * Configuration for Telegram Bot
 */
export interface TelegramConfig {
  botToken: string;
  chatId: string;
  apiUrl?: string;
}

/**
 * Options for sending a notification
 */
export interface NotifyOptions {
  /** The message text to send */
  message: string;
  /** Parse mode for message formatting */
  parseMode?: ParseMode;
  /** File attachments (client-side: File[], server-side: Buffer[] or file paths) */
  files?: File[] | FileAttachment[];
  /** Override the default chat ID */
  chatId?: string;
  /** Send notification silently (no sound) */
  disableNotification?: boolean;
  /** Message thread ID for forum topics */
  threadId?: number;
}

/**
 * File attachment for server-side usage
 */
export interface FileAttachment {
  /** File buffer or file path */
  data: Buffer | string;
  /** File name */
  filename: string;
  /** MIME type (optional) */
  mimeType?: string;
}

/**
 * Response from Telegram API
 */
export interface TelegramResponse {
  ok: boolean;
  result?: TelegramMessage;
  description?: string;
  error_code?: number;
}

/**
 * Telegram message object
 */
export interface TelegramMessage {
  message_id: number;
  date: number;
  chat: {
    id: number;
    type: string;
  };
  text?: string;
  caption?: string;
  document?: {
    file_id: string;
    file_name: string;
    file_size: number;
  };
}

/**
 * Error from Telegram API
 */
export class TelegramError extends Error {
  code?: number;
  description?: string;

  constructor(message: string, code?: number, description?: string) {
    super(message);
    this.name = 'TelegramError';
    this.code = code;
    this.description = description;
    Object.setPrototypeOf(this, TelegramError.prototype);
  }
}

/**
 * Hook return type for useTelegramNotify
 */
export interface UseTelegramNotifyReturn {
  /** Send a notification */
  send: (options: NotifyOptions) => Promise<void>;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Success state */
  success: boolean;
  /** Reset the hook state */
  reset: () => void;
}

/**
 * Configuration for the notification hook
 */
export interface TelegramNotifyConfig {
  /** API endpoint (defaults to /api/telegram-notify) */
  endpoint?: string;
  /** Success callback */
  onSuccess?: () => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

/**
 * Request body for the API route
 */
export interface TelegramNotifyRequest {
  message: string;
  parseMode?: ParseMode;
  chatId?: string;
  disableNotification?: boolean;
  threadId?: number;
  files?: {
    name: string;
    data: string; // Base64 encoded
    type: string;
  }[];
}

/**
 * Response from the API route
 */
export interface TelegramNotifyResponse {
  success: boolean;
  error?: string;
  messageId?: number;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Enable per-IP rate limiting */
  perIP?: boolean;
  /** Custom error message when rate limited */
  message?: string;
}

/**
 * CORS configuration
 */
export interface CorsConfig {
  /** Allowed origins (e.g., ['https://example.com'] or '*') */
  origin: string | string[];
  /** Allowed HTTP methods */
  methods?: string[];
  /** Allowed headers */
  allowedHeaders?: string[];
  /** Exposed headers */
  exposedHeaders?: string[];
  /** Allow credentials */
  credentials?: boolean;
  /** Max age for preflight cache */
  maxAge?: number;
}

/**
 * Security configuration for route handler
 */
export interface SecurityConfig {
  /** Rate limiting configuration */
  rateLimit?: RateLimitConfig | false;
  /** Global rate limit (respects Telegram API limits) */
  globalRateLimit?: boolean;
  /** CORS configuration */
  cors?: CorsConfig | false;
  /** Maximum request body size in bytes */
  maxBodySize?: number;
  /** Allowed origins (shorthand for cors.origin) */
  allowedOrigins?: string[];
}
