import { isValidEmail } from './uploadValidation.js';

export const VALID_KINDS = Object.freeze(['selected', 'rejected']);

/**
 * Validates whether the kind is in the allowed whitelist ('selected' | 'rejected').
 *
 * @param {any} kind
 * @returns {boolean}
 */
export function isValidKind(kind) {
  if (typeof kind !== 'string') return false;
  return VALID_KINDS.includes(kind.trim().toLowerCase());
}

/**
 * Returns the candidate field name used to track sent timestamp for a given kind.
 *
 * @param {string} kind
 * @returns {string|null}
 */
export function getMarkerField(kind) {
  const norm = String(kind || '').trim().toLowerCase();
  if (norm === 'selected') return 'selectionEmailSentAt';
  if (norm === 'rejected') return 'rejectionEmailSentAt';
  return null;
}

/**
 * Checks whether a candidate belongs to the requested stage.
 * - 'selected': currentRound === 'Selected'
 * - 'rejected': status === 'eliminated' || currentRound === 'Eliminated'
 *
 * @param {object} candidate
 * @param {'selected'|'rejected'} kind
 * @returns {boolean}
 */
export function isCandidateInStage(candidate, kind) {
  if (!candidate || typeof candidate !== 'object') return false;
  const norm = String(kind || '').trim().toLowerCase();
  if (norm === 'selected') {
    return candidate.currentRound === 'Selected';
  }
  if (norm === 'rejected') {
    return candidate.status === 'eliminated' || candidate.currentRound === 'Eliminated';
  }
  return false;
}

/**
 * Categorizes candidates matching the specified kind into:
 * - toSend: valid email, not yet sent
 * - skippedAlreadySent: already has sent marker
 * - skippedInvalid: invalid email, not yet sent
 *
 * Candidates not in the requested stage are omitted.
 *
 * @param {object} params
 * @param {Array} params.candidates
 * @param {'selected'|'rejected'} params.kind
 * @returns {{ toSend: Array, skippedAlreadySent: Array, skippedInvalid: Array }}
 */
export function pickRecipients({ candidates, kind }) {
  if (!isValidKind(kind)) {
    throw new Error(`Invalid email kind: ${kind}`);
  }
  const normKind = kind.trim().toLowerCase();
  const markerField = getMarkerField(normKind);

  const toSend = [];
  const skippedAlreadySent = [];
  const skippedInvalid = [];

  if (!Array.isArray(candidates)) {
    return { toSend, skippedAlreadySent, skippedInvalid };
  }

  for (const c of candidates) {
    if (!isCandidateInStage(c, normKind)) {
      continue;
    }

    if (c && c[markerField]) {
      skippedAlreadySent.push(c);
    } else if (!c || !isValidEmail(c.email)) {
      skippedInvalid.push(c);
    } else {
      toSend.push(c);
    }
  }

  return { toSend, skippedAlreadySent, skippedInvalid };
}

/**
 * Maximum recipients permitted per bulk email call (default 200).
 *
 * @returns {number}
 */
export function getBulkMax() {
  const raw = process.env.EMAIL_BULK_MAX;
  if (raw !== undefined && raw !== null) {
    const trimmed = String(raw).trim();
    if (/^\d+$/.test(trimmed)) {
      const parsed = parseInt(trimmed, 10);
      if (parsed > 0) return parsed;
    }
  }
  return 200;
}

/**
 * Delay between sends in milliseconds (default 1100, minimum 200).
 *
 * @returns {number}
 */
export function getSendDelayMs() {
  const raw = process.env.EMAIL_SEND_DELAY_MS;
  if (raw !== undefined && raw !== null) {
    const trimmed = String(raw).trim();
    if (/^\d+$/.test(trimmed)) {
      const parsed = parseInt(trimmed, 10);
      return Math.max(200, parsed);
    }
  }
  return 1100;
}

/**
 * Returns true if EMAIL_DRY_RUN is enabled.
 *
 * @returns {boolean}
 */
export function isDryRun() {
  const val = process.env.EMAIL_DRY_RUN;
  return typeof val === 'string' && val.trim().toLowerCase() === 'true';
}

/**
 * In-memory bulk email lock per jobId and kind.
 *
 * NOTE: This in-memory Set only works for a single process / replica.
 * A distributed environment would use Redis / SQS locks.
 */
const activeBulkLocks = new Set();

/**
 * Tries to acquire a lock for a given jobId and kind.
 *
 * @param {string} jobId
 * @param {string} kind
 * @returns {boolean}
 */
export function tryAcquireBulkLock(jobId, kind) {
  if (!jobId || typeof jobId !== 'string' || !kind || typeof kind !== 'string') return false;
  const cleanJob = jobId.trim();
  const cleanKind = kind.trim().toLowerCase();
  if (!cleanJob || !cleanKind) return false;

  const key = `${cleanJob}::${cleanKind}`;
  if (activeBulkLocks.has(key)) {
    return false;
  }
  activeBulkLocks.add(key);
  return true;
}

/**
 * Releases the bulk lock for a given jobId and kind.
 *
 * @param {string} jobId
 * @param {string} kind
 */
export function releaseBulkLock(jobId, kind) {
  if (!jobId || typeof jobId !== 'string' || !kind || typeof kind !== 'string') return;
  const cleanJob = jobId.trim();
  const cleanKind = kind.trim().toLowerCase();
  if (!cleanJob || !cleanKind) return;

  const key = `${cleanJob}::${cleanKind}`;
  activeBulkLocks.delete(key);
}
