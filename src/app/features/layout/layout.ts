import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { Footer } from './footer/footer';
import { DemoBanner } from './demo-banner/demo-banner';
import { DEMO_MODE } from '../../core/utils/demo';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Sidebar, Footer, DemoBanner],
  templateUrl: './layout.html',
})
export class Layout {
  readonly demoMode = DEMO_MODE;
}
