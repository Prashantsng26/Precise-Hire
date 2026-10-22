/**
 * Utilities for LLM input sanitization, prompt injection defense, and score clamping.
 */

// Exported array of injection patterns so it can be inspected and tuned
export const INJECTION_PATTERNS = [
  /ignore\s+(?:(?:all|any|the)\s+)?(?:previous|prior|above)\s+instructions/i,
  /disregard\s+.*?instructions/i,
  // Tightened system prompt patterns to detect overrides and impersonations
  // without flagging legitimate resume descriptions like "Built a system prompt library"
  /(?:ignore|disregard|forget|override|bypass|reveal|leak|print|show)\s+(?:the\s+)?system\s+prompt/i,
  /(?:^|[\r\n.?!;\[<#])\s*(?:###\s*)?(?:\[\s*)?system\s+prompt(?:\s*\])?\s*[:=]/i,
  /system\s+prompt\s+override/i,
  /you\s+are\s+now\b/i,
  /give\s+(?:this\s+candidate|me)\s+(?:a\s+)?(?:score|rating)\s+of/i,
  /set\s+(?:the\s+)?\w*score/i,
  /score\s*[:=]\s*\d{3,}/i
];

/**
 * Sanitizes untrusted resume or job description text.
 * - Coerces to string
 * - Removes NUL and ASCII control characters except \n and \t
 * - Neutralizes delimiter tags (<resume>, </resume>, <job_description>, </job_description>)
 * - Collapses runs of 3+ newlines to 2 newlines
 *
 * @param {any} text
 * @returns {string}
 */
export function sanitizeResumeText(text) {
  if (text === null || text === undefined) return '';
  let str = String(text);

  // Normalize line endings to \n
  str = str.replace(/\r\n|\r/g, '\n');

  // Strip control chars (0x00-0x1F, 0x7F) excluding \t (0x09) and \n (0x0A)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Neutralize delimiter tags case-insensitively
  str = str.replace(/<\/?(?:resume|job_description)\b[^>]*>/gi, '[removed]');

  // Collapse runs of 3 or more newlines
  str = str.replace(/\n{3,}/g, '\n\n');

  return str.trim();
}

/**
 * Wraps untrusted text inside delimiter tags after sanitization.
 *
 * @param {string} tag - Tag name (e.g. 'resume' or 'job_description')
 * @param {string} text - Raw untrusted text
 * @returns {string} `<${tag}>\n${sanitized text}\n</${tag}>`
 */
export function wrapUntrusted(tag, text) {
  const sanitized = sanitizeResumeText(text);
  return `<${tag}>\n${sanitized}\n</${tag}>`;
}

/**
 * Checks if the text matches any known prompt-injection attempt patterns.
 *
 * @param {string} text
 * @returns {boolean} True if an injection attempt is detected
 */
export function detectInjectionAttempt(text) {
  if (!text || typeof text !== 'string') return false;
  return INJECTION_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Coerces a value to a numeric score, clamps it within [min, max],
 * and rounds it to 1 decimal place.
 * NaN, null, undefined, or invalid strings fall back to min.
 *
 * @param {any} value
 * @param {number} [min=0]
 * @param {number} [max=100]
 * @returns {number}
 */
export function clampScore(value, min = 0, max = 100) {
  if (value === null || value === undefined || value === '') {
    return min;
  }
  const num = Number(value);
  if (isNaN(num)) {
    return min;
  }
  const clamped = Math.max(min, Math.min(max, num));
  return Math.round(clamped * 10) / 10;
}
