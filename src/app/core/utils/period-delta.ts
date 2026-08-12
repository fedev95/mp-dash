import { StatementRecord } from '../models/account-statement.model';

export interface PeriodDelta {
  /** null when `previous` is 0 (a percentage change would be undefined/±∞). */
  pct: number | null;
  absolute: number;
  /** null when nothing actually changed — no "good" or "bad" framing for a zero delta. */
  favorable: boolean | null;
}

/** Compares `current` against `previous`, or returns null when there's no reference to compare against. */
export function computeDelta(
  current: number,
  previous: number | null,
  higherIsBetter: boolean,
): PeriodDelta | null {
  if (previous === null) {
    return null;
  }
  if (previous === 0 && current === 0) {
    return null;
  }

  const absolute = current - previous;
  const favorable = absolute === 0 ? null : higherIsBetter ? absolute > 0 : absolute < 0;
  const pct = previous === 0 ? null : Math.round((absolute / Math.abs(previous)) * 100);

  return { pct, absolute, favorable };
}

/** Finds the record with the largest `periodStart` strictly before `currentPeriodStart`. */
export function findPreviousStatement(
  records: StatementRecord[],
  currentPeriodStart: string | null,
): StatementRecord | null {
  if (!currentPeriodStart) {
    return null;
  }
  const earlier = records.filter(
    (r) => r.periodStart !== null && r.periodStart < currentPeriodStart,
  );
  if (earlier.length === 0) {
    return null;
  }
  return earlier.reduce((latest, r) => ((r.periodStart ?? '') > (latest.periodStart ?? '') ? r : latest));
}
