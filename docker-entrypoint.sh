#!/bin/sh
set -e

sh ./scripts/generate-env.sh
exec npx ng serve --host 0.0.0.0 --port 4200 --poll 2000 --hmr
