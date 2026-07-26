#!/bin/sh
set -e

# A SPA cannot read process.env at runtime, so we generate the Angular
# environment file from the container's env vars (populated via .env)
# right before the dev server starts.
cat > src/environments/environment.ts <<EOF
export const environment = {
  production: false,
  firebase: {
    apiKey: '${FIREBASE_API_KEY}',
    authDomain: '${FIREBASE_AUTH_DOMAIN}',
    projectId: '${FIREBASE_PROJECT_ID}',
    storageBucket: '${FIREBASE_STORAGE_BUCKET}',
    messagingSenderId: '${FIREBASE_MESSAGING_SENDER_ID}',
    appId: '${FIREBASE_APP_ID}',
  },
};
EOF

echo "Generated src/environments/environment.ts from environment variables."

exec npx ng serve --host 0.0.0.0 --port 4200 --poll 2000 --hmr
