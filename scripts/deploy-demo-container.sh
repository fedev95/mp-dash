#!/bin/sh
# Runs inside the container started by deploy-demo.sh. Builds in a private copy so the
# local environment.ts, node_modules and dist are never touched.
set -eu

if [ "${DEMO_MODE:-}" != "true" ]; then
  echo "DEMO_MODE must be true in .env.demo: this script only deploys the public demo." >&2
  exit 1
fi

mkdir -p /build
tar --exclude=./node_modules --exclude=./.angular --exclude=./dist --exclude=./.git \
  --exclude='./.env*' -cf - . | tar -xf - -C /build
cd /build

npm ci --no-fund --no-audit
sh ./scripts/generate-env.sh
npm run build
cp dist/mp-dash/3rdpartylicenses.txt dist/mp-dash/browser/

firebase="npx --yes firebase-tools@14.27.0"
$firebase login --no-localhost
$firebase deploy --only hosting,firestore:rules --project "$FIREBASE_PROJECT_ID"
