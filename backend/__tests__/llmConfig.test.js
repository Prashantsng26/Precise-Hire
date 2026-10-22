import {
  getModelChain,
  isPermanentModelError,
  isAuthError,
  getTimeoutMs
} from '../utils/llmConfig.js';

describe('llmConfig.js', () => {
  describe('getModelChain', () => {
    test('returns array with primary model only when fallback is not provided', () => {
      const env = { NVIDIA_PRIMARY_MODEL: 'meta/llama-3.3-70b-instruct' };
      expect(getModelChain(env)).toEqual(['meta/llama-3.3-70b-instruct']);
    });

    test('returns primary and fallback models when both are provided', () => {
      const env = {
        NVIDIA_PRIMARY_MODEL: 'meta/llama-3.3-70b-instruct',
        NVIDIA_FALLBACK_MODEL: 'mistralai/mistral-large-2-instruct'
      };
      expect(getModelChain(env)).toEqual([
        'meta/llama-3.3-70b-instruct',
        'mistralai/mistral-large-2-instruct'
      ]);
    });

    test('removes duplicate model names if fallback equals primary', () => {
      const env = {
        NVIDIA_PRIMARY_MODEL: 'meta/llama-3.3-70b-instruct',
        NVIDIA_FALLBACK_MODEL: 'meta/llama-3.3-70b-instruct'
      };
      expect(getModelChain(env)).toEqual(['meta/llama-3.3-70b-instruct']);
    });

    test('trims whitespace and ignores empty/whitespace fallback', () => {
      const envWithWhitespace = {
        NVIDIA_PRIMARY_MODEL: '  meta/llama-3.3-70b-instruct  ',
        NVIDIA_FALLBACK_MODEL: '  mistralai/mistral-large-2-instruct  '
      };
      expect(getModelChain(envWithWhitespace)).toEqual([
        'meta/llama-3.3-70b-instruct',
        'mistralai/mistral-large-2-instruct'
      ]);

      const envEmptyFallback = {
        NVIDIA_PRIMARY_MODEL: 'meta/llama-3.3-70b-instruct',
        NVIDIA_FALLBACK_MODEL: '   '
      };
      expect(getModelChain(envEmptyFallback)).toEqual(['meta/llama-3.3-70b-instruct']);
    });

    test('throws Error("NVIDIA_PRIMARY_MODEL is not set") when primary is missing or empty', () => {
      expect(() => getModelChain({})).toThrow('NVIDIA_PRIMARY_MODEL is not set');
      expect(() => getModelChain({ NVIDIA_PRIMARY_MODEL: '' })).toThrow('NVIDIA_PRIMARY_MODEL is not set');
      expect(() => getModelChain({ NVIDIA_PRIMARY_MODEL: '   ' })).toThrow('NVIDIA_PRIMARY_MODEL is not set');
      expect(() => getModelChain(null)).toThrow('NVIDIA_PRIMARY_MODEL is not set');
    });

    test('uses process.env by default', () => {
      const originalPrimary = process.env.NVIDIA_PRIMARY_MODEL;
      const originalFallback = process.env.NVIDIA_FALLBACK_MODEL;
      try {
        process.env.NVIDIA_PRIMARY_MODEL = 'test/primary-model';
        delete process.env.NVIDIA_FALLBACK_MODEL;
        expect(getModelChain()).toEqual(['test/primary-model']);
      } finally {
        if (originalPrimary !== undefined) process.env.NVIDIA_PRIMARY_MODEL = originalPrimary;
        else delete process.env.NVIDIA_PRIMARY_MODEL;
        if (originalFallback !== undefined) process.env.NVIDIA_FALLBACK_MODEL = originalFallback;
        else delete process.env.NVIDIA_FALLBACK_MODEL;
      }
    });
  });

  describe('isPermanentModelError', () => {
    test('returns true for 410 (status and response.status)', () => {
      expect(isPermanentModelError({ status: 410 })).toBe(true);
      expect(isPermanentModelError({ response: { status: 410 } })).toBe(true);
    });

    test('returns true for 404 (status and response.status)', () => {
      expect(isPermanentModelError({ status: 404 })).toBe(true);
      expect(isPermanentModelError({ response: { status: 404 } })).toBe(true);
    });

    test('returns false for 500', () => {
      expect(isPermanentModelError({ status: 500 })).toBe(false);
      expect(isPermanentModelError({ response: { status: 500 } })).toBe(false);
    });

    test('returns false for 429', () => {
      expect(isPermanentModelError({ status: 429 })).toBe(false);
      expect(isPermanentModelError({ response: { status: 429 } })).toBe(false);
    });

    test('returns false for undefined, null, or generic errors', () => {
      expect(isPermanentModelError(undefined)).toBe(false);
      expect(isPermanentModelError(null)).toBe(false);
      expect(isPermanentModelError(new Error('Network disconnected'))).toBe(false);
    });
  });

  describe('isAuthError', () => {
    test('returns true for 401 (status and response.status)', () => {
      expect(isAuthError({ status: 401 })).toBe(true);
      expect(isAuthError({ response: { status: 401 } })).toBe(true);
    });

    test('returns true for 403 (status and response.status)', () => {
      expect(isAuthError({ status: 403 })).toBe(true);
      expect(isAuthError({ response: { status: 403 } })).toBe(true);
    });

    test('returns false for 500', () => {
      expect(isAuthError({ status: 500 })).toBe(false);
      expect(isAuthError({ response: { status: 500 } })).toBe(false);
    });

    test('returns false for 429, 404, or undefined', () => {
      expect(isAuthError({ status: 429 })).toBe(false);
      expect(isAuthError({ status: 404 })).toBe(false);
      expect(isAuthError(undefined)).toBe(false);
      expect(isAuthError(null)).toBe(false);
      expect(isAuthError(new Error('Generic failure'))).toBe(false);
    });
  });

  describe('getTimeoutMs', () => {
    test('returns 90000 when NVIDIA_TIMEOUT_MS is unset or empty', () => {
      expect(getTimeoutMs({})).toBe(90000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: '' })).toBe(90000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: '   ' })).toBe(90000);
      expect(getTimeoutMs(null)).toBe(90000);
      expect(getTimeoutMs(undefined)).toBe(90000);
    });

    test('returns parsed integer when valid value is provided (as number or string)', () => {
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: '60000' })).toBe(60000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: '  45000  ' })).toBe(45000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: 5000 })).toBe(5000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: 300000 })).toBe(300000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: '5000' })).toBe(5000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: '300000' })).toBe(300000);
    });

    test('returns 90000 when value is too small (< 5000)', () => {
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: '4999' })).toBe(90000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: 1000 })).toBe(90000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: 0 })).toBe(90000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: -5000 })).toBe(90000);
    });

    test('returns 90000 when value is too large (> 300000)', () => {
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: '300001' })).toBe(90000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: 500000 })).toBe(90000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: 1000000 })).toBe(90000);
    });

    test('returns 90000 when value is non-numeric or invalid', () => {
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: 'abc' })).toBe(90000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: '60s' })).toBe(90000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: 'true' })).toBe(90000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: NaN })).toBe(90000);
      expect(getTimeoutMs({ NVIDIA_TIMEOUT_MS: 12.34 })).toBe(90000);
    });

    test('uses process.env by default', () => {
      const originalTimeout = process.env.NVIDIA_TIMEOUT_MS;
      try {
        process.env.NVIDIA_TIMEOUT_MS = '75000';
        expect(getTimeoutMs()).toBe(75000);
      } finally {
        if (originalTimeout !== undefined) {
          process.env.NVIDIA_TIMEOUT_MS = originalTimeout;
        } else {
          delete process.env.NVIDIA_TIMEOUT_MS;
        }
      }
    });
  });
});
