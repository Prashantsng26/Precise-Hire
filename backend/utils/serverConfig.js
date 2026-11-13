/**
 * Server deployment and networking configuration helpers.
 */

/**
 * Parses the TRUST_PROXY environment variable.
 * - undefined, null, or empty string -> false
 * - a positive integer string ("1", "2") -> that number
 * - the string "false" -> false
 * - anything else -> false
 * Never returns true to prevent trusting arbitrary client-supplied headers.
 *
 * @param {any} value
 * @returns {number|false}
 */
export function parseTrustProxy(value) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : false;
  }

  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'false') {
    return false;
  }

  if (/^[1-9]\d*$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  return false;
}

/**
 * Parses a comma-separated list of CORS origins.
 * - trims entries and removes empty ones
 * - requires http:// or https:// scheme
 * - strips any trailing slashes
 * - ignores invalid entries
 * - returns defaults if the resulting list is empty
 *
 * @param {any} value - Comma-separated list of origins from env
 * @param {string[]} [defaults=[]] - Fallback array of allowed origins
 * @returns {string[]}
 */
export function parseCorsOrigins(value, defaults = []) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return defaults;
  }

  const rawEntries = value.split(',');
  const origins = [];

  for (const entry of rawEntries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    if (!/^https?:\/\//i.test(trimmed)) continue;

    const clean = trimmed.replace(/\/+$/, '');
    if (!clean) continue;

    try {
      const parsed = new URL(clean);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        continue;
      }
      if (!origins.includes(clean)) {
        origins.push(clean);
      }
    } catch {
      continue;
    }
  }

  return origins.length > 0 ? origins : defaults;
}
