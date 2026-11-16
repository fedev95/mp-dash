import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { StatementsService } from '../../../core/services/statements.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { CategoryRulesService } from '../../../core/services/category-rules.service';
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
    CheckboxModule,
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
  private readonly categoryRulesService = inject(CategoryRulesService);

  private statementId = '';
  private transactionIndex = -1;

  readonly statement = signal<StatementDetail | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly appliedCount = signal<number | null>(null);

  readonly transaction = computed(
    () => this.statement()?.transactions.find((t) => t.id === this.transactionIndex) ?? null,
  );

  readonly autoCategory = computed(() =>
    categorizeTransaction(this.transaction()?.transactionType ?? ''),
  );

  readonly selectedCategoryId = signal<string | null>(null);
  readonly noteValue = signal('');
  readonly applyToAll = signal(false);

  readonly successMessage = computed(() => {
    const count = this.appliedCount();
    if (count === null) {
      return 'Cambios guardados.';
    }
    if (count === 0) {
      return 'Cambios guardados. Se guardó la regla: no había otros movimientos con este tipo para actualizar ahora, pero los que subas de acá en más se van a categorizar solos.';
    }
    return `Cambios guardados. Se actualizaron ${count} movimiento${count === 1 ? '' : 's'} adicionales.`;
  });

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
    this.appliedCount.set(null);
    try {
      const categoryId = this.selectedCategoryId() ?? '';
      const transactions = await this.statementsService.updateTransaction(
        this.statementId,
        this.transactionIndex,
        {
          categoryId,
          note: this.noteValue().trim(),
          categorySource: categoryId ? 'manual' : undefined,
        },
      );
      this.statement.update((current) => (current ? { ...current, transactions } : current));
      this.saved.set(true);

      if (this.applyToAll() && categoryId) {
        await this.applyToOtherTransactions(categoryId);
      }
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.saving.set(false);
    }
  }

  private async applyToOtherTransactions(categoryId: string): Promise<void> {
    const transactionType = this.transaction()?.transactionType;
    if (!transactionType) {
      return;
    }

    await this.categoryRulesService.upsertRule(transactionType, categoryId);
    const applied = await this.statementsService.applyCategoryToMatchingTransactions(
      transactionType,
      categoryId,
    );
    this.appliedCount.set(applied);
  }
}
