# MP Dashboard

Personal finance dashboard for Mercado Pago account statements. Upload the monthly CSV export and get charts, categories and search across all your movements.

The UI is in Spanish (Argentina). This project is not affiliated with Mercado Pago.

## Features

- Sign in with email/password or Google (Firebase Auth).
- Upload monthly statement CSVs. Uploading a month that already exists asks before replacing it.
- Dashboard with the latest balance, credits and debits compared to the previous month, and charts by category and month.
- Per-statement analysis and transaction list, with notes on each movement.
- Custom categories, plus rules that categorize new movements by transaction type.
- Search movements across all statements.
- Each user's data is isolated by Firestore security rules.

## Tech stack

Angular 20, PrimeNG, Tailwind CSS 4, Chart.js, Firebase (Auth and Firestore), Docker and nginx.

## Requirements

- Docker with Docker Compose.
- A Firebase project with Firestore and Authentication (Email/Password and Google providers) enabled.

## Getting started

1. In the Firebase console, add a web app and copy its config.
2. Create your `.env` and fill in the `FIREBASE_*` values:

   ```bash
   cp .env.example .env
   ```

3. Publish the security rules: paste [`firestore.rules`](firestore.rules) into Firestore > Rules in the console, or run `firebase deploy --only firestore:rules`.
4. Start the dev server and open http://localhost:4200:

   ```bash
   docker compose up
   ```

The container generates `src/environments/environment.ts` from `.env` on startup. Both files are git-ignored.

## Scripts

Run them inside the container, for example `docker compose exec web npm run lint`.

| Script           | Description                                         |
| ---------------- | --------------------------------------------------- |
| `npm run build`  | Production build                                    |
| `npm test`       | Unit tests (Karma, needs Chrome or `CHROME_BIN`)    |
| `npm run lint`   | ESLint                                              |
| `npm run format` | Format with Prettier (`format:check` only verifies) |

CI runs format check, lint, tests, build and a Docker build on every push and pull request.

## Production image

The `prod` stage builds the app and serves it with nginx on port 80, with SPA routing and security headers (CSP included):

```bash
set -a; . ./.env; set +a
docker build --target prod \
  --build-arg FIREBASE_API_KEY --build-arg FIREBASE_AUTH_DOMAIN \
  --build-arg FIREBASE_PROJECT_ID --build-arg FIREBASE_STORAGE_BUCKET \
  --build-arg FIREBASE_MESSAGING_SENDER_ID --build-arg FIREBASE_APP_ID \
  -t mp-dash .
docker run -p 8080:80 mp-dash
```

Notes:

- The Firebase web config ends up in the bundle; that's expected. Restrict the API key by HTTP referrer in Google Cloud and consider enabling App Check.
- If you use a custom `authDomain`, add it to `frame-src` in [`nginx/default.conf`](nginx/default.conf).

## CSV format

The app reads Mercado Pago's account statement export: semicolon-separated, Argentine number format and `DD-MM-YYYY` dates.

```text
INITIAL_BALANCE;CREDITS;DEBITS;FINAL_BALANCE
1.000.000,00;505.000,50;-20.000,00;1.485.000,50

RELEASE_DATE;TRANSACTION_TYPE;REFERENCE_ID;TRANSACTION_NET_AMOUNT;PARTIAL_BALANCE
01-03-2026;Rendimientos;100000000001;5.000,50;1.005.000,50
05-03-2026;Transferencia enviada Ana Garcia;100000000002;-20.000,00;985.000,50
```

## Limitations

- Only the Mercado Pago account statement CSV is supported.
- Up to 3000 movements and 500 KB per statement, since each statement is stored as a single Firestore document (1 MiB max).
- Amounts are shown in ARS.
- Some dependency advisories remain until the move to Angular 21. See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
