import { StatementTransaction } from '../models/account-statement.model';
import { Category } from '../models/category.model';
import { categorizeTransaction } from './transaction-category';

/** Resolves the category a transaction should display: manual/rule assignment, else auto-detection. */
export function effectiveCategory(
  tx: StatementTransaction,
  categories: Category[],
): { name: string; color: string | null } {
  if (tx.categoryId) {
    const match = categories.find((c) => c.id === tx.categoryId);
    if (match) {
      return { name: match.name, color: match.color };
    }
  }
  const autoName = categorizeTransaction(tx.transactionType);
  const autoMatch = categories.find((c) => c.name === autoName);
  return autoMatch
    ? { name: autoMatch.name, color: autoMatch.color }
    : { name: autoName, color: null };
}
