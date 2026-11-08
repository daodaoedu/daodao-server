#!/bin/bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/log-consumer-scope.sh"
log_consumer_scope "$@"
log_consumer_directory_guard "$LOG_DIR"
shopt -s nullglob
if [ -n "$LOG_PREFIX" ]; then
    files=("$LOG_DIR/$LOG_PREFIX"-*.log*)
    errors=("$LOG_DIR/$LOG_PREFIX"-error-*.log)
else
    files=("$LOG_DIR/"*)
    errors=("$LOG_DIR/"*-error-*.log)
fi
printf 'Environment: %s\nSource: %s\n=== Log File Sizes ===\n' "$LOG_ENV" "$LOG_DIR"
for file in "${files[@]}"; do [ ! -f "$file" ] || [ -L "$file" ] || du -h "$file"; done
printf '\n=== Recent Errors ===\n'
for file in "${errors[@]}"; do [ ! -f "$file" ] || [ -L "$file" ] || tail -n 5 "$file"; done
printf '\n=== Log Rotation Status (selected files) ===\n'
for file in "${files[@]}"; do [ ! -f "$file" ] || [ -L "$file" ] || ls -lah "$file"; done
