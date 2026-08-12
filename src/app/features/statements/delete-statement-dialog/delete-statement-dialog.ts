import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { StatementsService } from '../../../core/services/statements.service';
import { periodCode } from '../../../core/utils/format-period';

/** Confirmation modal to delete a statement: the user must type its period (MM-AAAA) to confirm. */
@Component({
  selector: 'app-delete-statement-dialog',
  imports: [DialogModule, ButtonModule, InputTextModule, MessageModule],
  templateUrl: './delete-statement-dialog.html',
})
export class DeleteStatementDialog {
  private readonly statementsService = inject(StatementsService);

  readonly statement = input<{ id: string; periodStart: string | null } | null>(null);
  readonly visible = model(false);
  readonly deleted = output<string>();

  readonly inputValue = signal('');
  readonly deleting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly expectedPeriod = computed(() => periodCode(this.statement()?.periodStart ?? null));
  readonly isValid = computed(
    () => this.expectedPeriod() !== '' && this.inputValue() === this.expectedPeriod(),
  );

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const digits = target.value.replace(/\D/g, '').slice(0, 6);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
    target.value = formatted;
    this.inputValue.set(formatted);
  }

  async confirm(): Promise<void> {
    const id = this.statement()?.id;
    if (!id || !this.isValid()) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set(null);
    try {
      await this.statementsService.deleteStatement(id);
      this.deleted.emit(id);
      this.visible.set(false);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      this.deleting.set(false);
    }
  }

  reset(): void {
    this.inputValue.set('');
    this.errorMessage.set(null);
    this.deleting.set(false);
  }
}
