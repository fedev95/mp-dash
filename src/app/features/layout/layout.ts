import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { Footer } from './footer/footer';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Sidebar, Footer],
  templateUrl: './layout.html',
})
export class Layout {}
