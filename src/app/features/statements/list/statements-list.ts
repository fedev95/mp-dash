import { Component, OnInit, inject, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { StatementsService } from '../../../core/services/statements.service';
import { StatementRecord } from '../../../core/models/account-statement.model';
import { ArsCurrencyPipe } from '../../../core/pipes/ars-currency.pipe';

@Component({
  selector: 'app-statements-list',
  imports: [TableModule, MessageModule, ArsCurrencyPipe],
  templateUrl: './statements-list.html',
})
export class StatementsList implements OnInit {
  private readonly statementsService = inject(StatementsService);

  readonly statements = signal<StatementRecord[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      this.statements.set(await this.statementsService.getStatements());
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.loading.set(false);
    }
  }

  private static readonly monthYearFormatter = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  });

  formatPeriod(record: StatementRecord): string {
    if (!record.periodStart) {
      return '-';
    }
    const [year, month] = record.periodStart.split('-').map(Number);
    const formatted = StatementsList.monthYearFormatter.format(new Date(year, month - 1, 1));
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
}
