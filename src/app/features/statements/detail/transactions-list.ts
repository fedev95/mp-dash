import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { StatementsService } from '../../../core/services/statements.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { IndexedTransaction, StatementDetail } from '../../../core/models/account-statement.model';
import { Category } from '../../../core/models/category.model';
import { ArsCurrencyPipe } from '../../../core/pipes/ars-currency.pipe';
import { AmountClassPipe } from '../../../core/pipes/amount-class.pipe';
import { IsoDatePipe } from '../../../core/pipes/iso-date.pipe';
import { formatPeriod } from '../../../core/utils/format-period';
import { categorizeTransaction } from '../../../core/utils/transaction-category';
import { NoteDialog } from '../note-dialog/note-dialog';

@Component({
  selector: 'app-transactions-list',
  imports: [
    TableModule,
    MessageModule,
    ArsCurrencyPipe,
    AmountClassPipe,
    IsoDatePipe,
    RouterLink,
    NoteDialog,
  ],
  templateUrl: './transactions-list.html',
})
export class TransactionsList implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly statementsService = inject(StatementsService);
  private readonly categoriesService = inject(CategoriesService);

  readonly statement = signal<StatementDetail | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly noteTarget = signal<IndexedTransaction | null>(null);
  readonly noteDialogVisible = signal(false);

  get period(): string {
    return formatPeriod(this.statement()?.periodStart ?? null);
  }

  readonly rows = computed(() => {
    const transactions = this.statement()?.transactions ?? [];
    return transactions.map((tx) => {
      const category = this.categoryFor(tx);
      return { ...tx, categoryLabel: category.name, categoryColorValue: category.color };
    });
  });

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

  categoryFor(tx: IndexedTransaction): { name: string; color: string | null } {
    if (tx.categoryId) {
      const match = this.categories().find((c) => c.id === tx.categoryId);
      if (match) {
        return { name: match.name, color: match.color };
      }
    }
    const autoName = categorizeTransaction(tx.transactionType);
    const autoMatch = this.categories().find((c) => c.name === autoName);
    return autoMatch
      ? { name: autoMatch.name, color: autoMatch.color }
      : { name: autoName, color: null };
  }

  openTransaction(tx: IndexedTransaction): void {
    const id = this.statement()?.id;
    if (id) {
      this.router.navigate(['/statements', id, 'transactions', tx.id]);
    }
  }

  openNote(tx: IndexedTransaction, event: Event): void {
    event.stopPropagation();
    this.noteTarget.set(tx);
    this.noteDialogVisible.set(true);
  }

  onNoteUpdated(transactions: IndexedTransaction[]): void {
    this.statement.update((current) => (current ? { ...current, transactions } : current));
  }
}
