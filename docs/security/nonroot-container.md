# Non-root server container

The runtime image uses the official Node image's `node` user (UID/GID 1000).
Application code, dependencies and system files remain root-owned; `/app/logs`
and `/home/node/.pm2` are writable by the runtime identity. Build stages may
still run as root. There is no privileged startup or permission fallback.

Build and run the isolated regression smoke:

```sh
docker build -t daodao-server:nonroot .
sh scripts/test-nonroot-container.sh daodao-server:nonroot
```

The smoke uses no network, real credentials or database. It runs the image's
PM2 binary and actual ecosystem configuration with a synthetic entrypoint
mounted over `dist/src/server.js`. It verifies runtime UID, write boundaries,
PM2 startup, logs and bounded graceful shutdown. It also confirms that a
root-owned non-writable log mount is rejected. It does not establish full API,
provider integration or deployment readiness.

## Required before rollout

Candidate configuration binds each service to its dedicated `${DAODAO_LOG_ROOT:-/var/log/daodao-server}/{dev,prod,production}` leaf. Only dev has live cutover evidence; production initialization and cutover require a separate approved window.
Current live production still uses `./logs:/app/logs`; it has not been migrated by this candidate. Both production selectors keep the `prod-*` filename prefix, while candidate mounts are separate. Legacy dev history is retained. The image's
directory ownership is hidden by each mount. Prepare only the selected dedicated
leaf as UID/GID 1000 mode 0750, under a root-owned parent not writable by UID
1000. Never recursively change a shared parent or existing production logs.
Missing/unsafe sources block deployment; no root/chmod fallback is allowed.

See [environment log isolation](environment-log-isolation.md) for the exact
initializer CLI, preflight, snapshot, per-service cutover and rollback plan. Those
host operations require a separately authorized window; local checks do not
prove host permissions or a completed rollout.

The CD workflow now runs `scripts/preflight-container-logs.sh` after pulling the
candidate and before stopping/removing the old container. It uses the exact
Compose service mount and candidate image, overrides only the entrypoint and
UID/GID 1000, and starts no dependencies. The probe only checks access: log
directory read/write/traversal, current environment log files and associated
Winston rotation metadata. It does not create, delete or change permissions.
A failed probe leaves the existing container running. Directory access alone
does not prove real writes, quota capacity or rotation; the operator must still
verify those after an authorized rollout. A successful local disposable-volume
probe does not confirm the host directory is prepared.

The isolated smoke exits 130 on SIGINT and 143 on SIGTERM, then cleans up its
own resources. Cancellation cannot return a successful smoke result.

Unreadable/invalid rotation metadata fails closed. Empty or unclassified audit
metadata also requires write access because it may belong to this environment.
This conservative check can block deployment for shared metadata; it preserves
the existing service and never repairs permissions automatically. Only valid
metadata whose entries are all identifiable as another environment is exempt
from the write-access check.
