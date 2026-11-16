import {
  AccountStatement,
  StatementSummary,
  StatementTransaction,
} from '../models/account-statement.model';

const SUMMARY_HEADER = 'INITIAL_BALANCE;CREDITS;DEBITS;FINAL_BALANCE';
const TRANSACTIONS_HEADER =
  'RELEASE_DATE;TRANSACTION_TYPE;REFERENCE_ID;TRANSACTION_NET_AMOUNT;PARTIAL_BALANCE';

/**
 * Parses a Mercado Pago monthly account statement CSV (semicolon-delimited,
 * Argentine number/date formats) into a structured object.
 */
export function parseMpStatement(csvText: string): AccountStatement {
  const lines = csvText.split(/\r?\n/).map((line) => line.trim());

  const summaryHeaderIndex = lines.findIndex((line) => line === SUMMARY_HEADER);
  const transactionsHeaderIndex = lines.findIndex((line) => line === TRANSACTIONS_HEADER);

  if (summaryHeaderIndex === -1 || transactionsHeaderIndex === -1) {
    throw new Error('El archivo no tiene el formato esperado de resumen de cuenta.');
  }

  const summaryRow = lines
    .slice(summaryHeaderIndex + 1, transactionsHeaderIndex)
    .find((line) => line.length > 0);
  if (!summaryRow) {
    throw new Error('No se encontró la fila de saldos del resumen.');
  }

  const summary = parseSummaryRow(summaryRow);

  const transactions = lines
    .slice(transactionsHeaderIndex + 1)
    .map((line, index) => ({ line, lineNumber: transactionsHeaderIndex + 2 + index }))
    .filter(({ line }) => line.length > 0)
    .map(({ line, lineNumber }) => parseTransactionRow(line, lineNumber));

  return { summary, transactions };
}

function parseSummaryRow(row: string): StatementSummary {
  const columns = row.split(';');
  if (columns.length !== 4) {
    throw new Error(`La fila de saldos tiene un formato inválido: "${row}".`);
  }
  const [initialBalance, credits, debits, finalBalance] = columns.map((c) => parseArNumber(c));
  return { initialBalance, credits, debits, finalBalance };
}

function parseTransactionRow(row: string, lineNumber: number): StatementTransaction {
  const columns = row.split(';');
  if (columns.length !== 5) {
    throw new Error(`Línea ${lineNumber}: formato de transacción inválido ("${row}").`);
  }
  const [releaseDate, transactionType, referenceId, netAmount, partialBalance] = columns;
  return {
    releaseDate: parseArDate(releaseDate, lineNumber),
    transactionType: transactionType.trim(),
    referenceId: referenceId.trim(),
    netAmount: parseArNumber(netAmount, lineNumber),
    partialBalance: parseArNumber(partialBalance, lineNumber),
  };
}

/** Converts an Argentine-formatted number ("1.234,56" / "-363.142,96") to a JS number. */
function parseArNumber(raw: string, lineNumber?: number): number {
  const normalized = raw.trim().replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  if (Number.isNaN(value) || normalized === '') {
    throw new Error(`${lineNumber ? `Línea ${lineNumber}: ` : ''}número inválido ("${raw}").`);
  }
  return value;
}

/** Converts a "DD-MM-YYYY" date to ISO "YYYY-MM-DD". */
function parseArDate(raw: string, lineNumber: number): string {
  const match = raw.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) {
    throw new Error(`Línea ${lineNumber}: fecha inválida ("${raw}").`);
  }
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}
