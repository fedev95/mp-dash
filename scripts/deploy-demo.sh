#!/bin/sh
# Builds the public demo with .env.demo and deploys it to Firebase Hosting, all inside Docker.
# The Firebase CLI login is kept in the "mp-dash-firebase-cli" Docker volume.
set -eu
cd "$(dirname "$0")/.."

if [ ! -f .env.demo ]; then
  echo "Missing .env.demo (copy .env.example and fill in the demo project's config)." >&2
  exit 1
fi

docker run --rm -it \
  --env-file .env.demo \
  -v "$PWD":/repo:ro,z \
  -v mp-dash-firebase-cli:/root/.config \
  -w /repo \
  node:22-alpine sh ./scripts/deploy-demo-container.sh
