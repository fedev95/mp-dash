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
