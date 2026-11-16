import { parseMpStatement } from '../parsers/mp-statement-parser';
import { AccountStatement } from '../models/account-statement.model';
import { SAMPLE_STATEMENTS } from './demo';

describe('SAMPLE_STATEMENTS', () => {
  let statements: AccountStatement[];

  beforeAll(async () => {
    statements = await Promise.all(
      SAMPLE_STATEMENTS.map(async ({ file }) => {
        const response = await fetch(file);
        expect(response.ok).withContext(file).toBeTrue();
        return parseMpStatement(await response.text());
      }),
    );
  });

  it('parse with balances that add up', () => {
    for (const { summary, transactions } of statements) {
      const net = transactions.reduce((sum, t) => sum + t.netAmount, 0);
      expect(transactions.length).toBeGreaterThan(0);
      expect(summary.credits + summary.debits).toBeCloseTo(net, 2);
      expect(summary.initialBalance + net).toBeCloseTo(summary.finalBalance, 2);
      expect(transactions.at(-1)!.partialBalance).toBeCloseTo(summary.finalBalance, 2);
    }
  });

  it('chain month to month', () => {
    for (let i = 1; i < statements.length; i++) {
      expect(statements[i].summary.initialBalance).toBeCloseTo(
        statements[i - 1].summary.finalBalance,
        2,
      );
    }
  });
});
