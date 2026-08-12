const CATEGORY_PREFIXES: Array<{ prefix: string; category: string }> = [
  { prefix: 'transferencia enviada', category: 'Transferencias enviadas' },
  { prefix: 'transferencia recibida', category: 'Transferencias recibidas' },
  { prefix: 'rendimiento', category: 'Rendimientos' },
  { prefix: 'pago', category: 'Pagos' },
  { prefix: 'cobro', category: 'Cobros' },
];

/** Buckets a free-text Mercado Pago `transactionType` into a fixed set of categories. */
export function categorizeTransaction(transactionType: string): string {
  const normalized = transactionType.trim().toLowerCase();
  const match = CATEGORY_PREFIXES.find((rule) => normalized.startsWith(rule.prefix));
  return match?.category ?? 'Otros';
}
