# Testing Guide

This package includes a comprehensive test suite to ensure reliability and quality.

## Test Coverage

Current test coverage (**126 tests**, 58.79% overall):
- **Route Handler**: 86.81% - 20 tests (API routes, rate limiting, CORS, hooks)
- **Server Functions**: 100% - 19 tests (sending messages, file attachments, config)
- **Rate Limiter**: 85.41% - 28 tests (sliding window, IP tracking, cleanup)
- **Security Utilities**: 93.87% - 16 tests (IP detection, CORS, headers)
- **Formatter Utilities**: 82.22% - 44 tests (escaping, validation, formatting)

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── handler.test.ts       # Route handler tests (20 tests)
├── send.test.ts          # Server function tests (19 tests)
├── ratelimit.test.ts     # Rate limiting tests (28 tests)
├── security.test.ts      # Security utilities tests (16 tests)
├── formatter.test.ts     # Message formatting tests (44 tests)
└── setup.ts              # Test configuration
```

## What's Tested

### Route Handler (`handler.test.ts`)
- ✅ Basic POST request handling
- ✅ Message validation (required fields)
- ✅ Per-IP rate limiting (20 requests/minute)
- ✅ Global rate limiting (30 requests/second)
- ✅ Rate limit headers in responses
- ✅ CORS preflight handling
- ✅ CORS origin validation
- ✅ Custom rate limit configuration
- ✅ Disabling rate limiting
- ✅ Disabling CORS
- ✅ Lifecycle hooks (onBeforeSend, onAfterSend, onError)
- ✅ File upload handling (base64 to Buffer conversion)
- ✅ Error handling and propagation
- ✅ Combined security features

### Server Functions (`send.test.ts`)
- ✅ Environment variable validation
- ✅ TelegramClient creation with config
- ✅ Sending text messages
- ✅ Parse mode support (HTML, Markdown)
- ✅ Custom chat ID
- ✅ Disable notification option
- ✅ Thread ID support
- ✅ File attachments
- ✅ Multiple files handling
- ✅ Empty files array handling
- ✅ Error propagation
- ✅ Custom client configuration

### Rate Limiter (`ratelimit.test.ts`)
- ✅ Sliding window algorithm
- ✅ Per-IP rate limiting
- ✅ Global rate limiting (Telegram API limits)
- ✅ Automatic cleanup of expired entries
- ✅ Reset functionality
- ✅ Usage tracking
- ✅ Concurrent requests handling
- ✅ Edge cases (empty IPs, short windows)

### Security Utilities (`security.test.ts`)
- ✅ IP detection from various headers
  - x-forwarded-for
  - x-real-ip
  - cf-connecting-ip (Cloudflare)
- ✅ CORS origin validation
  - Wildcard origins
  - Specific origins
  - Multiple origins
- ✅ CORS header generation
- ✅ Preflight request handling
- ✅ Configuration factories

### Formatter Utilities (`formatter.test.ts`)
- ✅ Message timestamp formatting
- ✅ HTML escape for XSS prevention
- ✅ Markdown escape for Telegram
- ✅ File size validation
- ✅ File type validation with wildcards
- ✅ Form data formatting
- ✅ Notification creation
- ✅ Edge cases (Unicode, long messages)

## Test Technologies

- **Jest**: Test framework
- **ts-jest**: TypeScript support
- **@testing-library/react**: React component testing (future)
- **@testing-library/jest-dom**: DOM matchers

## Writing Tests

### Example Test Structure

```typescript
import { describe, it, expect } from '@jest/globals';
import { functionToTest } from '../src/lib/module';

describe('Feature Name', () => {
  describe('functionToTest()', () => {
    it('should handle normal case', () => {
      const result = functionToTest('input');
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      const result = functionToTest('');
      expect(result).toBeDefined();
    });
  });
});
```

### Best Practices

1. **Describe blocks**: Group related tests
2. **Clear test names**: Use "should ..." format
3. **Arrange-Act-Assert**: Structure test logic clearly
4. **Test edge cases**: Empty strings, null, undefined
5. **Mock external dependencies**: Don't hit real APIs
6. **Fast tests**: Keep tests under 50ms when possible

## Coverage Thresholds

The project enforces minimum coverage:
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before package publish (`prepublishOnly`)

## Future Test Coverage

Planned test additions:
- [ ] Route handler integration tests
- [ ] React hook tests (useTelegramNotify)
- [ ] Telegram client tests (mocked)
- [ ] Server function tests
- [ ] End-to-end tests

## Debugging Tests

### Run specific test file
```bash
npm test -- ratelimit.test
```

### Run specific test
```bash
npm test -- -t "should allow requests within limit"
```

### Debug with breakpoints
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Test Utilities

### Mock File Creation
```typescript
function createMockFile(size: number, type = 'text/plain'): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], 'test.txt', { type });
}
```

### Mock Next Request
```typescript
function createMockRequest(headers: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    headers: new Headers(headers),
  });
}
```

## Troubleshooting

### Tests timing out
- Increase timeout for async tests:
```typescript
it('should handle delay', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Module not found errors
- Check tsconfig paths match jest moduleNameMapper
- Ensure all imports use correct paths

### Type errors in tests
- Import types explicitly: `import type { TypeName } from '...'`
- Check that @types packages are installed

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure coverage doesn't drop below 70%
3. Test both happy path and error cases
4. Add edge case tests
5. Update this README if adding new test categories

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Test-Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)
