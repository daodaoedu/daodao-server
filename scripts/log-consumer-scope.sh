#!/bin/bash
# Sourced by log consumers. No filesystem or remote mutation.
log_consumer_scope() {
    if [ "$#" -ne 2 ] || [ "$1" != '--env' ]; then
        echo 'Usage: --env dev|prod|production|legacy (required)' >&2; return 2
    fi
    LOG_ENV=$2
    case "$LOG_ENV" in
        dev) LOG_DIR="${DAODAO_LOG_ROOT:-/var/log/daodao-server}/dev"; LOG_PREFIX=dev ;;
        prod|production) LOG_DIR="${DAODAO_LOG_ROOT:-/var/log/daodao-server}/$LOG_ENV"; LOG_PREFIX=prod ;;
        legacy) LOG_DIR=/root/daodao-server/logs; LOG_PREFIX='' ;;
        *) echo 'Invalid --env: use dev|prod|production|legacy' >&2; return 2 ;;
    esac
    # Paths enter remote shell commands: reject shell syntax and relative/ambiguous paths.
    case "$LOG_DIR" in /*) ;; *) echo 'Log root must be absolute' >&2; return 2;; esac
    case "$LOG_DIR" in *[!a-zA-Z0-9_./-]*|*/../*|*/./*|*//*|*/..) echo 'Unsafe log root' >&2; return 2;; esac
    if [ "$LOG_ENV" != legacy ]; then
        local consumer_checkout
        consumer_checkout=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P) || return 2
        case "$LOG_DIR/" in
            /root/daodao-server/*|"$consumer_checkout/"*) echo 'Log source overlaps checkout/legacy tree' >&2; return 2 ;;
        esac
    fi
}

# Metadata-only: reject aliases at every existing ancestor, including missing leaves.
# This body is sent to the remote shell verbatim; it never reads log contents.
log_consumer_directory_guard() {
    consumer_checked_path=$1
    while [ "$consumer_checked_path" != / ]; do
        if [ -L "$consumer_checked_path" ]; then
            echo "Symlink log ancestor rejected: $consumer_checked_path" >&2
            return 1
        fi
        consumer_checked_path=${consumer_checked_path%/*}
        [ -n "$consumer_checked_path" ] || consumer_checked_path=/
    done
    [ -d "$1" ] || { echo "Selected log directory missing: $1" >&2; return 1; }
}
