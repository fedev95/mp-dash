import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ChartModule } from 'primeng/chart';
import { StatementsService } from '../../../core/services/statements.service';
import { CategoriesService } from '../../../core/services/categories.service';
import {
  IndexedTransaction,
  StatementDetail,
  StatementRecord,
} from '../../../core/models/account-statement.model';
import { Category } from '../../../core/models/category.model';
import { ArsCurrencyPipe } from '../../../core/pipes/ars-currency.pipe';
import { AmountClassPipe } from '../../../core/pipes/amount-class.pipe';
import { FavorableClassPipe } from '../../../core/pipes/favorable-class.pipe';
import { formatPeriod } from '../../../core/utils/format-period';
import { categorizeTransaction } from '../../../core/utils/transaction-category';
import { categoryColor, getChartTheme } from '../../../core/utils/chart-theme';
import { computeDelta } from '../../../core/utils/period-delta';

const arsCurrency = new ArsCurrencyPipe();

const MONTH_LABELS: string[] = Array.from({ length: 12 }, (_, month) => {
  const formatted = new Intl.DateTimeFormat('es-AR', { month: 'short' }).format(
    new Date(2000, month, 1),
  );
  const trimmed = formatted.replace('.', '');
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
});

interface MonthCell {
  month: number;
  label: string;
  record: StatementRecord | null;
  isFuture: boolean;
}

/** Extracts the year (as a number) from an ISO (YYYY-MM-DD) period date. */
function periodYear(period: string | null): number | null {
  if (!period) {
    return null;
  }
  return Number(period.slice(0, 4));
}

/** Extracts the month (0-indexed) from an ISO (YYYY-MM-DD) period date. */
function periodMonth(period: string | null): number | null {
  if (!period) {
    return null;
  }
  return Number(period.slice(5, 7)) - 1;
}

