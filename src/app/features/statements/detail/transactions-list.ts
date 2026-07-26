import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { StatementsService } from '../../../core/services/statements.service';
import { StatementDetail } from '../../../core/models/account-statement.model';
import { ArsCurrencyPipe } from '../../../core/pipes/ars-currency.pipe';
import { IsoDatePipe } from '../../../core/pipes/iso-date.pipe';
import { formatPeriod } from '../../../core/utils/format-period';

@Component({
  selector: 'app-transactions-list',
  imports: [TableModule, MessageModule, ArsCurrencyPipe, IsoDatePipe, RouterLink],
  templateUrl: './transactions-list.html',
})
export class TransactionsList implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly statementsService = inject(StatementsService);

  readonly statement = signal<StatementDetail | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  get period(): string {
    return formatPeriod(this.statement()?.periodStart ?? null);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Falta el identificador del resumen.');
      this.loading.set(false);
      return;
    }
    this.load(id);
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
}
