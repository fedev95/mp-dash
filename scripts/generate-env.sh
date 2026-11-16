#!/bin/sh
# Writes src/environments/environment.ts from the FIREBASE_* and DEMO_MODE environment variables.
# A browser app can't read env vars at runtime, so this runs before `ng serve` / `ng build`.
set -eu

for var in FIREBASE_API_KEY FIREBASE_AUTH_DOMAIN FIREBASE_PROJECT_ID \
  FIREBASE_STORAGE_BUCKET FIREBASE_MESSAGING_SENDER_ID FIREBASE_APP_ID; do
  eval "value=\${$var:-}"
  if [ -z "$value" ]; then
    echo "Missing $var. Copy .env.example to .env and fill in your Firebase config." >&2
    exit 1
  fi
done

DEMO_MODE="${DEMO_MODE:-false}"
case "$DEMO_MODE" in
  true | false) ;;
  *)
    echo "DEMO_MODE must be true or false (got: $DEMO_MODE)." >&2
    exit 1
    ;;
esac

mkdir -p src/environments
cat > src/environments/environment.ts <<TS
export const environment = {
  demoMode: ${DEMO_MODE},
  firebase: {
    apiKey: '${FIREBASE_API_KEY}',
    authDomain: '${FIREBASE_AUTH_DOMAIN}',
    projectId: '${FIREBASE_PROJECT_ID}',
    storageBucket: '${FIREBASE_STORAGE_BUCKET}',
    messagingSenderId: '${FIREBASE_MESSAGING_SENDER_ID}',
    appId: '${FIREBASE_APP_ID}',
  },
};
TS

echo "Generated src/environments/environment.ts"
