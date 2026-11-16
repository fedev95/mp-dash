import { Component, computed, inject, model, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AccountService } from '../../../core/services/account.service';

const CONFIRMATION_WORD = 'ELIMINAR';

/** Confirmation modal to delete the account and all its data: the user must type ELIMINAR. */
@Component({
  selector: 'app-delete-account-dialog',
  imports: [DialogModule, ButtonModule, InputTextModule, MessageModule],
  templateUrl: './delete-account-dialog.html',
})
export class DeleteAccountDialog {
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);

  readonly visible = model(false);

  readonly confirmationWord = CONFIRMATION_WORD;
  readonly inputValue = signal('');
  readonly deleting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly isValid = computed(() => this.inputValue().trim() === CONFIRMATION_WORD);

  onInput(event: Event): void {
    this.inputValue.set((event.target as HTMLInputElement).value);
  }

  async confirm(): Promise<void> {
    if (!this.isValid()) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set(null);
    try {
      await this.accountService.deleteAccount();
      this.visible.set(false);
      await this.router.navigate(['/login']);
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
