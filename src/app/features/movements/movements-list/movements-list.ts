import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { StatementsService } from '../../../core/services/statements.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { IndexedTransaction, StatementDetail } from '../../../core/models/account-statement.model';
import { Category } from '../../../core/models/category.model';
import { ArsCurrencyPipe } from '../../../core/pipes/ars-currency.pipe';
import { AmountClassPipe } from '../../../core/pipes/amount-class.pipe';
import { IsoDatePipe } from '../../../core/pipes/iso-date.pipe';
import { formatPeriod } from '../../../core/utils/format-period';
import { effectiveCategory } from '../../../core/utils/effective-category';
import { NoteDialog } from '../../statements/note-dialog/note-dialog';

type Sign = 'all' | 'credit' | 'debit';

interface MovementRow extends IndexedTransaction {
  statementId: string;
  fileName: string;
  period: string;
  periodStart: string | null;
  categoryLabel: string;
  categoryColorValue: string | null;
}

function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-movements-list',
  imports: [
    TableModule,
    MessageModule,
    ButtonModule,
    CardModule,
    MultiSelectModule,
    DatePickerModule,
    SelectModule,
    InputTextModule,
    FormsModule,
    ArsCurrencyPipe,
    AmountClassPipe,
    IsoDatePipe,
    RouterLink,
    NoteDialog,
  ],
  templateUrl: './movements-list.html',
})
export class MovementsList implements OnInit {
  private readonly router = inject(Router);
  private readonly statementsService = inject(StatementsService);
  private readonly categoriesService = inject(CategoriesService);

  readonly statementDetails = signal<StatementDetail[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly noteTarget = signal<IndexedTransaction | null>(null);
  readonly noteTargetStatementId = signal('');
  readonly noteDialogVisible = signal(false);

  readonly selectedCategoryLabels = signal<string[]>([]);
  readonly searchText = signal('');
  readonly dateRange = signal<Date[] | null>(null);
  readonly sign = signal<Sign>('all');

  readonly signOptions: Array<{ label: string; value: Sign }> = [
    { label: 'Todos', value: 'all' },
    { label: 'Créditos', value: 'credit' },
    { label: 'Débitos', value: 'debit' },
  ];

  readonly rows = computed<MovementRow[]>(() => {
    const categories = this.categories();
    return this.statementDetails().flatMap((statement) =>
      statement.transactions.map((tx) => {
        const category = effectiveCategory(tx, categories);
        return {
          ...tx,
          statementId: statement.id,
          fileName: statement.fileName,
          period: formatPeriod(statement.periodStart),
          periodStart: statement.periodStart,
          categoryLabel: category.name,
          categoryColorValue: category.color,
        };
      }),
    );
  });

  readonly categoryOptions = computed(() => [...new Set(this.rows().map((r) => r.categoryLabel))].sort());

  readonly filteredRows = computed(() => {
    const categoryLabels = this.selectedCategoryLabels();
    const text = this.searchText().trim().toLowerCase();
    const [from, to] = this.dateRange() ?? [null, null];
    const sign = this.sign();

    return this.rows().filter((row) => {
      if (categoryLabels.length > 0 && !categoryLabels.includes(row.categoryLabel)) {
        return false;
      }
      if (
        text &&
        !row.transactionType.toLowerCase().includes(text) &&
        !(row.note ?? '').toLowerCase().includes(text)
      ) {
        return false;
      }
      if (from && row.releaseDate < toIsoDate(from)) {
        return false;
      }
      if (to && row.releaseDate > toIsoDate(to)) {
        return false;
      }
      if (sign === 'credit' && row.netAmount < 0) {
        return false;
      }
      if (sign === 'debit' && row.netAmount >= 0) {
        return false;
      }
      return true;
    });
  });

  get hasStatements(): boolean {
    return this.statementDetails().length > 0;
  }

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const [statementDetails, categories] = await Promise.all([
        this.statementsService.getAllStatementDetails(),
        this.categoriesService.listCategories(),
      ]);
      this.statementDetails.set(statementDetails);
      this.categories.set(categories);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.loading.set(false);
    }
  }

  clearFilters(): void {
    this.selectedCategoryLabels.set([]);
    this.searchText.set('');
    this.dateRange.set(null);
    this.sign.set('all');
  }

  openTransaction(row: MovementRow): void {
    this.router.navigate(['/statements', row.statementId, 'transactions', row.id]);
  }

  openNote(row: MovementRow, event: Event): void {
    event.stopPropagation();
    this.noteTarget.set(row);
    this.noteTargetStatementId.set(row.statementId);
    this.noteDialogVisible.set(true);
  }

  onNoteUpdated(transactions: IndexedTransaction[]): void {
    const statementId = this.noteTargetStatementId();
    this.statementDetails.update((all) =>
      all.map((s) => (s.id === statementId ? { ...s, transactions } : s)),
    );
  }
}
