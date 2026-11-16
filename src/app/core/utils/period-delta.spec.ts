import { StatementRecord } from '../models/account-statement.model';
import { computeDelta, findPreviousStatement } from './period-delta';

describe('computeDelta', () => {
  it('returns null without a previous value', () => {
    expect(computeDelta(100, null, true)).toBeNull();
  });

  it('returns null when both values are zero', () => {
    expect(computeDelta(0, 0, true)).toBeNull();
  });

  it('computes absolute and rounded percentage change', () => {
    expect(computeDelta(150, 100, true)).toEqual({ pct: 50, absolute: 50, favorable: true });
    expect(computeDelta(1, 3, true)).toEqual({ pct: -67, absolute: -2, favorable: false });
  });

  it('treats a decrease as favorable when lower is better', () => {
    expect(computeDelta(80, 100, false)?.favorable).toBeTrue();
  });

  it('uses the absolute previous value for negative amounts', () => {
    expect(computeDelta(-150, -100, false)).toEqual({ pct: -50, absolute: -50, favorable: true });
  });

  it('has no percentage when the previous value is zero', () => {
    expect(computeDelta(50, 0, true)).toEqual({ pct: null, absolute: 50, favorable: true });
  });

  it('is neither favorable nor unfavorable when nothing changed', () => {
    expect(computeDelta(100, 100, true)?.favorable).toBeNull();
  });
});

describe('findPreviousStatement', () => {
  const record = (id: string, periodStart: string | null): StatementRecord => ({
    id,
    fileName: `${id}.csv`,
    uploadedAt: '2026-01-01T00:00:00.000Z',
    periodStart,
    periodEnd: periodStart,
    summary: { initialBalance: 0, credits: 0, debits: 0, finalBalance: 0 },
  });

  const records = [
    record('jan', '2026-01-01'),
    record('mar', '2026-03-01'),
    record('feb', '2026-02-01'),
    record('empty', null),
  ];

  it('returns the latest statement strictly before the current one', () => {
    expect(findPreviousStatement(records, '2026-03-01')?.id).toBe('feb');
  });

  it('returns null for the first period', () => {
    expect(findPreviousStatement(records, '2026-01-01')).toBeNull();
  });

  it('returns null without a current period', () => {
    expect(findPreviousStatement(records, null)).toBeNull();
  });
});
