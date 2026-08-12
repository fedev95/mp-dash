import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

const STORAGE_KEY = 'sidebar-collapsed';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly links = [
    { label: 'Dashboard', icon: 'pi pi-home', path: '/' },
    { label: 'Cargar resúmenes', icon: 'pi pi-upload', path: '/documents' },
    { label: 'Resúmenes cargados', icon: 'pi pi-list', path: '/statements' },
    { label: 'Categorías', icon: 'pi pi-tags', path: '/categories' },
  ];

  readonly collapsed = signal(localStorage.getItem(STORAGE_KEY) === '1');

  toggle(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  }
}
