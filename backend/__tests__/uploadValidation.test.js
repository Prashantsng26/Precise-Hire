import {
  detectFileKind,
  assertAllowedUpload,
  getMaxRows,
  MAX_ROWS,
  normalizeEmail,
  isValidEmail,
  clampField
} from '../utils/uploadValidation.js';

describe('uploadValidation.js', () => {
  describe('detectFileKind', () => {
    test('detects xlsx from real ZIP header bytes (50 4B 03 04)', () => {
      const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
      expect(detectFileKind(zipHeader)).toBe('xlsx');
    });

    test('detects xls from real OLE CFB header bytes (D0 CF 11 E0 A1 B1 1A E1)', () => {
      const oleHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
      expect(detectFileKind(oleHeader)).toBe('xls');
    });

    test('detects csv from plain CSV text without NUL bytes', () => {
      const csvBuf = Buffer.from('Name,Email,Resume\nAlice,alice@example.com,https://example.com/cv.pdf\n', 'utf-8');
      expect(detectFileKind(csvBuf)).toBe('csv');
    });

    test('returns unknown for a buffer with NUL bytes', () => {
      const bufWithNul = Buffer.from('Name,Email\0Invalid', 'utf-8');
      expect(detectFileKind(bufWithNul)).toBe('unknown');
    });

    test('returns unknown for an empty buffer', () => {
      expect(detectFileKind(Buffer.alloc(0))).toBe('unknown');
    });

    test('returns unknown for null, undefined, or non-buffer inputs', () => {
      expect(detectFileKind(null)).toBe('unknown');
      expect(detectFileKind(undefined)).toBe('unknown');
      expect(detectFileKind('not-a-buffer')).toBe('unknown');
    });

    test('returns unknown for binary buffer with NUL bytes like binary PDF', () => {
      const binaryPdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00, 0x14, 0x00]);
      expect(detectFileKind(binaryPdf)).toBe('unknown');
    });

    test('returns unknown for invalid UTF-8 byte sequences', () => {
      const invalidUtf8 = Buffer.from([0xff, 0xfe, 0x00, 0x01]);
      expect(detectFileKind(invalidUtf8)).toBe('unknown');
    });
  });

  describe('assertAllowedUpload', () => {
    test('passes for valid xlsx buffer with .xlsx extension', () => {
      const buf = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
      expect(() => {
        assertAllowedUpload({
          buffer: buf,
          originalName: 'candidates.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }).not.toThrow();
    });

    test('passes for valid xls buffer with .xls extension', () => {
      const buf = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
      expect(() => {
        assertAllowedUpload({
          buffer: buf,
          originalName: 'candidates.xls',
          mimeType: 'application/vnd.ms-excel'
        });
      }).not.toThrow();
    });

    test('rejects .xlsx extension with PDF bytes (%PDF)', () => {
      const pdfBuf = Buffer.from('%PDF-1.4 %something');
      expect(() => {
        assertAllowedUpload({
          buffer: pdfBuf,
          originalName: 'malicious.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }).toThrow(/spreadsheet format/i);
    });

    test('rejects mismatch when xlsx bytes have .xls extension', () => {
      const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      expect(() => {
        assertAllowedUpload({
          buffer: zipHeader,
          originalName: 'wrong_ext.xls',
          mimeType: 'application/vnd.ms-excel'
        });
      }).toThrow(/extension does not match/i);
    });

    test('rejects mismatch when xls bytes have .xlsx extension', () => {
      const oleHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
      expect(() => {
        assertAllowedUpload({
          buffer: oleHeader,
          originalName: 'wrong_ext.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }).toThrow(/extension does not match/i);
    });

    test('rejects CSV files if route only accepts xlsx and xls', () => {
      const csvBuf = Buffer.from('Name,Email\nAlice,a@a.com\n');
      expect(() => {
        assertAllowedUpload({
          buffer: csvBuf,
          originalName: 'candidates.csv',
          mimeType: 'text/csv'
        });
      }).toThrow(/spreadsheet format/i);
    });

    test('rejects empty or null buffer', () => {
      expect(() => {
        assertAllowedUpload({
          buffer: Buffer.alloc(0),
          originalName: 'test.xlsx'
        });
      }).toThrow();

      expect(() => {
        assertAllowedUpload({
          buffer: null,
          originalName: 'test.xlsx'
        });
      }).toThrow();
    });

    test('rejects non-spreadsheet extensions like .exe or .pdf', () => {
      const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      expect(() => {
        assertAllowedUpload({
          buffer: zipHeader,
          originalName: 'payload.exe'
        });
      }).toThrow(/extension does not match/i);
    });
  });

  describe('MAX_ROWS and getMaxRows', () => {
    const originalEnv = process.env.UPLOAD_MAX_ROWS;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.UPLOAD_MAX_ROWS = originalEnv;
      } else {
        delete process.env.UPLOAD_MAX_ROWS;
      }
    });

    test('defaults to 1000 when env var is unset', () => {
      delete process.env.UPLOAD_MAX_ROWS;
      expect(getMaxRows()).toBe(1000);
      expect(MAX_ROWS).toBe(1000);
    });

    test('overrides with valid positive integer from process.env.UPLOAD_MAX_ROWS', () => {
      process.env.UPLOAD_MAX_ROWS = '500';
      expect(getMaxRows()).toBe(500);

      process.env.UPLOAD_MAX_ROWS = ' 250 ';
      expect(getMaxRows()).toBe(250);
    });

    test('falls back to 1000 for invalid env values', () => {
      process.env.UPLOAD_MAX_ROWS = 'invalid';
      expect(getMaxRows()).toBe(1000);

      process.env.UPLOAD_MAX_ROWS = '-50';
      expect(getMaxRows()).toBe(1000);

      process.env.UPLOAD_MAX_ROWS = '0';
      expect(getMaxRows()).toBe(1000);

      process.env.UPLOAD_MAX_ROWS = '1000abc';
      expect(getMaxRows()).toBe(1000);

      process.env.UPLOAD_MAX_ROWS = '';
      expect(getMaxRows()).toBe(1000);
    });
  });

  describe('normalizeEmail and isValidEmail', () => {
    test('normalizeEmail trims and lowercases', () => {
      expect(normalizeEmail('  User.Name@Example.COM  ')).toBe('user.name@example.com');
      expect(normalizeEmail('')).toBe('');
      expect(normalizeEmail(null)).toBe('');
      expect(normalizeEmail(undefined)).toBe('');
    });

    const emailTestTable = [
      { email: 'user@example.com', valid: true, desc: 'standard email' },
      { email: 'first.last+tag@sub.domain.co.uk', valid: true, desc: 'subdomains and tag' },
      { email: 'a@b.cd', valid: true, desc: 'minimal valid' },
      { email: 'user123_test@test-domain.org', valid: true, desc: 'numbers and hyphens' },
      { email: 'plainaddress', valid: false, desc: 'no at sign' },
      { email: '@missinglocal.com', valid: false, desc: 'missing local part' },
      { email: 'missingdomain@', valid: false, desc: 'missing domain' },
      { email: 'missingdot@domain', valid: false, desc: 'missing domain TLD' },
      { email: 'spaces in@example.com', valid: false, desc: 'space in local part' },
      { email: 'user@exam ple.com', valid: false, desc: 'space in domain' },
      { email: 'user@@example.com', valid: false, desc: 'double at sign' },
      { email: '', valid: false, desc: 'empty string' },
      { email: null, valid: false, desc: 'null' },
      { email: undefined, valid: false, desc: 'undefined' },
      { email: 12345, valid: false, desc: 'number' },
      {
        email: 'a'.repeat(243) + '@example.com', // 243 + 12 = 255 chars (> 254 limit)
        valid: false,
        desc: 'exceeds 254 char limit'
      },
      {
        email: 'a'.repeat(242) + '@example.com', // 242 + 12 = 254 chars (exactly 254 limit)
        valid: true,
        desc: 'exactly 254 chars'
      }
    ];

    emailTestTable.forEach(({ email, valid, desc }) => {
      test(`isValidEmail: ${desc} -> ${valid}`, () => {
        expect(isValidEmail(email)).toBe(valid);
      });
    });
  });

  describe('clampField', () => {
    test('trims whitespace', () => {
      expect(clampField('   hello world   ', 50)).toBe('hello world');
    });

    test('truncates strings exceeding max length', () => {
      expect(clampField('abcdefghij', 5)).toBe('abcde');
      expect(clampField('  abcdefghij  ', 5)).toBe('abcde');
    });

    test('keeps string as-is if within max length', () => {
      expect(clampField('short', 10)).toBe('short');
    });

    test('handles null and undefined gracefully', () => {
      expect(clampField(null, 10)).toBe('');
      expect(clampField(undefined, 10)).toBe('');
    });

    test('converts non-string inputs to string before clamping', () => {
      expect(clampField(1234567, 4)).toBe('1234');
    });
  });
});
