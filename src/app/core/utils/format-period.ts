const monthYearFormatter = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
});

/** Formats an ISO (YYYY-MM-DD) period start date as "Mes de AAAA", e.g. "Febrero de 2026". */
export function formatPeriod(periodStart: string | null): string {
  if (!periodStart) {
    return '-';
  }
  const [year, month] = periodStart.split('-').map(Number);
  const formatted = monthYearFormatter.format(new Date(year, month - 1, 1));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
