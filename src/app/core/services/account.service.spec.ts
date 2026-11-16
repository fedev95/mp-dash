import { RECENT_SIGN_IN_MS, signedInRecently } from './account.service';

describe('signedInRecently', () => {
  const now = Date.parse('2026-03-01T12:00:00Z');

  it('accepts a sign-in within the allowed window', () => {
    expect(signedInRecently('Sun, 01 Mar 2026 11:58:00 GMT', now)).toBeTrue();
  });

  it('rejects an older sign-in', () => {
    const old = new Date(now - RECENT_SIGN_IN_MS - 1000).toUTCString();
    expect(signedInRecently(old, now)).toBeFalse();
  });

  it('rejects a missing or future sign-in time', () => {
    expect(signedInRecently(undefined, now)).toBeFalse();
    expect(signedInRecently('Sun, 01 Mar 2026 12:10:00 GMT', now)).toBeFalse();
  });
});
