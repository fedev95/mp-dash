import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { StatementsService } from '../../../core/services/statements.service';
import { StatementRecord } from '../../../core/models/account-statement.model';
import { ArsCurrencyPipe } from '../../../core/pipes/ars-currency.pipe';
import { AmountClassPipe } from '../../../core/pipes/amount-class.pipe';
import { formatPeriod } from '../../../core/utils/format-period';

/** Extracts the year (as a number) from an ISO (YYYY-MM-DD) period date. */
function periodYear(period: string | null): number | null {
  if (!period) {
    return null;
  }
  return Number(period.slice(0, 4));
}

@Component({
  selector: 'app-statements-list',
  imports: [TableModule, MessageModule, SelectModule, FormsModule, ArsCurrencyPipe, AmountClassPipe],
  templateUrl: './statements-list.html',
})
export class StatementsList implements OnInit {
  private readonly statementsService = inject(StatementsService);
  private readonly router = inject(Router);

  readonly statements = signal<StatementRecord[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedYear = signal<number | null>(null);

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

  readonly filteredStatements = computed(() => {
    const year = this.selectedYear();
    if (year === null) {
      return this.statements();
    }
    return this.statements().filter((record) => periodYear(record.periodStart ?? record.periodEnd) === year);
  });

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const statements = await this.statementsService.getStatements();
      this.statements.set(statements);
      this.selectedYear.set(this.availableYears()[0] ?? null);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.loading.set(false);
    }
  }

  formatPeriod(record: StatementRecord): string {
    return formatPeriod(record.periodStart);
  }

  openStatement(record: StatementRecord): void {
    this.router.navigate(['/statements', record.id]);
  }
}
