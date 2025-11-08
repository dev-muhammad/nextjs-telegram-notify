/**
 * Rate limiter implementation using sliding window algorithm
 * Respects Telegram's rate limits: 30 messages per second per bot
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
  requests: number[];
}

interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Enable per-IP rate limiting */
  perIP?: boolean;
  /** Message shown when rate limited */
  message?: string;
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: Required<RateLimitConfig>;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      perIP: config.perIP ?? true,
      message: config.message ?? 'Too many requests, please try again later.',
    };

    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if a request should be allowed
   */
  check(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const key = this.config.perIP ? identifier : 'global';
    
    let entry = this.store.get(key);

    if (!entry) {
      entry = {
        count: 0,
        resetAt: now + this.config.windowMs,
        requests: [],
      };
      this.store.set(key, entry);
    }

    // Remove requests outside the sliding window
    entry.requests = entry.requests.filter(
      (timestamp) => timestamp > now - this.config.windowMs
    );

    // Check if limit exceeded
    if (entry.requests.length >= this.config.maxRequests) {
      const oldestRequest = entry.requests[0];
      const retryAfter = Math.ceil((oldestRequest + this.config.windowMs - now) / 1000);
      
      return {
        allowed: false,
        retryAfter: retryAfter > 0 ? retryAfter : 1,
      };
    }

    // Allow the request
    entry.requests.push(now);
    entry.count++;
    this.store.set(key, entry);

    return { allowed: true };
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string): void {
    const key = this.config.perIP ? identifier : 'global';
    this.store.delete(key);
  }

  /**
   * Get current usage for an identifier
   */
  getUsage(identifier: string): { count: number; limit: number; resetAt: number } {
    const now = Date.now();
    const key = this.config.perIP ? identifier : 'global';
    const entry = this.store.get(key);

    if (!entry) {
      return {
        count: 0,
        limit: this.config.maxRequests,
        resetAt: now + this.config.windowMs,
      };
    }

    // Filter recent requests
    const recentRequests = entry.requests.filter(
      (timestamp) => timestamp > now - this.config.windowMs
    );

    return {
      count: recentRequests.length,
      limit: this.config.maxRequests,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.store.entries()) {
      // Remove requests outside the window
      entry.requests = entry.requests.filter(
        (timestamp) => timestamp > now - this.config.windowMs
      );

      // Delete entry if no recent requests
      if (entry.requests.length === 0) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the rate limiter and cleanup
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

/**
 * Default rate limiter respecting Telegram's limits
 * Telegram allows 30 messages per second, we'll be more conservative
 */
export const createDefaultRateLimiter = () => {
  return new RateLimiter({
    maxRequests: 20, // 20 messages per minute per IP (conservative)
    windowMs: 60 * 1000, // 1 minute
    perIP: true,
  });
};

/**
 * Global rate limiter for Telegram API (30 messages/second limit)
 * This ensures we don't exceed Telegram's API limits
 */
export const createGlobalRateLimiter = () => {
  return new RateLimiter({
    maxRequests: 30,
    windowMs: 1000, // 1 second
    perIP: false, // Global limit
    message: 'Server is busy, please try again in a moment.',
  });
};

/**
 * Strict rate limiter for public forms (to prevent spam)
 */
export const createStrictRateLimiter = () => {
  return new RateLimiter({
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 messages per minute
    perIP: true,
  });
};
