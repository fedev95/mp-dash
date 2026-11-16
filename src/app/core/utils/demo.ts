import { environment } from '../../../environments/environment';

/** True on the public demo deployment (DEMO_MODE=true at build time). */
export const DEMO_MODE = environment.demoMode;

/** Fictitious statements served from public/samples, for trying out the demo. */
export const SAMPLE_STATEMENTS = [
  { label: 'Enero 2026', file: 'samples/demo-statement-2026-01.csv' },
  { label: 'Febrero 2026', file: 'samples/demo-statement-2026-02.csv' },
  { label: 'Marzo 2026', file: 'samples/demo-statement-2026-03.csv' },
];