function shortPeriod(periodStart: string | null): string {
  if (!periodStart) {
    return '-';
  }
  const [year, month] = periodStart.split('-');
  return `${MONTH_LABELS[Number(month) - 1]} ${year.slice(2)}`;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CardModule,
    ButtonModule,
    MessageModule,
    SelectModule,
    ChartModule,
    FormsModule,
    ArsCurrencyPipe,
    AmountClassPipe,
    FavorableClassPipe,
    RouterLink,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly router = inject(Router);
  private readonly statementsService = inject(StatementsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statements = signal<StatementRecord[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly yearDetails = signal<StatementDetail[]>([]);
  readonly loading = signal(true);
  readonly yearDetailsLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedYear = signal(new Date().getFullYear());
  readonly selectedCategoryKey = signal<string | null>(null);

  private readonly isDark = signal(document.documentElement.classList.contains('dark'));
  private readonly theme = computed(() => getChartTheme(this.isDark()));

  readonly availableYears = computed(() => {
    const years = new Set<number>();
    for (const record of this.statements()) {
      const year = periodYear(record.periodStart ?? record.periodEnd);
      if (year !== null) {
        years.add(year);
      }
    }
    return [...years].sort((a, b) => b - a);
  });

  readonly yearStatements = computed(() =>
    this.statements().filter(
      (r) => periodYear(r.periodStart ?? r.periodEnd) === this.selectedYear(),
    ),
  );

  readonly yearCredits = computed(() =>
    this.yearStatements().reduce((sum, r) => sum + r.summary.credits, 0),
  );

  readonly yearDebits = computed(() =>
    this.yearStatements().reduce((sum, r) => sum + r.summary.debits, 0),
  );

  readonly previousYearStatements = computed(() =>
    this.statements().filter(
      (r) => periodYear(r.periodStart ?? r.periodEnd) === this.selectedYear() - 1,
    ),
  );

  readonly yearCreditsDelta = computed(() => {
    const prev = this.previousYearStatements();
    if (prev.length === 0) {
      return null;
    }
    const prevCredits = prev.reduce((sum, r) => sum + r.summary.credits, 0);
    return computeDelta(this.yearCredits(), prevCredits, true);
  });

  readonly yearDebitsDelta = computed(() => {
    const prev = this.previousYearStatements();
    if (prev.length === 0) {
      return null;
    }
    const prevDebits = prev.reduce((sum, r) => sum + r.summary.debits, 0);
    // `debits` is stored negative (money out); compare spending as a magnitude so a bigger
    // real-world spend reads as an increase instead of a numeric decrease.
    return computeDelta(Math.abs(this.yearDebits()), Math.abs(prevDebits), false);
  });

  readonly latestStatement = computed(() => {
    const sorted = [...this.statements()].sort((a, b) =>
      (b.periodStart ?? '').localeCompare(a.periodStart ?? ''),
    );
    return sorted[0] ?? null;
  });

  readonly latestBalance = computed(() => this.latestStatement()?.summary.finalBalance ?? null);

  readonly recentStatements = computed(() =>
    [...this.statements()]
      .sort((a, b) => (b.periodStart ?? '').localeCompare(a.periodStart ?? ''))
      .slice(0, 4),
  );

  readonly monthCells = computed<MonthCell[]>(() => {
    const year = this.selectedYear();
    const byMonth = new Map<number, StatementRecord>();
    for (const record of this.statements()) {
      const y = periodYear(record.periodStart ?? record.periodEnd);
      const m = periodMonth(record.periodStart ?? record.periodEnd);
      if (y === year && m !== null) {
        byMonth.set(m, record);
      }
    }
    const now = new Date();
    const isCurrentYear = year === now.getFullYear();
    const currentMonth = now.getMonth();
    return MONTH_LABELS.map((label, month) => ({
      month,
      label,
      record: byMonth.get(month) ?? null,
      isFuture: isCurrentYear && month > currentMonth,
    }));
  });

  get hasStatements(): boolean {
    return this.statements().length > 0;
  }

  private readonly sortedStatements = computed(() =>
    [...this.statements()].sort((a, b) => (a.periodStart ?? '').localeCompare(b.periodStart ?? '')),
  );

  readonly balanceChartData = computed(() => {
    const theme = this.theme();
    const statements = this.sortedStatements();
    return {
      labels: statements.map((s) => shortPeriod(s.periodStart)),
      datasets: [
        {
          data: statements.map((s) => s.summary.finalBalance),
          borderColor: theme.positive,
          backgroundColor: `${theme.positive}1a`,
          pointBackgroundColor: theme.positive,
          pointBorderColor: theme.surface,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.2,
        },
      ],
    };
  });

  readonly balanceChartOptions = computed(() => this.buildAxisChartOptions());

  private readonly yearTransactions = computed(() =>
    this.yearDetails().flatMap((d) => d.transactions),
  );

  readonly expenseBreakdownChartData = computed(() =>
    this.buildCategoryBreakdown(this.yearTransactions(), this.theme(), (t) => t.netAmount < 0),
  );

  readonly incomeBreakdownChartData = computed(() =>
    this.buildCategoryBreakdown(this.yearTransactions(), this.theme(), (t) => t.netAmount > 0),
  );

  private buildCategoryBreakdown(
    transactions: IndexedTransaction[],
    theme: ReturnType<typeof getChartTheme>,
    predicate: (t: IndexedTransaction) => boolean,
  ) {
    const byKey = new Map<string, { label: string; color: string; total: number }>();
    for (const t of transactions) {
      if (!predicate(t)) {
        continue;
      }
      const { key, label, color } = this.effectiveCategory(t, theme);
      const entry = byKey.get(key) ?? { label, color, total: 0 };
      entry.total += Math.abs(t.netAmount);
      byKey.set(key, entry);
    }
    const entries = [...byKey.values()];
    return {
      labels: entries.map((e) => e.label),
      datasets: [
        {
          data: entries.map((e) => e.total),
          backgroundColor: entries.map((e) => e.color),
          borderColor: theme.surface,
          borderWidth: 2,
        },
      ],
    };
  }

  readonly categoryBreakdownChartOptions = computed(() => {
    const theme = this.theme();
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      radius: '80%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: theme.text, usePointStyle: true },
        },
        tooltip: {
          callbacks: {
            label: (ctx: { label: string; parsed: number }) =>
              `${ctx.label}: ${arsCurrency.transform(ctx.parsed)}`,
          },
        },
      },
    };
  });

  get hasExpenseBreakdown(): boolean {
    return this.expenseBreakdownChartData().labels.length > 0;
  }

  get hasIncomeBreakdown(): boolean {
    return this.incomeBreakdownChartData().labels.length > 0;
  }

  readonly yearCategoryOptions = computed(() => {
    const theme = this.theme();
    const byKey = new Map<string, { label: string; color: string; total: number }>();
    for (const t of this.yearTransactions()) {
      const { key, label, color } = this.effectiveCategory(t, theme);
      const entry = byKey.get(key) ?? { label, color, total: 0 };
      entry.total += Math.abs(t.netAmount);
      byKey.set(key, entry);
    }
    return [...byKey.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.total - a.total);
  });

  get hasCategoryTrend(): boolean {
    return this.yearCategoryOptions().length > 0;
  }

  readonly categoryTrendChartData = computed(() => {
    const theme = this.theme();
    const key = this.selectedCategoryKey();
    const option = this.yearCategoryOptions().find((o) => o.key === key);
    const color = option?.color ?? theme.muted;

    const totals = new Array(12).fill(0);
    for (const t of this.yearTransactions()) {
      const { key: tKey } = this.effectiveCategory(t, theme);
      if (tKey !== key) {
        continue;
      }
      const month = periodMonth(t.releaseDate);
      if (month === null) {
        continue;
      }
      totals[month] += t.netAmount;
    }

    return {
      labels: MONTH_LABELS,
      datasets: [
        {
          data: totals,
          backgroundColor: color,
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 24,
        },
      ],
    };
  });

  readonly categoryTrendChartOptions = computed(() => this.buildAxisChartOptions());

  private effectiveCategory(
    t: IndexedTransaction,
    theme: ReturnType<typeof getChartTheme>,
  ): { key: string; label: string; color: string } {
    if (t.categoryId) {
      const match = this.categories().find((c) => c.id === t.categoryId);
      if (match) {
        return { key: match.id, label: match.name, color: match.color };
      }
    }
    const label = categorizeTransaction(t.transactionType);
    const autoMatch = this.categories().find((c) => c.name === label);
    if (autoMatch) {
      return { key: autoMatch.id, label: autoMatch.name, color: autoMatch.color };
    }
    return { key: `auto:${label}`, label, color: categoryColor(theme, label) };
  }

  ngOnInit(): void {
    this.load();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => this.isDark.set(e.matches);
    media.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => media.removeEventListener('change', onChange));
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const [statements, categories] = await Promise.all([
        this.statementsService.getStatements(),
        this.categoriesService.listCategories(),
      ]);
      this.statements.set(statements);
      this.categories.set(categories);
      this.selectedYear.set(this.availableYears()[0] ?? this.selectedYear());
      void this.loadYearDetails(this.selectedYear());
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadYearDetails(year: number): Promise<void> {
    this.yearDetailsLoading.set(true);
    try {
      const ids = this.statements()
        .filter((r) => periodYear(r.periodStart ?? r.periodEnd) === year)
        .map((r) => r.id);
      const details = await Promise.all(
        ids.map((id) => this.statementsService.getStatementById(id)),
      );
      this.yearDetails.set(details);

      const options = this.yearCategoryOptions();
      if (options.length > 0 && !options.some((o) => o.key === this.selectedCategoryKey())) {
        this.selectedCategoryKey.set(options[0].key);
      }
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.yearDetailsLoading.set(false);
    }
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    void this.loadYearDetails(year);
  }

  formatPeriod(record: StatementRecord): string {
    return formatPeriod(record.periodStart);
  }

  monthCellClasses(cell: MonthCell): string {
    if (cell.record) {
      return 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-500/20';
    }
    if (cell.isFuture) {
      return 'text-surface-300 dark:text-surface-600 cursor-default';
    }
    return 'border border-dashed border-surface-300 dark:border-surface-600 text-surface-400 dark:text-surface-500 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800';
  }

  openMonth(cell: MonthCell): void {
    if (cell.isFuture) {
      return;
    }
    if (cell.record) {
      this.router.navigate(['/statements', cell.record.id]);
    } else {
      this.router.navigate(['/documents']);
    }
  }

  goToUpload(): void {
    this.router.navigate(['/documents']);
  }

  private buildAxisChartOptions() {
    const theme = this.theme();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { parsed: { y: number } }) => arsCurrency.transform(ctx.parsed.y),
          },
        },
      },
      interaction: { mode: 'index' as const, intersect: false },
      scales: {
        x: {
          ticks: { color: theme.muted },
          grid: { color: theme.grid },
          border: { color: theme.grid },
        },
        y: {
          ticks: { color: theme.muted },
          grid: { color: theme.grid },
          border: { color: theme.grid },
        },
      },
    };
  }
}
