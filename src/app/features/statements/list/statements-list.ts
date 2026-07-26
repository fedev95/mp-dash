import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { StatementsService } from '../../../core/services/statements.service';
import { StatementRecord } from '../../../core/models/account-statement.model';
import { ArsCurrencyPipe } from '../../../core/pipes/ars-currency.pipe';
import { formatPeriod } from '../../../core/utils/format-period';

@Component({
  selector: 'app-statements-list',
  imports: [TableModule, MessageModule, ArsCurrencyPipe],
  templateUrl: './statements-list.html',
})
export class StatementsList implements OnInit {
  private readonly statementsService = inject(StatementsService);
  private readonly router = inject(Router);

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

  formatPeriod(record: StatementRecord): string {
    return formatPeriod(record.periodStart);
  }

  openStatement(record: StatementRecord): void {
    this.router.navigate(['/statements', record.id]);
  }
}
