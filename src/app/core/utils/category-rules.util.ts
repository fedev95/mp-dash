import { CategoryRule } from '../models/category-rule.model';

/** Normalizes a transaction type for rule matching: trim, collapse whitespace, lowercase. */
export function normalizeTransactionType(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Finds the rule (if any) whose transaction type matches, after normalization. */
export function findRuleFor(transactionType: string, rules: CategoryRule[]): CategoryRule | undefined {
  const normalized = normalizeTransactionType(transactionType);
  return rules.find((rule) => normalizeTransactionType(rule.transactionType) === normalized);
}
