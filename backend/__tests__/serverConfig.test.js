import { parseTrustProxy, parseCorsOrigins } from '../utils/serverConfig.js';

describe('serverConfig.js', () => {
  describe('parseTrustProxy', () => {
    test('returns false for undefined, null, or empty string', () => {
      expect(parseTrustProxy(undefined)).toBe(false);
      expect(parseTrustProxy(null)).toBe(false);
      expect(parseTrustProxy('')).toBe(false);
      expect(parseTrustProxy('   ')).toBe(false);
    });

    test('returns integer for positive integer strings', () => {
      expect(parseTrustProxy('1')).toBe(1);
      expect(parseTrustProxy('2')).toBe(2);
      expect(parseTrustProxy('  1  ')).toBe(1);
      expect(parseTrustProxy('10')).toBe(10);
    });

    test('returns false for "0", "-1", and other non-positive numbers', () => {
      expect(parseTrustProxy('0')).toBe(false);
      expect(parseTrustProxy('-1')).toBe(false);
      expect(parseTrustProxy('-2')).toBe(false);
    });

    test('returns false for "false" and "true" (never returns boolean true)', () => {
      expect(parseTrustProxy('false')).toBe(false);
      expect(parseTrustProxy('FALSE')).toBe(false);
      expect(parseTrustProxy('true')).toBe(false);
      expect(parseTrustProxy('TRUE')).toBe(false);
      expect(parseTrustProxy(true)).toBe(false);
      expect(parseTrustProxy(false)).toBe(false);
    });

    test('returns false for non-numeric, decimal, or invalid strings', () => {
      expect(parseTrustProxy('abc')).toBe(false);
      expect(parseTrustProxy('1.5')).toBe(false);
      expect(parseTrustProxy('1a')).toBe(false);
      expect(parseTrustProxy('a1')).toBe(false);
      expect(parseTrustProxy({})).toBe(false);
      expect(parseTrustProxy([])).toBe(false);
    });

    test('handles numeric inputs safely', () => {
      expect(parseTrustProxy(1)).toBe(1);
      expect(parseTrustProxy(2)).toBe(2);
      expect(parseTrustProxy(0)).toBe(false);
      expect(parseTrustProxy(-1)).toBe(false);
    });
  });

  describe('parseCorsOrigins', () => {
    const defaults = [
      'http://localhost:5173',
      'https://precise-hire-tau.vercel.app'
    ];

    test('returns defaults when input is undefined, null, or empty', () => {
      expect(parseCorsOrigins(undefined, defaults)).toEqual(defaults);
      expect(parseCorsOrigins(null, defaults)).toEqual(defaults);
      expect(parseCorsOrigins('', defaults)).toEqual(defaults);
      expect(parseCorsOrigins('   ', defaults)).toEqual(defaults);
    });

    test('parses valid list with surrounding spaces and empty entries', () => {
      const input = ' http://localhost:5173 , , https://app.example.com ';
      expect(parseCorsOrigins(input, defaults)).toEqual([
        'http://localhost:5173',
        'https://app.example.com'
      ]);
    });

    test('strips trailing slashes from valid origins', () => {
      const input = 'https://app.example.com/, http://localhost:5173///';
      expect(parseCorsOrigins(input, defaults)).toEqual([
        'https://app.example.com',
        'http://localhost:5173'
      ]);
    });

    test('ignores invalid entries (non-http/https, malformed URLs)', () => {
      const input = 'http://localhost:5173, not-a-url, ftp://ftp.example.com, https://app.example.com';
      expect(parseCorsOrigins(input, defaults)).toEqual([
        'http://localhost:5173',
        'https://app.example.com'
      ]);
    });

    test('falls back to defaults when all entries in list are invalid', () => {
      const input = 'not-a-url, ftp://ftp.example.com, //missing-scheme, javascript:void(0)';
      expect(parseCorsOrigins(input, defaults)).toEqual(defaults);
    });

    test('deduplicates duplicate origins', () => {
      const input = 'http://localhost:5173, https://app.example.com, http://localhost:5173/';
      expect(parseCorsOrigins(input, defaults)).toEqual([
        'http://localhost:5173',
        'https://app.example.com'
      ]);
    });
  });
});
