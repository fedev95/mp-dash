import { parseMpStatement } from './mp-statement-parser';

const SAMPLE_CSV = `INITIAL_BALANCE;CREDITS;DEBITS;FINAL_BALANCE
1.000.000,00;505.000,50;-20.000,00;1.485.000,50

RELEASE_DATE;TRANSACTION_TYPE;REFERENCE_ID;TRANSACTION_NET_AMOUNT;PARTIAL_BALANCE
01-03-2026;Rendimientos ;100000000001;5.000,50;1.005.000,50
05-03-2026;Transferencia enviada Ana Garcia,lopez;100000000002;-20.000,00;985.000,50
10-03-2026;Transferencia recibida JUAN,PEREZ;100000000003;500.000,00;1.485.000,50
`;

describe('parseMpStatement', () => {
  it('parses the summary row with Argentine number formatting', () => {
    const { summary } = parseMpStatement(SAMPLE_CSV);
    expect(summary).toEqual({
      initialBalance: 1000000,
      credits: 505000.5,
      debits: -20000,
      finalBalance: 1485000.5,
    });
  });

  it('parses transaction rows, including commas inside the type field', () => {
    const { transactions } = parseMpStatement(SAMPLE_CSV);
    expect(transactions).toEqual([
      {
        releaseDate: '2026-03-01',
        transactionType: 'Rendimientos',
        referenceId: '100000000001',
        netAmount: 5000.5,
        partialBalance: 1005000.5,
      },
      {
        releaseDate: '2026-03-05',
        transactionType: 'Transferencia enviada Ana Garcia,lopez',
        referenceId: '100000000002',
        netAmount: -20000,
        partialBalance: 985000.5,
      },
      {
        releaseDate: '2026-03-10',
        transactionType: 'Transferencia recibida JUAN,PEREZ',
        referenceId: '100000000003',
        netAmount: 500000,
        partialBalance: 1485000.5,
      },
    ]);
  });

  it('throws on a file missing the expected headers', () => {
    expect(() => parseMpStatement('foo;bar\n1;2')).toThrowError(/formato esperado/);
  });

  it('throws on a malformed transaction row', () => {
    const broken = SAMPLE_CSV + '01-01-2026;Incompleta;123\n';
    expect(() => parseMpStatement(broken)).toThrowError(/formato de transacción inválido/);
  });
});
