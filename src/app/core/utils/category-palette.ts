/** Curated swatches for category colors — medium-saturation tones that stay legible on light and dark surfaces. */
export const CATEGORY_PALETTE: string[] = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
];

/** Picks the first palette color not already in use; cycles back only once every color is taken. */
export function nextAvailableColor(usedColors: string[]): string {
  const used = new Set(usedColors);
  const free = CATEGORY_PALETTE.find((color) => !used.has(color));
  return free ?? CATEGORY_PALETTE[usedColors.length % CATEGORY_PALETTE.length];
}
