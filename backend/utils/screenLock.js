/**
 * In-memory screening lock per jobId.
 *
 * NOTE: This in-memory Set only works for a single process / replica.
 * Phase 5 will replace this mechanism with a real distributed queue/lock (e.g. Redis / SQS).
 */

const activeLocks = new Set();

/**
 * Attempts to acquire an exclusive lock for screening a given jobId.
 * Returns true if the lock was successfully acquired, false if already locked.
 *
 * @param {string} jobId
 * @returns {boolean}
 */
export function tryAcquire(jobId) {
  if (!jobId || typeof jobId !== 'string') return false;
  const key = jobId.trim();
  if (!key) return false;
  if (activeLocks.has(key)) {
    return false;
  }
  activeLocks.add(key);
  return true;
}

/**
 * Releases the screening lock for the given jobId.
 *
 * @param {string} jobId
 */
export function release(jobId) {
  if (!jobId || typeof jobId !== 'string') return;
  const key = jobId.trim();
  if (!key) return;
  activeLocks.delete(key);
}
