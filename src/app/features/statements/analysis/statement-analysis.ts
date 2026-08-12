import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ChartModule } from 'primeng/chart';
import { StatementsService } from '../../../core/services/statements.service';
import { StatementDetail } from '../../../core/models/account-statement.model';
import { ArsCurrencyPipe } from '../../../core/pipes/ars-currency.pipe';
import { formatPeriod } from '../../../core/utils/format-period';
import { categorizeTransaction } from '../../../core/utils/transaction-category';
import { categoryColor, getChartTheme } from '../../../core/utils/chart-theme';

const arsCurrency = new ArsCurrencyPipe();

function shortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

@Component({
  selector: 'app-statement-analysis',
  imports: [CardModule, ButtonModule, MessageModule, ChartModule, ArsCurrencyPipe, RouterLink],
  templateUrl: './statement-analysis.html',
})
export class StatementAnalysis implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly statementsService = inject(StatementsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statement = signal<StatementDetail | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
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
    const byCategory = new Map<string, number>();
    for (const t of this.sortedTransactions()) {
      if (t.netAmount >= 0) {
        continue;
      }
      const category = categorizeTransaction(t.transactionType);
      byCategory.set(category, (byCategory.get(category) ?? 0) + Math.abs(t.netAmount));
    }
    const categories = [...byCategory.keys()];
    return {
      labels: categories,
      datasets: [
        {
          data: categories.map((c) => byCategory.get(c)!),
          backgroundColor: categories.map((c) => categoryColor(theme, c)),
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
      this.statement.set(await this.statementsService.getStatementById(id));
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
