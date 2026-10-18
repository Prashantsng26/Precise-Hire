import net from 'node:net';
import dns from 'node:dns';

// Configure blocked IP ranges using net.BlockList
const blockList = new net.BlockList();

// IPv4 Blocks
// 0.0.0.0/8 - Unspecified / current network (RFC 1122)
blockList.addSubnet('0.0.0.0', 8, 'ipv4');
// 10.0.0.0/8 - Private-Use (RFC 1918)
blockList.addSubnet('10.0.0.0', 8, 'ipv4');
// 100.64.0.0/10 - Shared Address Space / CGNAT (RFC 6598)
blockList.addSubnet('100.64.0.0', 10, 'ipv4');
// 127.0.0.0/8 - Loopback (RFC 1122)
blockList.addSubnet('127.0.0.0', 8, 'ipv4');
// 169.254.0.0/16 - Link Local (RFC 3927)
blockList.addSubnet('169.254.0.0', 16, 'ipv4');
// 172.16.0.0/12 - Private-Use (RFC 1918)
blockList.addSubnet('172.16.0.0', 12, 'ipv4');
// 192.0.0.0/24 - IETF Protocol Assignments (RFC 6890)
blockList.addSubnet('192.0.0.0', 24, 'ipv4');
// 192.0.2.0/24 - Documentation (TEST-NET-1, RFC 5737)
blockList.addSubnet('192.0.2.0', 24, 'ipv4');
// 192.168.0.0/16 - Private-Use (RFC 1918)
blockList.addSubnet('192.168.0.0', 16, 'ipv4');
// 198.18.0.0/15 - Benchmarking (RFC 2544)
blockList.addSubnet('198.18.0.0', 15, 'ipv4');
// 198.51.100.0/24 - Documentation (TEST-NET-2, RFC 5737)
blockList.addSubnet('198.51.100.0', 24, 'ipv4');
// 203.0.113.0/24 - Documentation (TEST-NET-3, RFC 5737)
blockList.addSubnet('203.0.113.0', 24, 'ipv4');
// 224.0.0.0/4 - Multicast (RFC 5771)
blockList.addSubnet('224.0.0.0', 4, 'ipv4');
// 240.0.0.0/4 - Reserved / Former Class E (RFC 1112)
blockList.addSubnet('240.0.0.0', 4, 'ipv4');
// 255.255.255.255/32 - Limited Broadcast (RFC 919)
blockList.addAddress('255.255.255.255', 'ipv4');

// IPv6 Blocks
// ::/128 - Unspecified (RFC 4291)
blockList.addAddress('::', 'ipv6');
// ::1/128 - Loopback (RFC 4291)
blockList.addAddress('::1', 'ipv6');
// fc00::/7 - Unique Local Addresses (ULA) (RFC 4193, covers fc00::/8 and fd00::/8)
blockList.addSubnet('fc00::', 7, 'ipv6');
blockList.addSubnet('fd00::', 8, 'ipv6');
// fe80::/10 - Link-Local Unicast (RFC 4291)
blockList.addSubnet('fe80::', 10, 'ipv6');
// fec0::/10 - Deprecated Site-Local (RFC 3879)
blockList.addSubnet('fec0::', 10, 'ipv6');
// ff00::/8 - Multicast (RFC 4291)
blockList.addSubnet('ff00::', 8, 'ipv6');
// 2001:db8::/32 - Documentation (RFC 3849)
blockList.addSubnet('2001:db8::', 32, 'ipv6');
// 100::/64 - Discard prefix (RFC 6666)
blockList.addSubnet('100::', 64, 'ipv6');

/**
 * Extracts and unmaps IPv4 from IPv4-mapped or IPv4-compatible IPv6 addresses.
 * Supports:
 * - ::ffff:127.0.0.1
 * - 0:0:0:0:0:ffff:127.0.0.1
 * - ::ffff:7f00:1 (hex)
 * - ::127.0.0.1 (IPv4-compatible)
 *
 * @param {string} ip
 * @returns {string|null} Unmapped dotted-decimal IPv4 address or null
 */
