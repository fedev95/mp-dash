import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { StatementsService } from '../../../core/services/statements.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { StatementDetail } from '../../../core/models/account-statement.model';
import { Category } from '../../../core/models/category.model';
import { ArsCurrencyPipe } from '../../../core/pipes/ars-currency.pipe';
import { AmountClassPipe } from '../../../core/pipes/amount-class.pipe';
import { IsoDatePipe } from '../../../core/pipes/iso-date.pipe';
import { categorizeTransaction } from '../../../core/utils/transaction-category';

@Component({
  selector: 'app-transaction-detail',
  imports: [
    CardModule,
    ButtonModule,
    MessageModule,
    SelectModule,
    TextareaModule,
    FormsModule,
    ArsCurrencyPipe,
    AmountClassPipe,
    IsoDatePipe,
    RouterLink,
  ],
  templateUrl: './transaction-detail.html',
})
export class TransactionDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly statementsService = inject(StatementsService);
  private readonly categoriesService = inject(CategoriesService);

  private statementId = '';
  private transactionIndex = -1;

  readonly statement = signal<StatementDetail | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saved = signal(false);

  readonly transaction = computed(
    () => this.statement()?.transactions.find((t) => t.id === this.transactionIndex) ?? null,
  );

  readonly autoCategory = computed(() =>
    categorizeTransaction(this.transaction()?.transactionType ?? ''),
  );

  readonly selectedCategoryId = signal<string | null>(null);
  readonly noteValue = signal('');

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    const txId = Number(this.route.snapshot.paramMap.get('txId'));
    if (!id || Number.isNaN(txId)) {
      this.errorMessage.set('Falta el identificador del movimiento.');
      this.loading.set(false);
      return;
    }
    this.statementId = id;
    this.transactionIndex = txId;

    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const [statement, categories] = await Promise.all([
        this.statementsService.getStatementById(id),
        this.categoriesService.listCategories(),
      ]);
      this.statement.set(statement);
      this.categories.set(categories);

      const tx = this.transaction();
      if (!tx) {
        this.errorMessage.set('No se encontró el movimiento solicitado.');
        return;
      }
      this.selectedCategoryId.set(tx.categoryId ?? null);
      this.noteValue.set(tx.note ?? '');
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.errorMessage.set(null);
    this.saved.set(false);
    try {
      const transactions = await this.statementsService.updateTransaction(
        this.statementId,
        this.transactionIndex,
        { categoryId: this.selectedCategoryId() ?? '', note: this.noteValue().trim() },
      );
      this.statement.update((current) => (current ? { ...current, transactions } : current));
      this.saved.set(true);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.saving.set(false);
    }
  }
}
