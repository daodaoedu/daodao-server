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

All current dev/prod/production Compose services bind `./logs:/app/logs`.
The image's directory ownership is hidden by that mount. The deployment owner
must check the exact host log directory and its existing files/rotation ACLs:
UID/GID 1000 needs directory traversal, creation and rotation permissions.
Coordinate ownership or a scoped ACL for that directory before deploying.
Do not use `chmod 777`, run the application as root or recursively change a
shared parent directory. This patch does not change any actual host directory.

For a new dedicated directory, the operator can provision it for UID/GID 1000
with mode 0750; existing logs require a reviewed migration/ACL plan. A root-owned
0755 directory is intentionally insufficient. If permissions are not prepared,
block deployment and retain the existing deployed image until they are ready.

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
