import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor() {
    // PrimeNG only switches its own theme via an explicit `.dark` class on an
    // ancestor (darkModeSelector: '.dark' in app.config.ts) — it doesn't watch
    // prefers-color-scheme itself, unlike our Tailwind `dark:` utility classes.
    // Keep both in sync with the OS/browser preference.
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (isDark: boolean) =>
      document.documentElement.classList.toggle('dark', isDark);
    applyTheme(media.matches);
    media.addEventListener('change', (e) => applyTheme(e.matches));
  }
}
