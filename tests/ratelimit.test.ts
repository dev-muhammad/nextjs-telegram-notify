import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { RateLimiter, createDefaultRateLimiter, createGlobalRateLimiter, createStrictRateLimiter } from '../src/lib/ratelimit';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000, // 1 second for fast testing
    });
  });

  afterEach(() => {
    limiter.destroy();
  });

  describe('check()', () => {
    it('should allow requests within limit', () => {
      const ip = '192.168.1.1';

      for (let i = 0; i < 5; i++) {
        const result = limiter.check(ip);
        expect(result.allowed).toBe(true);
        expect(result.retryAfter).toBeUndefined();
      }
    });

    it('should block requests exceeding limit', () => {
      const ip = '192.168.1.1';

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        limiter.check(ip);
      }

      // Next request should be blocked
      const result = limiter.check(ip);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(1);
    });

    it('should track different IPs separately', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // Use up limit for ip1
      for (let i = 0; i < 5; i++) {
        limiter.check(ip1);
      }

      // ip2 should still be allowed
      const result1 = limiter.check(ip1);
      const result2 = limiter.check(ip2);

      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);
    });

    it('should reset after window expires', async () => {
      const ip = '192.168.1.1';

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        limiter.check(ip);
      }

      expect(limiter.check(ip).allowed).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be allowed again
      const result = limiter.check(ip);
      expect(result.allowed).toBe(true);
    }, 2000);

    it('should use sliding window (allow gradual recovery)', async () => {
      const ip = '192.168.1.1';

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        limiter.check(ip);
      }

      expect(limiter.check(ip).allowed).toBe(false);

      // Wait 200ms (some requests should expire)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Make one more request - should still be blocked
      expect(limiter.check(ip).allowed).toBe(false);

      // Wait for first request to expire (total 1000ms)
      await new Promise(resolve => setTimeout(resolve, 900));

      // Should allow new request
      expect(limiter.check(ip).allowed).toBe(true);
    }, 2000);
  });

  describe('getUsage()', () => {
    it('should return usage stats', () => {
      const ip = '192.168.1.1';

      const usage1 = limiter.getUsage(ip);
      expect(usage1.count).toBe(0);

      limiter.check(ip);
      limiter.check(ip);
      limiter.check(ip);

      const usage2 = limiter.getUsage(ip);
      expect(usage2.count).toBe(3);
      expect(usage2.resetAt).toBeGreaterThan(Date.now());
    });

    it('should return zero for unknown IPs', () => {
      const usage = limiter.getUsage('unknown-ip');
      expect(usage.count).toBe(0);
      expect(usage.resetAt).toBeGreaterThan(Date.now());
    });
  });

  describe('reset()', () => {
    it('should reset specific IP', () => {
      const ip = '192.168.1.1';

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        limiter.check(ip);
      }

      expect(limiter.check(ip).allowed).toBe(false);

      // Reset
      limiter.reset(ip);

      // Should be allowed again
      expect(limiter.check(ip).allowed).toBe(true);
    });

    it('should only reset specified IP', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // Use up limits
      for (let i = 0; i < 5; i++) {
        limiter.check(ip1);
        limiter.check(ip2);
      }

      // Reset only ip1
      limiter.reset(ip1);

      expect(limiter.check(ip1).allowed).toBe(true);
      expect(limiter.check(ip2).allowed).toBe(false);
    });
  });

  describe('cleanup()', () => {
    it('should remove expired entries', async () => {
      const ip = '192.168.1.1';

      limiter.check(ip);

      // Wait for window to expire, cleanup happens automatically
      await new Promise(resolve => setTimeout(resolve, 1100));

      const usage = limiter.getUsage(ip);
      expect(usage.count).toBe(0);
    }, 2000);
  });

  describe('destroy()', () => {
    it('should stop cleanup interval', () => {
      const limiter2 = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      });

      limiter2.destroy();

      // Should not throw after destroy
      expect(() => limiter2.check('test')).not.toThrow();
    });
  });
});

describe('Factory Functions', () => {
  describe('createDefaultRateLimiter()', () => {
    it('should create limiter with default settings', () => {
      const limiter = createDefaultRateLimiter();
      const ip = '192.168.1.1';

      // Should allow 20 requests
      for (let i = 0; i < 20; i++) {
        expect(limiter.check(ip).allowed).toBe(true);
      }

      // 21st should be blocked
      expect(limiter.check(ip).allowed).toBe(false);

      limiter.destroy();
    });
  });

  describe('createGlobalRateLimiter()', () => {
    it('should create global limiter (30/sec)', () => {
      const limiter = createGlobalRateLimiter();

      // Should allow 30 requests
      for (let i = 0; i < 30; i++) {
        expect(limiter.check('global').allowed).toBe(true);
      }

      // 31st should be blocked
      expect(limiter.check('global').allowed).toBe(false);

      limiter.destroy();
    });
  });

  describe('createStrictRateLimiter()', () => {
    it('should create strict limiter (5/min)', () => {
      const limiter = createStrictRateLimiter();
      const ip = '192.168.1.1';

      // Should allow 5 requests
      for (let i = 0; i < 5; i++) {
        expect(limiter.check(ip).allowed).toBe(true);
      }

      // 6th should be blocked
      expect(limiter.check(ip).allowed).toBe(false);

      limiter.destroy();
    });
  });
});

describe('Edge Cases', () => {
  it('should handle concurrent requests', () => {
    const limiter = new RateLimiter({
      maxRequests: 10,
      windowMs: 1000,
    });
    const ip = '192.168.1.1';

    // Simulate concurrent requests
    const results = Array.from({ length: 15 }, () => limiter.check(ip));

    const allowed = results.filter(r => r.allowed).length;
    const blocked = results.filter(r => !r.allowed).length;

    expect(allowed).toBe(10);
    expect(blocked).toBe(5);

    limiter.destroy();
  });

  it('should handle empty IP string', () => {
    const limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
    });

    const result = limiter.check('');
    expect(result.allowed).toBe(true);

    limiter.destroy();
  });

  it('should handle very short windows', () => {
    const limiter = new RateLimiter({
      maxRequests: 2,
      windowMs: 10, // 10ms
    });
    const ip = '192.168.1.1';

    limiter.check(ip);
    limiter.check(ip);

    expect(limiter.check(ip).allowed).toBe(false);

    limiter.destroy();
  });
});