export function unmapIpv6Address(ip) {
  if (typeof ip !== 'string') return null;
  const trimmed = ip.trim().replace(/^\[|\]$/g, '');

  // Dotted IPv4-mapped: ::ffff:127.0.0.1 or 0:0:0:0:0:ffff:127.0.0.1
  const dottedMatch = trimmed.match(/^(?:::ffff:|0:0:0:0:0:ffff:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (dottedMatch) {
    return dottedMatch[1];
  }

  // Dotted IPv4-compatible: ::127.0.0.1 or 0:0:0:0:0:0:127.0.0.1
  const compatMatch = trimmed.match(/^(?:::|0:0:0:0:0:0:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (compatMatch) {
    return compatMatch[1];
  }

  // Hex IPv4-mapped: ::ffff:7f00:1 or 0:0:0:0:0:ffff:7f00:0001
  const hexMatch = trimmed.match(/^(?:::ffff:|0:0:0:0:0:ffff:)([0-9a-fA-F]{1,4}):([0-9a-fA-F]{1,4})$/i);
  if (hexMatch) {
    const high = parseInt(hexMatch[1], 16);
    const low = parseInt(hexMatch[2], 16);
    if (!isNaN(high) && !isNaN(low)) {
      const b1 = (high >> 8) & 0xff;
      const b2 = high & 0xff;
      const b3 = (low >> 8) & 0xff;
      const b4 = low & 0xff;
      return `${b1}.${b2}.${b3}.${b4}`;
    }
  }

  return null;
}

/**
 * Parses loose/alternative IPv4 notations (inet_aton style):
 * - Standard dotted decimal (127.0.0.1)
 * - Hexadecimal octets (0x7f.0.0.1)
 * - Octal octets (0177.0.0.1)
 * - Shorthand 2/3 parts (127.1 -> 127.0.0.1)
 * - Single 32-bit integer (2130706433 or 0x7f000001)
 *
 * @param {string} str
 * @returns {string|null} Standard dotted-decimal IPv4 string or null
 */
export function parseLooseIpv4(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();

  // Must only contain digits, hex characters, x/X, and dots
  if (!/^[0-9a-fA-FxX.]+$/.test(trimmed)) {
    return null;
  }

  const parts = trimmed.split('.');
  if (parts.length > 4 || parts.length === 0) return null;

  const numbers = [];
  for (const part of parts) {
    if (!part) return null;
    let n;
    if (/^0x[0-9a-fA-F]+$/i.test(part)) {
      n = parseInt(part, 16);
    } else if (/^0[0-7]+$/.test(part)) {
      n = parseInt(part, 8);
    } else if (/^\d+$/.test(part)) {
      n = parseInt(part, 10);
    } else {
      return null;
    }
    if (isNaN(n) || n < 0) return null;
    numbers.push(n);
  }

  let ipNum;
  if (numbers.length === 1) {
    ipNum = numbers[0];
    if (ipNum > 0xffffffff) return null;
  } else if (numbers.length === 2) {
    if (numbers[0] > 0xff || numbers[1] > 0xffffff) return null;
    ipNum = (numbers[0] << 24) + numbers[1];
  } else if (numbers.length === 3) {
    if (numbers[0] > 0xff || numbers[1] > 0xff || numbers[2] > 0xffff) return null;
    ipNum = (numbers[0] << 24) + (numbers[1] << 16) + numbers[2];
  } else if (numbers.length === 4) {
    if (numbers.some(n => n > 0xff)) return null;
    ipNum = (numbers[0] << 24) + (numbers[1] << 16) + (numbers[2] << 8) + numbers[3];
  } else {
    return null;
  }

  ipNum = ipNum >>> 0;
  const b1 = (ipNum >>> 24) & 255;
  const b2 = (ipNum >>> 16) & 255;
  const b3 = (ipNum >>> 8) & 255;
  const b4 = ipNum & 255;

  return `${b1}.${b2}.${b3}.${b4}`;
}

/**
 * Checks whether an IP address is in a private, loopback, link-local,
 * multicast, CGNAT, unspecified, or reserved range.
 * Supports IPv4, IPv6, loose IPv4 literals, and IPv4-mapped IPv6.
 *
 * @param {string} ip
 * @returns {boolean} True if the IP is blocked/private/invalid, false if public
 */
export function isBlockedIp(ip) {
  if (!ip || typeof ip !== 'string') {
    return true;
  }

  let clean = ip.trim().replace(/^\[|\]$/g, '');

  // 1. Check for IPv4-mapped IPv6 forms
  const unmapped = unmapIpv6Address(clean);
  if (unmapped) {
    clean = unmapped;
  }

  // 2. Try parsing loose/numeric IPv4 (covers decimal 2130706433, hex 0x7f.0.0.1, octal, shorthand 127.1)
  const looseIpv4 = parseLooseIpv4(clean);
  if (looseIpv4) {
    return blockList.check(looseIpv4, 'ipv4');
  }

  // 3. Check standard IPv6
  if (net.isIPv6(clean)) {
    return blockList.check(clean, 'ipv6');
  }

  // 4. Check standard IPv4
  if (net.isIPv4(clean)) {
    return blockList.check(clean, 'ipv4');
  }

  // Default to blocked if not a recognized valid IP format
  return true;
}

/**
 * Validates a resume URL for safety before making an outbound request.
 * - Parses with new URL()
 * - Rejects non-http/https schemes
 * - Rejects URLs with embedded credentials (user:pass@)
 * - Rejects hostnames "localhost", anything ending in ".localhost", ".internal", ".local"
 * - Rejects literal IPs that fall within blocked IP ranges (including decimal/hex/octal forms)
 *
 * @param {string} urlString
 * @returns {URL} Parsed URL object if valid and safe
 * @throws {Error} Generic safe error message if URL is blocked or invalid
 */
export function validateResumeUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    throw new Error('Invalid resume URL: URL must be a non-empty string');
  }

  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error('Invalid resume URL: malformed URL');
  }

  // 1. Reject non-http/https schemes
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Invalid resume URL: only HTTP and HTTPS schemes are supported');
  }

  // 2. Reject embedded credentials (user:pass@)
  if (parsed.username || parsed.password) {
    throw new Error('Invalid resume URL: embedded credentials are not allowed');
  }

  // 3. Reject forbidden hostnames
  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    throw new Error('Invalid resume URL: missing hostname');
  }

  if (
    hostname === 'localhost' ||
    hostname === 'internal' ||
    hostname === 'local' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local')
  ) {
    throw new Error('Invalid resume URL: blocked host');
  }

  // 4. Check if hostname is a literal IP and validate against blocked ranges
  const unbracketedHost = hostname.replace(/^\[|\]$/g, '');
  const unmapped = unmapIpv6Address(unbracketedHost);
  const looseIpv4 = parseLooseIpv4(unbracketedHost);

  if (net.isIP(unbracketedHost) || unmapped || looseIpv4) {
    if (isBlockedIp(unbracketedHost)) {
      throw new Error('Invalid resume URL: blocked host');
    }
  }

  return parsed;
}

