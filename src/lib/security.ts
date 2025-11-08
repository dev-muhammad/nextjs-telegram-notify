import { NextRequest, NextResponse } from 'next/server';
import type { CorsConfig } from '../types';

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  // Try various headers in order of preference
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback
  return 'unknown';
}

/**
 * Check if origin is allowed based on CORS config
 */
export function isOriginAllowed(origin: string | null, config: CorsConfig): boolean {
  if (!origin) return false;

  if (config.origin === '*') return true;

  if (typeof config.origin === 'string') {
    return origin === config.origin;
  }

  if (Array.isArray(config.origin)) {
    return config.origin.includes(origin);
  }

  return false;
}

/**
 * Create CORS headers for response
 */
export function createCorsHeaders(
  request: NextRequest,
  config: CorsConfig
): HeadersInit {
  const origin = request.headers.get('origin');
  const headers: HeadersInit = {};

  // Handle origin
  if (config.origin === '*') {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (origin && isOriginAllowed(origin, config)) {
    headers['Access-Control-Allow-Origin'] = origin;
    if (config.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  }

  // Methods
  if (config.methods) {
    headers['Access-Control-Allow-Methods'] = config.methods.join(', ');
  }

  // Allowed headers
  if (config.allowedHeaders) {
    headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');
  }

  // Exposed headers
  if (config.exposedHeaders) {
    headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ');
  }

  // Max age
  if (config.maxAge !== undefined) {
    headers['Access-Control-Max-Age'] = config.maxAge.toString();
  }

  return headers;
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflight(
  request: NextRequest,
  config: CorsConfig
): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const headers = createCorsHeaders(request, config);
    return new NextResponse(null, { status: 204, headers });
  }
  return null;
}

/**
 * Create default CORS configuration
 */
export function createDefaultCorsConfig(): CorsConfig {
  return {
    origin: '*',
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 86400, // 24 hours
  };
}

/**
 * Create strict CORS configuration (only specific origins)
 */
export function createStrictCorsConfig(allowedOrigins: string[]): CorsConfig {
  return {
    origin: allowedOrigins,
    methods: ['POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
    maxAge: 3600, // 1 hour
  };
}
