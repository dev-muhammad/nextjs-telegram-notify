# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-11-08

### Added - Initial Release

**Core Features**:
- `useTelegramNotify` hook for client-side notifications
- `sendTelegramNotification` server-side function
- Built-in API route handler with `POST` export
- `createTelegramRoute` for custom route handlers
- `TelegramClient` for advanced use cases

**Security Features**:
- Rate limiting with sliding window algorithm
  - Per-IP rate limiting (default: 20 requests/minute)
  - Global rate limiting respecting Telegram API limits (30 requests/second)
  - Configurable rate limits via `createTelegramRoute`
  - Rate limit headers in responses (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- CORS configuration
  - Origin validation (single or multiple origins)
  - Configurable methods and headers
  - CORS preflight handling
  - Default and strict CORS configurations
- IP detection utilities
  - Support for various proxy headers (X-Forwarded-For, X-Real-IP, CF-Connecting-IP)
  - Cloudflare and proxy compatibility

**Utilities**:
- `RateLimiter` class for custom rate limiting
- `createDefaultRateLimiter`, `createGlobalRateLimiter`, `createStrictRateLimiter` factory functions
- `getClientIp` for IP address detection
- `isOriginAllowed` for CORS validation
- `createCorsHeaders` for CORS header generation
- `handleCorsPreflight` for OPTIONS requests
- `createDefaultCorsConfig` and `createStrictCorsConfig` factory functions
- Message formatting utilities:
  - `formatMessageWithTimestamp`
  - `escapeHtml` and `escapeMarkdown`
  - `validateFileSize` and `validateFileType`
  - `formatFormData`
  - `createNotification`

**Features**:
- ⚡ Lightweight (< 20KB total bundle size)
- 🔒 Secure server-side API integration
- 📝 Full TypeScript support with exported types
- 📎 File attachment support for images and documents
- 🔄 Automatic retry logic with exponential backoff
- 🎨 HTML and Markdown parse modes
- 🎯 Multiple parse modes
- ✨ Easy to use hooks and utilities
- 🛡️ Built-in security with rate limiting and CORS

**Developer Experience**:
- Zero configuration for basic use
- Works with any form library
- Environment variable configuration
- Detailed error messages
- Loading and success states
- Lifecycle hooks (onBeforeSend, onAfterSend, onError)

**Testing Infrastructure**:
- Comprehensive test suite with **126 tests** achieving **58.79% coverage**
- Route Handler Tests (20 tests, 86.81% coverage)
- Server Function Tests (19 tests, 100% coverage)
- Rate Limiter Tests (28 tests, 85.41% coverage)
- Security Tests (16 tests, 93.87% coverage)
- Formatter Tests (44 tests, 82.22% coverage)
- Test Technologies: Jest, ts-jest, @testing-library/react
- Test scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`

**Documentation**:
- Complete README with usage examples
- API reference
- SECURITY.md with comprehensive security guide
- TESTING.md with testing guide
- CONTRIBUTING.md with contribution guidelines
- CODE_OF_CONDUCT.md with community standards
- Example Next.js application with multiple use cases:
  - Contact form
  - Bug report
  - Typo reporter
  - Feedback widget
  - File upload
  - Security test page
