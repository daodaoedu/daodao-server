#!/bin/sh
# Read-only permissions probe on the selected service's actual bind mount.
set -eu
: "${APP_ENV:?APP_ENV is required}"
: "${APP_SERVICE:?APP_SERVICE is required}"
case "$APP_ENV:$APP_SERVICE" in
 dev:dev_app|prod:prod_app|prod:production_app) ;;
 *) echo 'Unexpected deployment environment/service pair' >&2; exit 1 ;;
esac
script_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
docker compose --env-file ".env.$APP_ENV" -f "${COMPOSE_FILE:-docker-compose.yaml}" \
 run --rm --no-deps -T --user 1000:1000 --entrypoint node "$APP_SERVICE" - \
 < "$script_dir/preflight-container-logs.cjs"
