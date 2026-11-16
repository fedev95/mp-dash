import { CategoryRule } from '../models/category-rule.model';
import { findRuleFor, normalizeTransactionType } from './category-rules.util';

describe('normalizeTransactionType', () => {
  it('trims, collapses whitespace and lowercases', () => {
    expect(normalizeTransactionType('  Pago   en\tKiosco ')).toBe('pago en kiosco');
  });
});

describe('findRuleFor', () => {
  const rules: CategoryRule[] = [
    { id: 'r1', transactionType: 'Pago en Kiosco', categoryId: 'food' },
    { id: 'r2', transactionType: 'Rendimientos', categoryId: 'income' },
  ];

  it('matches regardless of case and spacing', () => {
    expect(findRuleFor('pago  en KIOSCO ', rules)?.id).toBe('r1');
  });

  it('returns undefined when no rule matches', () => {
    expect(findRuleFor('Pago en Farmacia', rules)).toBeUndefined();
  });
});
