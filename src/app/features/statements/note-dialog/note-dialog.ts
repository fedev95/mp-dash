import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { StatementsService } from '../../../core/services/statements.service';
import { IndexedTransaction } from '../../../core/models/account-statement.model';

/** Read/edit/delete modal for a single transaction's note. */
@Component({
  selector: 'app-note-dialog',
  imports: [DialogModule, ButtonModule, TextareaModule, MessageModule, FormsModule],
  templateUrl: './note-dialog.html',
})
export class NoteDialog {
  private readonly statementsService = inject(StatementsService);

  readonly statementId = input('');
  readonly transaction = input<IndexedTransaction | null>(null);
  readonly visible = model(false);
  readonly updated = output<IndexedTransaction[]>();

  readonly noteValue = signal('');
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.noteValue.set(this.transaction()?.note ?? '');
        this.errorMessage.set(null);
      }
    });
  }

  async save(): Promise<void> {
    await this.persist(this.noteValue().trim());
  }

  async removeNote(): Promise<void> {
    await this.persist('');
  }

  private async persist(note: string): Promise<void> {
    const tx = this.transaction();
    if (!tx) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    try {
      const transactions = await this.statementsService.updateTransaction(
        this.statementId(),
        tx.id,
        {
          note,
        },
      );
      this.updated.emit(transactions);
      this.visible.set(false);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.saving.set(false);
    }
  }
}
