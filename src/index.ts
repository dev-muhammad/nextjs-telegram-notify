// Client-side exports
export { useTelegramNotify } from './hooks/useTelegramNotify';

// Utility exports
export {
  formatMessageWithTimestamp,
  escapeHtml,
  escapeMarkdown,
  validateFileSize,
  validateFileType,
  formatFormData,
  createNotification,
} from './lib/formatter';

// Security exports
export {
  RateLimiter,
  createDefaultRateLimiter,
  createGlobalRateLimiter,
  createStrictRateLimiter,
} from './lib/ratelimit';

export {
  getClientIp,
  isOriginAllowed,
  createCorsHeaders,
  handleCorsPreflight,
  createDefaultCorsConfig,
  createStrictCorsConfig,
} from './lib/security';

// Type exports
export type {
  ParseMode,
  NotifyOptions,
  TelegramNotifyConfig,
  UseTelegramNotifyReturn,
  TelegramNotifyRequest,
  TelegramNotifyResponse,
  FileAttachment,
  RateLimitConfig,
  CorsConfig,
  SecurityConfig,
} from './types';
