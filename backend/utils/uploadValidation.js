import path from 'node:path';

/**
 * Returns the maximum allowed rows per upload, default 1000.
 * Safely parses process.env.UPLOAD_MAX_ROWS and falls back to 1000 for invalid/missing values.
 *
 * @returns {number}
 */
export function getMaxRows() {
  const raw = process.env.UPLOAD_MAX_ROWS;
  if (raw !== undefined && raw !== null) {
    const trimmed = String(raw).trim();
    if (/^\d+$/.test(trimmed)) {
      const parsed = parseInt(trimmed, 10);
      if (parsed > 0) {
        return parsed;
      }
    }
  }
  return 1000;
}

export const MAX_ROWS = getMaxRows();

/**
 * Detects the kind of spreadsheet file from its raw buffer header bytes.
 * - 'xlsx': first 4 bytes are 50 4B 03 04 (ZIP signature)
 * - 'xls': first 8 bytes are D0 CF 11 E0 A1 B1 1A E1 (OLE CFB signature)
 * - 'csv': first 4096 bytes contain no NUL (0x00) bytes and decode as valid UTF-8
 * - else: 'unknown'
 *
 * @param {Buffer} buffer
 * @returns {'xlsx'|'xls'|'csv'|'unknown'}
 */
export function detectFileKind(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return 'unknown';
  }

  // 1. Check XLSX (ZIP archive: 50 4B 03 04)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return 'xlsx';
  }

  // 2. Check XLS (Compound File Binary / OLE: D0 CF 11 E0 A1 B1 1A E1)
  if (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  ) {
    return 'xls';
  }

  // 3. Check CSV: first 4096 bytes must have no NUL bytes and be valid UTF-8
  const sampleSize = Math.min(buffer.length, 4096);
  const sample = buffer.subarray(0, sampleSize);

  if (sample.includes(0x00)) {
    return 'unknown';
  }

  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(sample);
    return 'csv';
  } catch {
    return 'unknown';
  }
}

/**
 * Asserts that an uploaded file is allowed and its extension matches its magic bytes.
 * Throws a safe generic Error if invalid.
 *
 * @param {Object} params
 * @param {Buffer} params.buffer
 * @param {string} params.originalName
 * @param {string} [params.mimeType]
 * @param {string[]} [allowedKinds=['xlsx', 'xls']]
 * @returns {{ kind: string, extension: string }}
 * @throws {Error}
 */
export function assertAllowedUpload(
  { buffer, originalName, mimeType },
  allowedKinds = ['xlsx', 'xls']
) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Upload validation failed: empty or invalid file buffer');
  }

  const kind = detectFileKind(buffer);
  if (!allowedKinds.includes(kind)) {
    throw new Error('Upload validation failed: file content is not an accepted spreadsheet format');
  }

  const ext = path.extname(originalName || '').toLowerCase();

  const validExtensions = {
    xlsx: ['.xlsx'],
    xls: ['.xls'],
    csv: ['.csv']
  };

  const expectedExts = validExtensions[kind] || [];
  if (!expectedExts.includes(ext)) {
    throw new Error('Upload validation failed: file extension does not match detected format');
  }

  return { kind, extension: ext };
}

/**
 * Trims and lowercases an email string. Returns empty string for invalid inputs.
 *
 * @param {string} s
 * @returns {string}
 */
export function normalizeEmail(s) {
  if (typeof s !== 'string') return '';
  return s.trim().toLowerCase();
}

// RFC-lite email validation pattern (max 254 chars, valid local part and domain with TLD)
const RFC_LITE_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates that an email is RFC-lite compliant and at most 254 characters.
 *
 * @param {string} s
 * @returns {boolean}
 */
export function isValidEmail(s) {
  if (typeof s !== 'string') return false;
  const trimmed = s.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  return RFC_LITE_EMAIL_REGEX.test(trimmed);
}

/**
 * Trims and clamps a string to a maximum character length.
 *
 * @param {any} s
 * @param {number} max
 * @returns {string}
 */
export function clampField(s, max) {
  if (s === null || s === undefined) return '';
  const trimmed = String(s).trim();
  if (typeof max === 'number' && max >= 0 && trimmed.length > max) {
    return trimmed.slice(0, max);
  }
  return trimmed;
}
