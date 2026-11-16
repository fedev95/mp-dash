import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Slim notice shown on every page of the public demo. */
@Component({
  selector: 'app-demo-banner',
  imports: [RouterLink],
  template: `
    <div
      role="note"
      class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 rounded-xl text-sm bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
    >
      <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
      <span>Demo pública: no subas tus resúmenes reales. Los datos pueden borrarse.</span>
      <a routerLink="/documents" class="font-medium underline">Probá con los archivos de ejemplo</a>
    </div>
  `,
})
export class DemoBanner {}
