import { formatPeriod, periodCode } from './format-period';

describe('formatPeriod', () => {
  it('formats as a capitalized Spanish month and year', () => {
    expect(formatPeriod('2026-02-01')).toBe('Febrero de 2026');
  });

  it('returns "-" without a period', () => {
    expect(formatPeriod(null)).toBe('-');
  });
});

describe('periodCode', () => {
  it('formats as MM-YYYY', () => {
    expect(periodCode('2026-02-15')).toBe('02-2026');
  });

  it('returns an empty string without a period', () => {
    expect(periodCode(null)).toBe('');
  });
});
