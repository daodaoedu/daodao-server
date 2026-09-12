#!/usr/bin/env bash
set -euo pipefail

# Only initialize the disposable CI database. Never accept a database URL or
# production credentials; the caller supplies the local service container ID.
container_id=${1:?Usage: init-test-database.sh CONTAINER_ID SCHEMA_DIRECTORY}
schema_directory=${2:?Usage: init-test-database.sh CONTAINER_ID SCHEMA_DIRECTORY}
if [[ ! "$container_id" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]]; then
  echo "Invalid container ID" >&2
  exit 1
fi
shopt -s nullglob
schema_files=("$schema_directory"/*.sql)
if [[ ${#schema_files[@]} -eq 0 ]]; then
  echo "No canonical schema SQL files found" >&2
  exit 1
fi

table_count=$(docker exec "$container_id" psql -U test -d daodao_test -At \
  --set ON_ERROR_STOP=1 -c "SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');")
if [[ "$table_count" != 0 ]]; then
  echo "Refusing to initialize a non-empty test database" >&2
  exit 1
fi

for schema_file in "${schema_files[@]}"; do
  docker exec -i "$container_id" psql -U test -d daodao_test \
    --set ON_ERROR_STOP=1 < "$schema_file"
done
