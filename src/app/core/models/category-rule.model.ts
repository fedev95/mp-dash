/** Auto-categorization rule: any transaction with this exact type gets this category. */
export interface CategoryRule {
  id: string;
  transactionType: string;
  categoryId: string;
}
