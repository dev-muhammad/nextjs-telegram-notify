import { describe, it, expect } from '@jest/globals';
import { NextRequest } from 'next/server';
import type { CorsConfig } from '../src/types';
import {
  getClientIp,
  isOriginAllowed,
  createCorsHeaders,
  handleCorsPreflight,
  createDefaultCorsConfig,
  createStrictCorsConfig,
} from '../src/lib/security';

// Helper to create mock NextRequest
function createMockRequest(headers: Record<string, string>, origin?: string): NextRequest {
  const url = 'http://localhost:3000/api/test';
  const request = new NextRequest(url, {
    headers: new Headers(headers),
  });
  return request;
}

describe('Security Utilities', () => {
  describe('getClientIp()', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = createMockRequest({
        'x-real-ip': '192.168.1.2',
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.2');
    });

    it('should extract IP from cf-connecting-ip header (Cloudflare)', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '192.168.1.3',
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.3');
    });

    it('should prioritize x-forwarded-for over others', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '192.168.1.2',
        'cf-connecting-ip': '192.168.1.3',
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.1'); // x-forwarded-for has priority
    });

    it('should return unknown when no IP headers present', () => {
      const request = createMockRequest({});

      const ip = getClientIp(request);
      expect(ip).toBe('unknown');
    });

    it('should handle multiple IPs in x-forwarded-for', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.1'); // Should return first IP
    });

    it('should trim whitespace from IPs', () => {
      const request = createMockRequest({
        'x-forwarded-for': '  192.168.1.1  ',
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });
  });

  describe('isOriginAllowed()', () => {
    it('should allow any origin with wildcard', () => {
      const config: CorsConfig = { origin: '*' };

      expect(isOriginAllowed('https://example.com', config)).toBe(true);
      expect(isOriginAllowed('http://localhost:3000', config)).toBe(true);
    });

    it('should allow specific origin', () => {
      const config: CorsConfig = { origin: 'https://example.com' };

      expect(isOriginAllowed('https://example.com', config)).toBe(true);
      expect(isOriginAllowed('https://other.com', config)).toBe(false);
    });

    it('should allow multiple origins from array', () => {
      const config: CorsConfig = {
        origin: ['https://example.com', 'https://app.example.com'],
      };

      expect(isOriginAllowed('https://example.com', config)).toBe(true);
      expect(isOriginAllowed('https://app.example.com', config)).toBe(true);
      expect(isOriginAllowed('https://other.com', config)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const config: CorsConfig = { origin: 'https://example.com' };

      expect(isOriginAllowed('https://Example.com', config)).toBe(false);
      expect(isOriginAllowed('HTTPS://example.com', config)).toBe(false);
    });
  });

  describe('createCorsHeaders()', () => {
    it('should create headers for wildcard origin', () => {
      const request = createMockRequest({
        origin: 'https://example.com',
      });
      const config = createDefaultCorsConfig();

      const headers = createCorsHeaders(request, config) as Record<string, string>;

      expect(headers['Access-Control-Allow-Origin']).toBe('*');
      expect(headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
      expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization');
    });

    it('should reflect origin when specific origin configured', () => {
      const request = createMockRequest({
        origin: 'https://example.com',
      });
      const config = {
        ...createDefaultCorsConfig(),
        origin: 'https://example.com',
      };

      const headers = createCorsHeaders(request, config) as Record<string, string>;

      expect(headers['Access-Control-Allow-Origin']).toBe('https://example.com');
    });

    it('should include credentials header when enabled', () => {
      const request = createMockRequest({
        origin: 'https://example.com',
      });
      const config = {
        ...createDefaultCorsConfig(),
        origin: 'https://example.com',
        credentials: true,
      };

      const headers = createCorsHeaders(request, config) as Record<string, string>;

      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should not include credentials header when disabled', () => {
      const request = createMockRequest({
        origin: 'https://example.com',
      });
      const config = {
        ...createDefaultCorsConfig(),
        origin: 'https://example.com',
        credentials: false,
      };

      const headers = createCorsHeaders(request, config) as Record<string, string>;

      expect(headers['Access-Control-Allow-Credentials']).toBeUndefined();
    });

    it('should include max-age when specified', () => {
      const request = createMockRequest({
        origin: 'https://example.com',
      });
      const config = {
        ...createDefaultCorsConfig(),
        maxAge: 3600,
      };

      const headers = createCorsHeaders(request, config) as Record<string, string>;

      expect(headers['Access-Control-Max-Age']).toBe('3600');
    });

    it('should handle array of methods', () => {
      const request = createMockRequest({
        origin: 'https://example.com',
      });
      const config = {
        ...createDefaultCorsConfig(),
        methods: ['GET', 'POST', 'PUT'],
      };

      const headers = createCorsHeaders(request, config) as Record<string, string>;

      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT');
    });

    it('should handle array of headers', () => {
      const request = createMockRequest({
        origin: 'https://example.com',
      });
      const config = {
        ...createDefaultCorsConfig(),
        allowedHeaders: ['Content-Type', 'X-Custom-Header'],
      };

      const headers = createCorsHeaders(request, config) as Record<string, string>;

      expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type, X-Custom-Header');
    });
  });

  describe('handleCorsPreflight()', () => {
    it('should return response for OPTIONS request', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS',
        headers: new Headers({
          origin: 'https://example.com',
        }),
      });
      const config = createDefaultCorsConfig();

      const response = handleCorsPreflight(request, config);

      expect(response).not.toBeNull();
      expect(response?.status).toBe(204);
    });

    it('should return null for non-OPTIONS request', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: new Headers({
          origin: 'https://example.com',
        }),
      });
      const config = createDefaultCorsConfig();

      const response = handleCorsPreflight(request, config);

      expect(response).toBeNull();
    });

    it('should include CORS headers in preflight response', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS',
        headers: new Headers({
          origin: 'https://example.com',
        }),
      });
      const config = createDefaultCorsConfig();

      const response = handleCorsPreflight(request, config);

      expect(response?.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response?.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    });
  });

  describe('createDefaultCorsConfig()', () => {
    it('should return default configuration', () => {
      const config = createDefaultCorsConfig();

      expect(config.origin).toBe('*');
      expect(config.methods).toEqual(['POST', 'OPTIONS']);
      expect(config.allowedHeaders).toEqual(['Content-Type', 'Authorization']);
      expect(config.credentials).toBe(false);
      expect(config.maxAge).toBe(86400);
    });
  });

  describe('createStrictCorsConfig()', () => {
    it('should return strict configuration', () => {
      const origins = ['https://example.com'];
      const config = createStrictCorsConfig(origins);

      expect(config.origin).toEqual(origins);
      expect(config.methods).toEqual(['POST']);
      expect(config.allowedHeaders).toEqual(['Content-Type']);
      expect(config.credentials).toBe(true); // Strict config enables credentials
      expect(config.maxAge).toBe(3600);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing origin header', () => {
      const request = createMockRequest({});
      const config = createDefaultCorsConfig();

      const headers = createCorsHeaders(request, config) as Record<string, string>;

      expect(headers['Access-Control-Allow-Origin']).toBe('*');
    });

    it('should handle empty string origin', () => {
      const config = { origin: '' };

      expect(isOriginAllowed('https://example.com', config)).toBe(false);
    });

    it('should handle array with empty strings', () => {
      const config = { origin: ['', 'https://example.com'] };

      expect(isOriginAllowed('https://example.com', config)).toBe(true);
      expect(isOriginAllowed('https://other.com', config)).toBe(false);
    });
  });
});
