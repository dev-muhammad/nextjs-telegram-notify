import { describe, it, expect } from '@jest/globals';
import {
  formatMessageWithTimestamp,
  escapeHtml,
  escapeMarkdown,
  validateFileSize,
  validateFileType,
  formatFormData,
  createNotification,
} from '../src/lib/formatter';

describe('Formatter Utilities', () => {
  describe('formatMessageWithTimestamp()', () => {
    it('should add timestamp to message', () => {
      const message = 'Test message';
      const formatted = formatMessageWithTimestamp(message);

      expect(formatted).toContain('Test message');
      expect(formatted).toMatch(/\d{1,2}, \d{4}/); // Date format like "Nov 7, 2025"
    });

    it('should handle multiline messages', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      const formatted = formatMessageWithTimestamp(message);

      expect(formatted).toContain('Line 1');
      expect(formatted).toContain('Line 2');
      expect(formatted).toContain('Line 3');
    });

    it('should handle empty message', () => {
      const formatted = formatMessageWithTimestamp('');
      expect(formatted).toMatch(/\d{1,2}, \d{4}/); // Date format like "Nov 7, 2025"
    });
  });

  describe('escapeHtml()', () => {
    it('should escape HTML special characters', () => {
      const text = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(text);

      expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('Say "Hello"')).toBe('Say &quot;Hello&quot;');
    });

    it('should escape angle brackets', () => {
      expect(escapeHtml('5 < 10 > 3')).toBe('5 &lt; 10 &gt; 3');
    });

    it('should handle text without special characters', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('escapeMarkdown()', () => {
    it('should escape Markdown special characters', () => {
      const text = '*Bold* _italic_ `code` [link](url)';
      const escaped = escapeMarkdown(text);

      expect(escaped).toContain('\\*Bold\\*');
      expect(escaped).toContain('\\_italic\\_');
      expect(escaped).toContain('\\`code\\`');
      expect(escaped).toContain('\\[link\\]');
      expect(escaped).toContain('\\(url\\)');
    });

    it('should escape underscores', () => {
      expect(escapeMarkdown('snake_case_variable')).toBe('snake\\_case\\_variable');
    });

    it('should escape asterisks', () => {
      expect(escapeMarkdown('5 * 10 = 50')).toBe('5 \\* 10 \\= 50'); // = is also escaped
    });

    it('should escape backticks', () => {
      expect(escapeMarkdown('Use `console.log()`')).toBe('Use \\`console\\.log\\(\\)\\`'); // . is also escaped
    });

    it('should handle text without special characters', () => {
      expect(escapeMarkdown('Hello World')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(escapeMarkdown('')).toBe('');
    });
  });

  describe('validateFileSize()', () => {
    function createMockFile(size: number, name = 'test.txt', type = 'text/plain'): File {
      const blob = new Blob(['x'.repeat(size)], { type });
      return new File([blob], name, { type });
    }

    it('should accept files within size limit', () => {
      const file = createMockFile(10 * 1024 * 1024); // 10MB
      expect(validateFileSize(file)).toBe(true);
    });

    it('should reject files exceeding default limit (50MB)', () => {
      const file = createMockFile(51 * 1024 * 1024); // 51MB
      expect(validateFileSize(file)).toBe(false);
    });

    it('should accept files at exact limit', () => {
      const file = createMockFile(50 * 1024 * 1024); // 50MB
      expect(validateFileSize(file)).toBe(true);
    });

    it('should respect custom size limit', () => {
      const file = createMockFile(15 * 1024 * 1024); // 15MB
      const limit = 20 * 1024 * 1024; // 20MB

      expect(validateFileSize(file, limit)).toBe(true);
      expect(validateFileSize(file, 10 * 1024 * 1024)).toBe(false);
    });

    it('should accept zero size files', () => {
      const file = createMockFile(0);
      expect(validateFileSize(file)).toBe(true);
    });
  });

  describe('validateFileType()', () => {
    function createMockFile(type: string, name = 'test.txt'): File {
      return new File(['content'], name, { type });
    }

    it('should accept allowed file types', () => {
      const jpegFile = createMockFile('image/jpeg');
      const pngFile = createMockFile('image/png');
      const allowed = ['image/jpeg', 'image/png'];

      expect(validateFileType(jpegFile, allowed)).toBe(true);
      expect(validateFileType(pngFile, allowed)).toBe(true);
    });

    it('should reject disallowed file types', () => {
      const pdfFile = createMockFile('application/pdf');
      const textFile = createMockFile('text/plain');
      const allowed = ['image/jpeg', 'image/png'];

      expect(validateFileType(pdfFile, allowed)).toBe(false);
      expect(validateFileType(textFile, allowed)).toBe(false);
    });

    it('should handle wildcard type patterns', () => {
      const jpegFile = createMockFile('image/jpeg');
      const pngFile = createMockFile('image/png');
      const mp4File = createMockFile('video/mp4');
      const allowed = ['image/*'];

      expect(validateFileType(jpegFile, allowed)).toBe(true);
      expect(validateFileType(pngFile, allowed)).toBe(true);
      expect(validateFileType(mp4File, allowed)).toBe(false);
    });

    it('should handle multiple wildcard patterns', () => {
      const jpegFile = createMockFile('image/jpeg');
      const mp4File = createMockFile('video/mp4');
      const pdfFile = createMockFile('application/pdf');
      const allowed = ['image/*', 'video/*'];

      expect(validateFileType(jpegFile, allowed)).toBe(true);
      expect(validateFileType(mp4File, allowed)).toBe(true);
      expect(validateFileType(pdfFile, allowed)).toBe(false);
    });

    it('should handle empty mime type', () => {
      const file = createMockFile('');
      expect(validateFileType(file, ['image/jpeg'])).toBe(false);
    });

    it('should handle empty allowed types', () => {
      const file = createMockFile('image/jpeg');
      expect(validateFileType(file, [])).toBe(true); // Empty allowed = accept all
    });
  });

  describe('formatFormData()', () => {
    it('should format simple form data', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello',
      };

      const formatted = formatFormData(data);

      expect(formatted).toContain('Name: John Doe');
      expect(formatted).toContain('Email: john@example.com');
      expect(formatted).toContain('Message: Hello');
    });

    it('should NOT escape HTML in values (escaping happens at send time)', () => {
      const data = {
        message: '<script>alert("XSS")</script>',
      };

      const formatted = formatFormData(data);

      // formatFormData doesn't escape - that's done by escapeHtml separately
      expect(formatted).toContain('<script>');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          age: 30,
        },
      };

      const formatted = formatFormData(data);

      expect(formatted).toContain('User: [object Object]'); // Objects are toString'd
    });

    it('should handle arrays', () => {
      const data = {
        tags: ['JavaScript', 'TypeScript', 'React'],
      };

      const formatted = formatFormData(data);

      expect(formatted).toContain('Tags: JavaScript,TypeScript,React');
    });

    it('should handle boolean values', () => {
      const data = {
        subscribed: true,
        notifications: false,
      };

      const formatted = formatFormData(data);

      expect(formatted).toContain('Subscribed: true');
      expect(formatted).toContain('Notifications: false');
    });

    it('should handle number values', () => {
      const data = {
        age: 30,
        score: 95.5,
      };

      const formatted = formatFormData(data);

      expect(formatted).toContain('Age: 30');
      expect(formatted).toContain('Score: 95.5');
    });

    it('should include null and undefined values as strings', () => {
      const data = {
        name: 'John',
        email: null,
        phone: undefined,
      };

      const formatted = formatFormData(data);

      expect(formatted).toContain('Name');
      expect(formatted).toContain('Email: null');
      expect(formatted).toContain('Phone: undefined');
    });

    it('should handle empty object', () => {
      const formatted = formatFormData({});
      expect(formatted).toBe('');
    });

    it('should capitalize field names', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const formatted = formatFormData(data);

      expect(formatted).toContain('First Name:'); // camelCase converted to Title Case
      expect(formatted).toContain('Last Name:');
    });

    it('should include optional title', () => {
      const data = { message: 'Hello' };
      const formatted = formatFormData(data, 'Contact Form');

      expect(formatted).toContain('<b>Contact Form</b>');
      expect(formatted).toContain('Message: Hello');
    });
  });

  describe('createNotification()', () => {
    it('should create notification with title and fields', () => {
      const notification = createNotification({
        title: 'New Message',
        fields: {
          from: 'John Doe',
          message: 'You have a new message',
        },
      });

      expect(notification).toContain('<b>New Message</b>');
      expect(notification).toContain('from: John Doe');
      expect(notification).toContain('message: You have a new message');
    });

    it('should include emoji when provided', () => {
      const notification = createNotification({
        title: 'Error Report',
        emoji: '🚨',
        fields: {
          message: 'An error occurred',
        },
      });

      expect(notification).toContain('🚨 <b>Error Report</b>');
    });

    it('should handle multiple fields', () => {
      const notification = createNotification({
        title: 'Form Submission',
        fields: {
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Hello',
          subscribed: true,
          age: 30,
        },
      });

      expect(notification).toContain('name: John Doe');
      expect(notification).toContain('email: john@example.com');
      expect(notification).toContain('message: Hello');
      expect(notification).toContain('subscribed: true');
      expect(notification).toContain('age: 30');
    });

    it('should handle empty fields', () => {
      const notification = createNotification({
        title: 'Empty',
        fields: {},
      });

      expect(notification).toContain('<b>Empty</b>');
      expect(notification).toMatch(/\d{1,2}, \d{4}/); // Date format like "Nov 7, 2025"
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      const formatted = formatMessageWithTimestamp(longMessage);

      expect(formatted).toContain(longMessage);
      expect(formatted.length).toBeGreaterThan(10000);
    });

    it('should handle special Unicode characters', () => {
      const unicode = '😀 🎉 ⭐ 🚀 ✨';
      expect(escapeHtml(unicode)).toBe(unicode);
      expect(escapeMarkdown(unicode)).toBe(unicode);
    });

    it('should handle mixed content', () => {
      const mixed = 'Text with <html> and *markdown* and 😀';
      expect(escapeHtml(mixed)).toContain('&lt;html&gt;');
      expect(escapeMarkdown(mixed)).toContain('\\*markdown\\*');
    });
  });
});
