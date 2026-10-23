import { jest } from '@jest/globals';
import {
  isValidKind,
  getMarkerField,
  isCandidateInStage,
  pickRecipients,
  getBulkMax,
  getSendDelayMs,
  isDryRun,
  tryAcquireBulkLock,
  releaseBulkLock
} from '../utils/bulkEmail.js';
import { getWorkingRounds, buildDisplayRounds } from '../routes/pipeline.js';

describe('bulkEmail.js', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EMAIL_BULK_MAX;
    delete process.env.EMAIL_SEND_DELAY_MS;
    delete process.env.EMAIL_DRY_RUN;
    releaseBulkLock('job-1', 'selected');
    releaseBulkLock('job-1', 'rejected');
    releaseBulkLock('job-2', 'selected');
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isValidKind and getMarkerField', () => {
    test('whitelists "selected" and "rejected" only', () => {
      expect(isValidKind('selected')).toBe(true);
      expect(isValidKind('SELECTED')).toBe(true);
      expect(isValidKind('rejected')).toBe(true);
      expect(isValidKind('REJECTED')).toBe(true);

      expect(isValidKind('interview')).toBe(false);
      expect(isValidKind('offer')).toBe(false);
      expect(isValidKind('')).toBe(false);
      expect(isValidKind(null)).toBe(false);
      expect(isValidKind(undefined)).toBe(false);
    });

    test('returns correct marker field per kind', () => {
      expect(getMarkerField('selected')).toBe('selectionEmailSentAt');
      expect(getMarkerField('rejected')).toBe('rejectionEmailSentAt');
      expect(getMarkerField('unknown')).toBeNull();
    });
  });

  describe('isCandidateInStage', () => {
    test('identifies selected candidates by currentRound === "Selected"', () => {
      expect(isCandidateInStage({ currentRound: 'Selected', status: 'passed' }, 'selected')).toBe(true);
      expect(isCandidateInStage({ currentRound: 'ATS', status: 'in_pipeline' }, 'selected')).toBe(false);
      expect(isCandidateInStage({ currentRound: 'Offer' }, 'selected')).toBe(false);
    });

    test('identifies rejected candidates by status === "eliminated" or currentRound === "Eliminated"', () => {
      expect(isCandidateInStage({ currentRound: 'Eliminated', status: 'eliminated' }, 'rejected')).toBe(true);
      expect(isCandidateInStage({ currentRound: 'ATS', status: 'eliminated' }, 'rejected')).toBe(true);
      expect(isCandidateInStage({ currentRound: 'Eliminated', status: 'in_pipeline' }, 'rejected')).toBe(true);
      expect(isCandidateInStage({ currentRound: 'Selected', status: 'passed' }, 'rejected')).toBe(false);
      expect(isCandidateInStage({ currentRound: 'Technical', status: 'in_pipeline' }, 'rejected')).toBe(false);
    });
  });

  describe('pickRecipients', () => {
    const candidates = [
      {
        candidateId: 'c1',
        name: 'Alice',
        email: 'alice@company.com',
        currentRound: 'Selected',
        status: 'passed'
      },
      {
        candidateId: 'c2',
        name: 'Bob',
        email: 'bob@company.com',
        currentRound: 'Selected',
        status: 'passed',
        selectionEmailSentAt: '2026-10-01T12:00:00.000Z'
      },
      {
        candidateId: 'c3',
        name: 'Charlie',
        email: 'not-an-email',
        currentRound: 'Selected',
        status: 'passed'
      },
      {
        candidateId: 'c4',
        name: 'Diana',
        email: 'diana@company.com',
        currentRound: 'Interview',
        status: 'in_pipeline'
      },
      {
        candidateId: 'c5',
        name: 'Edward',
        email: 'edward@company.com',
        currentRound: 'Eliminated',
        status: 'eliminated'
      },
      {
        candidateId: 'c6',
        name: 'Fiona',
        email: 'fiona@company.com',
        currentRound: 'Eliminated',
        status: 'eliminated',
        rejectionEmailSentAt: '2026-10-01T14:00:00.000Z'
      },
      {
        candidateId: 'c7',
        name: 'George',
        email: 'invalid-email',
        currentRound: 'Eliminated',
        status: 'eliminated'
      }
    ];

    test('correctly partitions recipients for selected kind', () => {
      const result = pickRecipients({ candidates, kind: 'selected' });
      expect(result.toSend.map(c => c.candidateId)).toEqual(['c1']);
      expect(result.skippedAlreadySent.map(c => c.candidateId)).toEqual(['c2']);
      expect(result.skippedInvalid.map(c => c.candidateId)).toEqual(['c3']);
    });

    test('correctly partitions recipients for rejected kind', () => {
      const result = pickRecipients({ candidates, kind: 'rejected' });
      expect(result.toSend.map(c => c.candidateId)).toEqual(['c5']);
      expect(result.skippedAlreadySent.map(c => c.candidateId)).toEqual(['c6']);
      expect(result.skippedInvalid.map(c => c.candidateId)).toEqual(['c7']);
    });

    test('throws when kind is not valid', () => {
      expect(() => pickRecipients({ candidates, kind: 'offer' })).toThrow(/Invalid email kind/);
    });

    test('handles empty or non-array candidates safely', () => {
      expect(pickRecipients({ candidates: [], kind: 'selected' })).toEqual({
        toSend: [],
        skippedAlreadySent: [],
        skippedInvalid: []
      });
      expect(pickRecipients({ candidates: null, kind: 'selected' })).toEqual({
        toSend: [],
        skippedAlreadySent: [],
        skippedInvalid: []
      });
    });
  });

  describe('Configuration helpers (cap, delay, dry run)', () => {
    test('getBulkMax defaults to 200 and parses valid integer', () => {
      expect(getBulkMax()).toBe(200);

      process.env.EMAIL_BULK_MAX = '50';
      expect(getBulkMax()).toBe(50);

      process.env.EMAIL_BULK_MAX = 'invalid';
      expect(getBulkMax()).toBe(200);
    });

    test('getSendDelayMs defaults to 1100, enforces minimum of 200 ms', () => {
      expect(getSendDelayMs()).toBe(1100);

      process.env.EMAIL_SEND_DELAY_MS = '500';
      expect(getSendDelayMs()).toBe(500);

      process.env.EMAIL_SEND_DELAY_MS = '50'; // below 200 min
      expect(getSendDelayMs()).toBe(200);

      process.env.EMAIL_SEND_DELAY_MS = 'invalid';
      expect(getSendDelayMs()).toBe(1100);
    });

    test('isDryRun detects true string accurately', () => {
      expect(isDryRun()).toBe(false);

      process.env.EMAIL_DRY_RUN = 'true';
      expect(isDryRun()).toBe(true);

      process.env.EMAIL_DRY_RUN = 'false';
      expect(isDryRun()).toBe(false);
    });
  });

  describe('In-memory 409 Concurrency Lock', () => {
    test('acquires lock and denies subsequent acquire for same jobId + kind', () => {
      expect(tryAcquireBulkLock('job-1', 'selected')).toBe(true);
      expect(tryAcquireBulkLock('job-1', 'selected')).toBe(false);
    });

    test('allows distinct locks for different kinds and jobIds', () => {
      expect(tryAcquireBulkLock('job-1', 'selected')).toBe(true);
      expect(tryAcquireBulkLock('job-1', 'rejected')).toBe(true);
      expect(tryAcquireBulkLock('job-2', 'selected')).toBe(true);

      expect(tryAcquireBulkLock('job-1', 'selected')).toBe(false);
    });

    test('releases lock and allows re-acquisition', () => {
      expect(tryAcquireBulkLock('job-1', 'selected')).toBe(true);
      releaseBulkLock('job-1', 'selected');
      expect(tryAcquireBulkLock('job-1', 'selected')).toBe(true);
      releaseBulkLock('job-1', 'selected');
    });

    test('handles invalid inputs gracefully without throwing', () => {
      expect(tryAcquireBulkLock('', 'selected')).toBe(false);
      expect(tryAcquireBulkLock('job-1', '')).toBe(false);
      expect(tryAcquireBulkLock(null, 'selected')).toBe(false);
      expect(() => releaseBulkLock(null, null)).not.toThrow();
    });
  });

  describe('Send execution flow & persistence order', () => {
    test('persists timestamp after each successful send in sequential order', async () => {
      const candidates = [
        { candidateId: 'c1', name: 'Alice', email: 'alice@example.com', currentRound: 'Selected' },
        { candidateId: 'c2', name: 'Bob', email: 'bob@example.com', currentRound: 'Selected' }
      ];

      const callLog = [];
      const mockSend = jest.fn().mockImplementation(async ({ to }) => {
        callLog.push(`send:${to}`);
        return { success: true };
      });

      const mockRecordSent = jest.fn().mockImplementation(async (candidateId, jobId, kind) => {
        callLog.push(`persist:${candidateId}`);
        return '2026-10-23T12:00:00.000Z';
      });

      const { toSend } = pickRecipients({ candidates, kind: 'selected' });
      for (const candidate of toSend) {
        const res = await mockSend({ to: candidate.email });
        if (res.success) {
          await mockRecordSent(candidate.candidateId, 'job-1', 'selected');
        }
      }

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockRecordSent).toHaveBeenCalledTimes(2);
      expect(callLog).toEqual([
        'send:alice@example.com',
        'persist:c1',
        'send:bob@example.com',
        'persist:c2'
      ]);
    });

    test('dry-run persists nothing and sends no emails', async () => {
      process.env.EMAIL_DRY_RUN = 'true';

      const mockSend = jest.fn();
      const mockRecordSent = jest.fn();

      const candidates = [
        { candidateId: 'c1', name: 'Alice', email: 'alice@example.com', currentRound: 'Selected' }
      ];

      const { toSend } = pickRecipients({ candidates, kind: 'selected' });

      if (isDryRun()) {
        // In dry run, handler returns without sending or persisting
        const response = {
          success: true,
          dryRun: true,
          total: toSend.length,
          sent: toSend.length,
          failed: 0,
          failures: []
        };
        expect(response.dryRun).toBe(true);
      } else {
        await mockSend();
        await mockRecordSent();
      }

      expect(mockSend).not.toHaveBeenCalled();
      expect(mockRecordSent).not.toHaveBeenCalled();
    });
  });

  describe('Pipeline rounds (Requirement 1)', () => {
    test('new pipeline defaults working rounds to ATS, Interview, Technical', () => {
      const working = getWorkingRounds(null);
      expect(working).toEqual(['ATS', 'Interview', 'Technical']);
      const display = buildDisplayRounds(working);
      expect(display).toEqual(['ATS', 'Interview', 'Technical', 'Selected', 'Eliminated']);
      expect(display.slice(-2)).toEqual(['Selected', 'Eliminated']);
    });

    test('preserves existing Offer round as ordinary working round', () => {
      const existingJob = { rounds: ['ATS', 'Interview', 'Technical', 'Offer'] };
      const working = getWorkingRounds(existingJob);
      expect(working).toEqual(['ATS', 'Interview', 'Technical', 'Offer']);
      const display = buildDisplayRounds(working);
      expect(display).toEqual(['ATS', 'Interview', 'Technical', 'Offer', 'Selected', 'Eliminated']);
      expect(display.slice(-2)).toEqual(['Selected', 'Eliminated']);
    });

    test('filters terminal rounds from job.rounds and adds them at the end', () => {
      const job = { rounds: ['ATS', 'Interview', 'Selected', 'Technical', 'Eliminated'] };
      const working = getWorkingRounds(job);
      expect(working).toEqual(['ATS', 'Interview', 'Technical']);
      const display = buildDisplayRounds(working);
      expect(display).toEqual(['ATS', 'Interview', 'Technical', 'Selected', 'Eliminated']);
    });
  });
});

