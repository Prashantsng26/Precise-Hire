/**
 * Configuration and error categorization helpers for OpenAI-compatible LLM calls.
 */

/**
 * Returns an array [primary, fallback?] read from LLM_PRIMARY_MODEL / LLM_FALLBACK_MODEL,
 * falling back to NVIDIA_PRIMARY_MODEL / NVIDIA_FALLBACK_MODEL.
 * Trimmed, empty/missing fallback omitted, duplicates removed.
 * Throws an Error if primary model is missing or empty.
 *
 * @param {Record<string, string|undefined>} [env=process.env]
 * @returns {string[]}
 */
export function getModelChain(env = process.env) {
  const primary = env?.LLM_PRIMARY_MODEL
    ? String(env.LLM_PRIMARY_MODEL).trim()
    : (env?.NVIDIA_PRIMARY_MODEL ? String(env.NVIDIA_PRIMARY_MODEL).trim() : '');
  if (!primary) {
    if (env?.LLM_PRIMARY_MODEL !== undefined || (env?.LLM_API_KEY && !env?.NVIDIA_PRIMARY_MODEL)) {
      throw new Error('LLM_PRIMARY_MODEL is not set');
    }
    throw new Error('NVIDIA_PRIMARY_MODEL is not set');
  }

  const fallback = env?.LLM_FALLBACK_MODEL
    ? String(env.LLM_FALLBACK_MODEL).trim()
    : (env?.NVIDIA_FALLBACK_MODEL ? String(env.NVIDIA_FALLBACK_MODEL).trim() : '');

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
 * Validates a timeout integer in milliseconds between 5000 and 300000, returning default 90000 on failure.
 *
 * @param {any} raw
 * @returns {number}
 */
function validateTimeout(raw) {
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

/**
 * Returns the configured timeout in milliseconds for LLM per-call requests.
 * Reads LLM_TIMEOUT_MS, else NVIDIA_TIMEOUT_MS, accepts integers between 5000 and 300000, otherwise returns 90000.
 *
 * @param {Record<string, string|number|undefined>} [env=process.env]
 * @returns {number}
 */
export function getTimeoutMs(env = process.env) {
  const raw = (env?.LLM_TIMEOUT_MS !== undefined && env?.LLM_TIMEOUT_MS !== null && String(env.LLM_TIMEOUT_MS).trim() !== '')
    ? env.LLM_TIMEOUT_MS
    : env?.NVIDIA_TIMEOUT_MS;
  return validateTimeout(raw);
}

/**
 * Returns the resolved LLM provider configuration for OpenAI-compatible clients.
 *
 * @param {Record<string, string|number|undefined>} [env=process.env]
 * @returns {{
 *   apiKey: string,
 *   baseURL: string,
 *   models: string[],
 *   timeoutMs: number,
 *   reasoningEffort: 'low'|'medium'|'high'|null
 * }}
 */
export function getLlmConfig(env = process.env) {
  // 1. apiKey
  const llmKey = env?.LLM_API_KEY ? String(env.LLM_API_KEY).trim() : '';
  const nvidiaKey = env?.NVIDIA_API_KEY ? String(env.NVIDIA_API_KEY).trim() : '';
  const apiKey = llmKey || nvidiaKey;
  if (!apiKey) {
    throw new Error('LLM_API_KEY is not set');
  }
  const isNvidiaKey = !llmKey && Boolean(nvidiaKey);

  // 2. baseURL
  const rawBaseUrl = env?.LLM_BASE_URL ? String(env.LLM_BASE_URL).trim() : '';
  let baseURL = '';
  if (rawBaseUrl) {
    baseURL = rawBaseUrl.replace(/\/+$/, '');
    let parsedUrl;
    try {
      parsedUrl = new URL(baseURL);
    } catch {
      throw new Error('Invalid LLM_BASE_URL: must be a valid URL');
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid LLM_BASE_URL: must be http or https');
    }
  } else if (isNvidiaKey) {
    baseURL = 'https://integrate.api.nvidia.com/v1';
  } else {
    throw new Error('LLM_BASE_URL is not set');
  }

  // 3. models
  const models = getModelChain(env);

  // 4. timeoutMs
  const timeoutMs = getTimeoutMs(env);

  // 5. reasoningEffort: 'low' | 'medium' | 'high' if valid, else null
  const rawEffort = env?.LLM_REASONING_EFFORT ? String(env.LLM_REASONING_EFFORT).trim().toLowerCase() : '';
  const reasoningEffort = ['low', 'medium', 'high'].includes(rawEffort) ? rawEffort : null;

  return {
    apiKey,
    baseURL,
    models,
    timeoutMs,
    reasoningEffort
  };
}