/**
 * Creates a safe lookup function usable as the `lookup` option for http/https Agent.
 * Resolves the hostname with dns.lookup (all: true), and if ANY resolved address isBlockedIp,
 * fails with an error; otherwise returns an allowed address.
 * Prevents DNS-rebinding attacks and domains resolving to internal IP addresses.
 *
 * @returns {Function} Custom lookup function (hostname, options, callback)
 */
export function createSafeLookup() {
  return function safeLookup(hostname, options, callback) {
    let opts = options;
    let cb = callback;

    if (typeof opts === 'function') {
      cb = opts;
      opts = {};
    }

    if (!hostname || typeof hostname !== 'string') {
      return cb(new Error('Invalid hostname for DNS lookup'));
    }

    const cleanHost = hostname.replace(/^\[|\]$/g, '');

    dns.lookup(cleanHost, { all: true }, (err, addresses) => {
      if (err) {
        return cb(err);
      }

      if (!addresses || addresses.length === 0) {
        return cb(new Error('DNS lookup returned no addresses'));
      }

      // If ANY resolved address is blocked, abort request
      for (const entry of addresses) {
        const addr = typeof entry === 'string' ? entry : entry.address;
        if (isBlockedIp(addr)) {
          return cb(new Error('Access to private/blocked IP address is denied'));
        }
      }

      if (opts && opts.all) {
        return cb(null, addresses);
      }

      let selected = addresses[0];
      if (opts && opts.family) {
        const match = addresses.find(a => a.family === opts.family);
        if (match) selected = match;
      }

      return cb(null, selected.address, selected.family);
    });
  };
}
