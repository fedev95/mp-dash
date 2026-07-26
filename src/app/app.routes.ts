import { Routes } from '@angular/router';
import { publicOnlyGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  { path: '**', redirectTo: 'login' },
];
