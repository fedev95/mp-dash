import { StatementTransaction } from '../models/account-statement.model';
import { Category } from '../models/category.model';
import { effectiveCategory } from './effective-category';

describe('effectiveCategory', () => {
  const categories: Category[] = [
    { id: 'food', name: 'Comida', color: '#ef4444' },
    { id: 'payments', name: 'Pagos', color: '#3b82f6' },
  ];

  const tx = (overrides: Partial<StatementTransaction> = {}): StatementTransaction => ({
    releaseDate: '2026-03-01',
    transactionType: 'Pago en Kiosco',
    referenceId: '1',
    netAmount: -100,
    partialBalance: 0,
    ...overrides,
  });

  it('uses the assigned category when it exists', () => {
    expect(effectiveCategory(tx({ categoryId: 'food' }), categories)).toEqual({
      name: 'Comida',
      color: '#ef4444',
    });
  });

  it('falls back to auto-detection when the assigned category was deleted', () => {
    expect(effectiveCategory(tx({ categoryId: 'deleted' }), categories)).toEqual({
      name: 'Pagos',
      color: '#3b82f6',
    });
  });

  it('returns the auto-detected name without color when no category matches', () => {
    expect(effectiveCategory(tx({ transactionType: 'Devolución' }), categories)).toEqual({
      name: 'Otros',
      color: null,
    });
  });
});
