export interface StatementSummary {
  initialBalance: number;
  credits: number;
  debits: number;
  finalBalance: number;
}

export interface StatementTransaction {
  /** ISO date (YYYY-MM-DD). */
  releaseDate: string;
  transactionType: string;
  referenceId: string;
  netAmount: number;
  partialBalance: number;
}

export interface AccountStatement {
  summary: StatementSummary;
  transactions: StatementTransaction[];
}

/** A previously uploaded statement, as stored/read back from Firestore. */
export interface StatementRecord {
  id: string;
  fileName: string;
  uploadedAt: string;
  /** ISO date (YYYY-MM-DD) of the first transaction, or null if the statement had none. */
  periodStart: string | null;
  /** ISO date (YYYY-MM-DD) of the last transaction, or null if the statement had none. */
  periodEnd: string | null;
  summary: StatementSummary;
}
