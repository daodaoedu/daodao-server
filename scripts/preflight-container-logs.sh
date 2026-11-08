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
# Validate effective metadata without requiring Node on the deployment host.
if [ "$APP_SERVICE" = dev_app ]; then
  compose_file=${COMPOSE_FILE:-docker-compose.yaml}
  config=$(mktemp)
  paths=$(mktemp)
  trap 'rm -f "$config" "$paths"' EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM
  docker compose --env-file ".env.$APP_ENV" -f "$compose_file" config --no-env-resolution --format json > "$config"
  # config --images includes dependency images, even with a service argument.
  # Python 3 is a verified host prerequisite; parse the exact effective service.
  image=$(python3 -c '
import json, re, sys
value = json.load(sys.stdin)["services"][sys.argv[1]]["image"]
if not isinstance(value, str) or not value or re.search(r"\s", value) or value.startswith("-"):
    raise ValueError("Invalid candidate image")
print(value)
' "$APP_SERVICE" < "$config")
  [ -n "$image" ] || { echo 'Missing candidate image' >&2; exit 1; }
  docker run --rm -i --network none --read-only --user 1000:1000 \
    --mount "type=bind,src=$script_dir/log-directory-guard.cjs,dst=/guard.cjs,readonly" \
    --entrypoint node "$image" /guard.cjs "$(pwd -P)" "$APP_SERVICE" --paths < "$config" > "$paths"
  [ -s "$paths" ] || { echo 'Empty boundary metadata' >&2; exit 1; }
  first=yes
  while IFS= read -r source; do
    [ -n "$source" ] || { echo 'Invalid source metadata' >&2; exit 1; }
    # Reject aliases in any bind source, including an ancestor of a missing leaf.
    current=$source
    while [ "$current" != / ]; do
      [ ! -L "$current" ] || { echo 'Symlink bind source rejected' >&2; exit 1; }
      current=$(dirname "$current")
    done
    if [ "$first" = yes ]; then
      [ -d "$source" ] || { echo 'Dev log source must already exist' >&2; exit 1; }
      dev_source=$source
      first=no
    fi
  done < "$paths"
  # --mount rejects absent sources; neither directory can be auto-created here.
  docker run --rm --network none --read-only --user 1000:1000 \
    --mount "type=bind,src=$script_dir/log-directory-metadata.cjs,dst=/metadata.cjs,readonly" \
    --mount "type=bind,src=$dev_source,dst=/log-leaf,readonly" \
    --mount "type=bind,src=$(dirname "$dev_source"),dst=/log-parent,readonly" \
    --entrypoint node "$image" /metadata.cjs /log-leaf /log-parent
fi
docker compose --env-file ".env.$APP_ENV" -f "${COMPOSE_FILE:-docker-compose.yaml}" \
 run --rm --no-deps -T --user 1000:1000 --entrypoint node "$APP_SERVICE" - \
 < "$script_dir/preflight-container-logs.cjs"
