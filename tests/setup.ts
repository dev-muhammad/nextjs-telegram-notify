// Test setup file
import '@testing-library/jest-dom';

// Mock environment variables
process.env.TELEGRAM_BOT_TOKEN = 'test_bot_token_12345';
process.env.TELEGRAM_CHAT_ID = '12345678';

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(), // Mock console.error to avoid cluttering test output
  warn: jest.fn(),
};
