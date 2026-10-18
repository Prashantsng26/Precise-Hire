import { isBlockedIp, validateResumeUrl, createSafeLookup, parseLooseIpv4, unmapIpv6Address } from '../utils/urlSafety.js';

describe('urlSafety.js', () => {
  describe('isBlockedIp', () => {
    test.each([
      // Loopback
      ['127.0.0.1', true],
      ['127.0.0.2', true],
      ['127.255.255.255', true],
      ['::1', true],

      // Private IPv4 (RFC 1918)
      ['10.0.0.1', true],
      ['10.255.255.255', true],
      ['172.16.0.1', true],
      ['172.31.255.255', true],
      ['192.168.0.1', true],
      ['192.168.1.100', true],

      // Link-local
      ['169.254.169.254', true],
      ['169.254.1.1', true],
      ['fe80::1', true],
      ['fe80::ffff:ffff:ffff:ffff', true],

      // Unique-local IPv6 (fc00::/7)
      ['fc00::1', true],
      ['fd00::1', true],
      ['fdff:ffff::1', true],

      // Unspecified
      ['0.0.0.0', true],
      ['::', true],

      // CGNAT (100.64.0.0/10)
      ['100.64.0.1', true],
      ['100.100.100.100', true],
      ['100.127.255.255', true],

      // Multicast
      ['224.0.0.1', true],
      ['239.255.255.255', true],
      ['ff02::1', true],

      // Reserved / Broadcast
      ['240.0.0.1', true],
      ['255.255.255.255', true],

      // IPv4-mapped IPv6
      ['::ffff:127.0.0.1', true],
      ['::ffff:10.0.0.1', true],
      ['::ffff:169.254.169.254', true],
      ['::ffff:192.168.1.1', true],
      ['::ffff:7f00:1', true], // hex 127.0.0.1
      ['0:0:0:0:0:ffff:127.0.0.1', true],

      // Numeric / loose IPv4 representations
      ['2130706433', true], // 127.0.0.1 in decimal
      ['0x7f.0.0.1', true],  // 127.0.0.1 in hex octet
      ['127.1', true],       // 127.0.0.1 in 2-part shorthand

      // Public / Allowed IPv4
      ['8.8.8.8', false],
      ['8.8.4.4', false],
      ['1.1.1.1', false],
      ['93.184.216.34', false],
      ['172.15.255.255', false], // Outside 172.16.0.0/12
      ['172.32.0.1', false],     // Outside 172.16.0.0/12

      // Public / Allowed IPv6
      ['2606:4700:4700::1111', false],
      ['2001:4860:4860::8888', false],

      // Public IPv4 in IPv4-mapped IPv6 form
      ['::ffff:8.8.8.8', false],
      ['::ffff:1.1.1.1', false],
    ])('isBlockedIp(%s) should return %s', (ip, expected) => {
      expect(isBlockedIp(ip)).toBe(expected);
    });

    test('should return true for empty or non-string inputs', () => {
      expect(isBlockedIp('')).toBe(true);
      expect(isBlockedIp(null)).toBe(true);
      expect(isBlockedIp(undefined)).toBe(true);
      expect(isBlockedIp(123)).toBe(true);
    });
  });

  describe('validateResumeUrl - Blocked URLs', () => {
    const blockedUrls = [
      'file:///etc/passwd',
      'ftp://example.com/a.pdf',
      'http://localhost/x',
      'http://127.0.0.1/x',
      'http://127.1/x',
      'http://0.0.0.0/x',
      'http://[::1]/x',
      'http://169.254.169.254/latest/meta-data/',
      'http://10.0.0.5/x',
      'http://172.16.0.1/x',
      'http://192.168.1.1/x',
      'http://2130706433/x',
      'http://0x7f.0.0.1/x',
      'http://[::ffff:127.0.0.1]/x',
      'http://user:pass@example.com/x',
      'http://foo.internal/x',
      'http://test.local/x',
      'http://sub.localhost/x'
    ];

    test.each(blockedUrls)('should reject blocked URL: %s', (url) => {
      expect(() => validateResumeUrl(url)).toThrow();
    });

    test('should throw an error with a safe generic message without leaking details', () => {
      try {
        validateResumeUrl('http://169.254.169.254/latest/meta-data/');
      } catch (err) {
        expect(err.message).not.toContain('169.254.169.254');
        expect(err.message).toMatch(/Invalid resume URL/i);
      }
    });

    test('should reject invalid or non-string inputs', () => {
      expect(() => validateResumeUrl('')).toThrow();
      expect(() => validateResumeUrl(null)).toThrow();
      expect(() => validateResumeUrl(undefined)).toThrow();
      expect(() => validateResumeUrl(12345)).toThrow();
      expect(() => validateResumeUrl('not a url')).toThrow();
    });
  });

  describe('validateResumeUrl - Allowed URLs', () => {
    const allowedUrls = [
      'https://example.com/resume.pdf',
      'https://drive.google.com/uc?export=download&id=abc',
      'https://www.dropbox.com/s/abc/resume.pdf?dl=1',
      'http://8.8.8.8/cv.pdf',
      'https://cdn.example.org/candidates/doc.docx'
    ];

    test.each(allowedUrls)('should allow safe URL: %s', (url) => {
      const parsed = validateResumeUrl(url);
      expect(parsed).toBeInstanceOf(URL);
      expect(parsed.href).toBe(url);
    });
  });

  describe('createSafeLookup', () => {
    const safeLookup = createSafeLookup();

    test('should reject DNS lookup for loopback/blocked literal IP', (done) => {
      safeLookup('127.0.0.1', {}, (err, address) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/private\/blocked IP address/i);
        expect(address).toBeUndefined();
        done();
      });
    });

    test('should reject DNS lookup for localhost', (done) => {
      safeLookup('localhost', {}, (err, address) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/private\/blocked IP address/i);
        expect(address).toBeUndefined();
        done();
      });
    });

    test('should reject DNS lookup for IPv6 loopback [::1]', (done) => {
      safeLookup('::1', {}, (err, address) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/private\/blocked IP address/i);
        expect(address).toBeUndefined();
        done();
      });
    });

    test('should reject DNS lookup for AWS metadata IP', (done) => {
      safeLookup('169.254.169.254', {}, (err, address) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch(/private\/blocked IP address/i);
        expect(address).toBeUndefined();
        done();
      });
    });

    test('should resolve allowed public literal IP without error', (done) => {
      safeLookup('8.8.8.8', {}, (err, address, family) => {
        expect(err).toBeNull();
        expect(address).toBe('8.8.8.8');
        expect(family).toBe(4);
        done();
      });
    });

    test('should handle options.all = true correctly for allowed IP', (done) => {
      safeLookup('8.8.8.8', { all: true }, (err, addresses) => {
        expect(err).toBeNull();
        expect(Array.isArray(addresses)).toBe(true);
        expect(addresses[0].address).toBe('8.8.8.8');
        done();
      });
    });
  });
});
