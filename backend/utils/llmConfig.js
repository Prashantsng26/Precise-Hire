/**
 * Configuration and error categorization helpers for NVIDIA LLM calls.
 */

/**
 * Returns an array [primary, fallback?] read from NVIDIA_PRIMARY_MODEL and NVIDIA_FALLBACK_MODEL.
 * Trimmed, empty/missing fallback omitted, duplicates removed.
 * Throws an Error if NVIDIA_PRIMARY_MODEL is missing or empty.
 *
 * @param {Record<string, string|undefined>} [env=process.env]
 * @returns {string[]}
 */
export function getModelChain(env = process.env) {
  const primary = env?.NVIDIA_PRIMARY_MODEL ? String(env.NVIDIA_PRIMARY_MODEL).trim() : '';
  if (!primary) {
    throw new Error('NVIDIA_PRIMARY_MODEL is not set');
  }

  const fallback = env?.NVIDIA_FALLBACK_MODEL ? String(env.NVIDIA_FALLBACK_MODEL).trim() : '';

  if (fallback && fallback !== primary) {
    return [primary, fallback];
  }

  return [primary];
}

/**
 * Extracts numeric HTTP status from an error object (from error.status or error.response.status).
 *
 * @param {any} error
 * @returns {number|undefined}
 */
function getErrorStatus(error) {
  if (!error || typeof error !== 'object') return undefined;
  const status = error.status ?? error.response?.status;
  if (status !== undefined && status !== null && !isNaN(Number(status))) {
    return Number(status);
  }
  return undefined;
}

/**
 * Returns true if error status indicates a permanently missing/dead model (404 or 410).
 *
 * @param {any} error
 * @returns {boolean}
 */
export function isPermanentModelError(error) {
  const status = getErrorStatus(error);
  return status === 404 || status === 410;
}

/**
 * Returns true if error status indicates an authentication/authorization failure (401 or 403).
 *
 * @param {any} error
 * @returns {boolean}
 */
export function isAuthError(error) {
  const status = getErrorStatus(error);
  return status === 401 || status === 403;
}

/**
 * Returns the configured timeout in milliseconds for NVIDIA per-call requests.
 * Reads NVIDIA_TIMEOUT_MS, accepts integers between 5000 and 300000, otherwise returns 90000.
 *
 * @param {Record<string, string|number|undefined>} [env=process.env]
 * @returns {number}
 */
export function getTimeoutMs(env = process.env) {
  const raw = env?.NVIDIA_TIMEOUT_MS;
  if (raw !== undefined && raw !== null) {
    if (typeof raw === 'number' && Number.isInteger(raw)) {
      if (raw >= 5000 && raw <= 300000) {
        return raw;
      }
    } else if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (/^\d+$/.test(trimmed)) {
        const parsed = parseInt(trimmed, 10);
        if (parsed >= 5000 && parsed <= 300000) {
          return parsed;
        }
      }
    }
  }
  return 90000;
}
