import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { initializeAppCheck, provideAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore/lite';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng, utilities',
          },
        },
      },
    }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // App Check (only when a site key is configured, i.e. on the public demo): Firebase rejects
    // requests that don't come from this app once enforcement is turned on in the console.
    ...(environment.appCheckSiteKey
      ? [
          provideAppCheck(() =>
            initializeAppCheck(getApp(), {
              provider: new ReCaptchaV3Provider(environment.appCheckSiteKey),
              isTokenAutoRefreshEnabled: true,
            }),
          ),
        ]
      : []),
    provideAuth(() => getAuth()),
    // Firestore Lite: the app only ever does one-shot reads/writes (no onSnapshot
    // listeners), so plain REST calls avoid the streaming WebChannel entirely —
    // sidesteps a connection-reset loop some network environments trigger on it.
    provideFirestore(() => getFirestore()),
  ],
};
