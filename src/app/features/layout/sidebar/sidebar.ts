import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly links = [
    { label: 'Dashboard', icon: 'pi pi-home', path: '/' },
    { label: 'Cargar resúmenes', icon: 'pi pi-upload', path: '/documents' },
  ];
}
