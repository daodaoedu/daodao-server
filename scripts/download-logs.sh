#!/bin/bash
set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/log-consumer-scope.sh"
log_consumer_scope "$@"
REMOTE_HOST=daodao
# Timestamp directory contains only this invocation's downloaded copies.
LOCAL_LOG_DIR="./logs/$LOG_ENV/$(date +%Y-%m-%d_%H-%M-%S)-$$"
ssh -o ConnectTimeout=5 "$REMOTE_HOST" "$(declare -f log_consumer_directory_guard)
log_consumer_directory_guard '$LOG_DIR'" || { echo "Selected remote directory unavailable: $LOG_DIR" >&2; exit 1; }
command -v rsync >/dev/null || { echo 'rsync is required for bounded environment filtering' >&2; exit 1; }
mkdir -p "$LOCAL_LOG_DIR"
filters=()
if [ -n "$LOG_PREFIX" ]; then
    filters=(--include="/$LOG_PREFIX-*.log*" --exclude='*')
fi
# No --delete, --remove-source-files, recursive traversal or symlink following.
rsync -dtvz "${filters[@]}" "$REMOTE_HOST:$LOG_DIR/" "$LOCAL_LOG_DIR/"
shopt -s nullglob
for file in "$LOCAL_LOG_DIR/"*.gz; do gunzip -k "$file" || echo "Cannot unpack: $file" >&2; done
printf 'Environment: %s\nRemote source: %s\nLocal copy: %s\n' "$LOG_ENV" "$LOG_DIR" "$LOCAL_LOG_DIR" | tee "$LOCAL_LOG_DIR/download_summary.txt"
# Archives remain in the local copy. Remote data is never removed.
