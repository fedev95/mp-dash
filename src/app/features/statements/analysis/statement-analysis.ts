import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ChartModule } from 'primeng/chart';
import { StatementsService } from '../../../core/services/statements.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { IndexedTransaction, StatementDetail } from '../../../core/models/account-statement.model';
import { Category } from '../../../core/models/category.model';
import { ArsCurrencyPipe } from '../../../core/pipes/ars-currency.pipe';
import { formatPeriod } from '../../../core/utils/format-period';
import { categorizeTransaction } from '../../../core/utils/transaction-category';
import { categoryColor, getChartTheme } from '../../../core/utils/chart-theme';
import { DeleteStatementDialog } from '../delete-statement-dialog/delete-statement-dialog';

const arsCurrency = new ArsCurrencyPipe();

function shortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

@Component({
  selector: 'app-statement-analysis',
  imports: [
    CardModule,
    ButtonModule,
    MessageModule,
    ChartModule,
    ArsCurrencyPipe,
    RouterLink,
    DeleteStatementDialog,
  ],
  templateUrl: './statement-analysis.html',
})
export class StatementAnalysis implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly statementsService = inject(StatementsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statement = signal<StatementDetail | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly deleteDialogVisible = signal(false);
  private readonly isDark = signal(document.documentElement.classList.contains('dark'));

  private readonly theme = computed(() => getChartTheme(this.isDark()));

  private readonly sortedTransactions = computed(() =>
    [...(this.statement()?.transactions ?? [])].sort((a, b) =>
      a.releaseDate.localeCompare(b.releaseDate),
    ),
  );

  get period(): string {
    return formatPeriod(this.statement()?.periodStart ?? null);
  }

  readonly balanceChartData = computed(() => {
    const theme = this.theme();
    const transactions = this.sortedTransactions();
    return {
      labels: transactions.map((t) => shortDate(t.releaseDate)),
      datasets: [
        {
          data: transactions.map((t) => t.partialBalance),
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

  readonly dailyFlowChartData = computed(() => {
    const theme = this.theme();
    const byDay = new Map<string, number>();
    for (const t of this.sortedTransactions()) {
      byDay.set(t.releaseDate, (byDay.get(t.releaseDate) ?? 0) + t.netAmount);
    }
    const days = [...byDay.keys()].sort();
    const values = days.map((day) => byDay.get(day)!);
    return {
      labels: days.map(shortDate),
      datasets: [
        {
          data: values,
          backgroundColor: values.map((v) => (v >= 0 ? theme.positive : theme.negative)),
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 24,
        },
      ],
    };
  });

  readonly dailyFlowChartOptions = computed(() => this.buildAxisChartOptions());

  readonly expenseBreakdownChartData = computed(() => {
    const theme = this.theme();
    const byKey = new Map<string, { label: string; color: string; total: number }>();
    for (const t of this.sortedTransactions()) {
      if (t.netAmount >= 0) {
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
  });

  readonly expenseBreakdownChartOptions = computed(() => {
    const theme = this.theme();
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
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
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Falta el identificador del resumen.');
      this.loading.set(false);
      return;
    }
    this.load(id);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => this.isDark.set(e.matches);
    media.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => media.removeEventListener('change', onChange));
  }

  async load(id: string): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const [statement, categories] = await Promise.all([
        this.statementsService.getStatementById(id),
        this.categoriesService.listCategories(),
      ]);
      this.statement.set(statement);
      this.categories.set(categories);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.loading.set(false);
    }
  }

  viewTransactions(): void {
    const id = this.statement()?.id;
    if (id) {
      this.router.navigate(['/statements', id, 'transactions']);
    }
  }

  onDeleted(): void {
    this.router.navigate(['/statements']);
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
