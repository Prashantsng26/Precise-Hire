import { tryAcquire, release } from '../utils/screenLock.js';

describe('screenLock.js', () => {
  afterEach(() => {
    // Clean up locks after each test
    release('job-1');
    release('job-2');
    release('job-3');
  });

  test('acquires lock for a new jobId', () => {
    expect(tryAcquire('job-1')).toBe(true);
  });

  test('double acquire returns false for the same jobId', () => {
    expect(tryAcquire('job-1')).toBe(true);
    expect(tryAcquire('job-1')).toBe(false);
  });

  test('release then acquire returns true', () => {
    expect(tryAcquire('job-1')).toBe(true);
    release('job-1');
    expect(tryAcquire('job-1')).toBe(true);
  });

  test('manages locks for independent jobIds separately', () => {
    expect(tryAcquire('job-1')).toBe(true);
    expect(tryAcquire('job-2')).toBe(true);
    expect(tryAcquire('job-1')).toBe(false);
    expect(tryAcquire('job-2')).toBe(false);

    release('job-1');
    expect(tryAcquire('job-1')).toBe(true);
    expect(tryAcquire('job-2')).toBe(false);
  });

  test('handles invalid, empty, or non-string inputs safely', () => {
    expect(tryAcquire('')).toBe(false);
    expect(tryAcquire('   ')).toBe(false);
    expect(tryAcquire(null)).toBe(false);
    expect(tryAcquire(undefined)).toBe(false);
    expect(tryAcquire(123)).toBe(false);

    // release with invalid inputs should not throw
    expect(() => release('')).not.toThrow();
    expect(() => release(null)).not.toThrow();
  });
});
