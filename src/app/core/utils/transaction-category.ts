const CATEGORY_PREFIXES: { prefix: string; category: string }[] = [
  { prefix: 'transferencia enviada', category: 'Transferencias enviadas' },
  { prefix: 'transferencia recibida', category: 'Transferencias recibidas' },
  { prefix: 'rendimiento', category: 'Rendimientos' },
  { prefix: 'pago', category: 'Pagos' },
  { prefix: 'cobro', category: 'Cobros' },
];

const FALLBACK_CATEGORY = 'Otros';

/** Buckets a free-text Mercado Pago `transactionType` into a fixed set of categories. */
export function categorizeTransaction(transactionType: string): string {
  const normalized = transactionType.trim().toLowerCase();
  const match = CATEGORY_PREFIXES.find((rule) => normalized.startsWith(rule.prefix));
  return match?.category ?? FALLBACK_CATEGORY;
}

/** Every category name the automatic detection can produce. */
export const AUTO_CATEGORY_NAMES: string[] = [
  ...CATEGORY_PREFIXES.map((rule) => rule.category),
  FALLBACK_CATEGORY,
];
