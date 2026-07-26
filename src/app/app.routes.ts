import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard } from './core/guards/auth.guard';

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
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/layout/layout').then((m) => m.Layout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/layout/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/upload/upload').then((m) => m.Upload),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
