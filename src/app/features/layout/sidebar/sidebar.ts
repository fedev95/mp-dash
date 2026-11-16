import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DeleteAccountDialog } from '../../account/delete-account-dialog/delete-account-dialog';

const STORAGE_KEY = 'sidebar-collapsed';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, DeleteAccountDialog],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.auth.currentUser;

  readonly links = [
    { label: 'Dashboard', icon: 'pi pi-home', path: '/' },
    { label: 'Movimientos', icon: 'pi pi-search', path: '/movements' },
    { label: 'Resúmenes', icon: 'pi pi-list', path: '/statements' },
    { label: 'Categorías', icon: 'pi pi-tags', path: '/categories' },
    { label: 'Cargar resúmenes', icon: 'pi pi-upload', path: '/documents' },
  ];

  readonly collapsed = signal(localStorage.getItem(STORAGE_KEY) === '1');
  readonly deleteAccountVisible = signal(false);

  toggle(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
