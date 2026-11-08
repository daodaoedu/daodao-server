# Environment log isolation and reviewed rollout

This candidate configuration gives each service one external log leaf:

| Service | Candidate host source | Container target | Logger prefix |
| --- | --- | --- | --- |
| dev_app | `${DAODAO_LOG_ROOT:-/var/log/daodao-server}/dev` | `/app/logs` | dev |
| prod_app | `${DAODAO_LOG_ROOT:-/var/log/daodao-server}/prod` | `/app/logs` | prod |
| production_app | `${DAODAO_LOG_ROOT:-/var/log/daodao-server}/production` | `/app/logs` | prod |

Configuration is not a deployment record. Dev was deployed and verified at
`df7bd2ec19a1f78df70aa67a79732b72368f2fba` in
[CD42455862681](https://github.com/daodaoedu/daodao-server/actions/runs/42455862681).
The production candidate is local preparation, not an authorized live cutover.
The latest saved host inventory has `production_app` healthy on its old root
image and legacy bind; no `prod_app` container was present. Recheck this at the
window. Never start an inactive service merely to make a migration test green.
Historical dev/prod files stay in `/root/daodao-server/logs`; no automatic move,
delete, recursive chown or migration of rotation audit files is provided.

## Consumers and transitional reads

All consumers require `--env dev|prod|production|legacy`; omission fails before
external access. New selectors use the same external leaves as the table above.
`prod` and `production` share a filename prefix, **not a directory**. `legacy`
explicitly reads old immediate regular files at `/root/daodao-server/logs`.
A missing new source fails; it never falls back to legacy or another selector.
During the transition, use `--env legacy` to inspect unmigrated production
history, rather than claiming `--env production` already has live data.

Examples, only when the corresponding external read/install action is authorized:

```sh
bash scripts/log-monitor.sh --env production
bash scripts/download-logs.sh --env production
bash scripts/log-monitor.sh --env legacy
```

Downloads use SSH alias `daodao` and rsync into environment-specific local
snapshots. No scp fallback, remote delete, mirror-delete, symlink following or
recursive traversal is added. Existing ancestors are checked for symlinks;
external sources cannot nest under legacy or the known checkout. Unsafe root
syntax and relative paths are rejected. Export `DAODAO_LOG_ROOT` explicitly for
a separately reviewed override; it applies to all new environment selectors.

Before this revision reaches any shared checkout, inventory existing scoped
`prod`/`production` wrappers on every execution host/user. If any still backs up
legacy-writing production, migrate that schedule explicitly to `--env legacy`
under its own approval **before** updating its consumer code; after cutover,
explicitly switch it to the dedicated selector. A successful download from an
empty new leaf is not proof that current production is being backed up. Do not
silently fall back. Checking one user crontab does not cover other users or timers.

The cron installer is an actual write operation, not a test command. Review
installed entries before calling `scripts/other/setup-log-backup-cron.sh --env
production`. Per-environment wrappers pin the selector/root. Existing unscoped
schedules are not silently rewritten. Local tests deny real SSH, SMTP, rsync,
and cron operations. Uploader/R2/long-term archive enablement remains #509;
DuckDB tooling remains #510.

## Local contract and evidence

`sourceFor` accepts only the fixed service-to-leaf mapping in the table, rejects
checkout overlap, every other effective bind overlap, ambiguous paths and
symlink aliases. Operators must additionally check **all actual host container
mounts**, including non-Compose and physical bind aliases, against the proposed
source. Compose-only metadata cannot prove the host-wide boundary.

`prepare-log-directory.cjs` defaults to dry-run. The dedicated parent must
already exist, be root-owned and have no group/other write or special bits.
A missing parent is refused: separately review its exclusive preparation;
never chmod an existing shared parent. `--apply` creates only the selected new
leaf as UID/GID1000 mode0750. Existing matching leaves are idempotent, mismatches
are refused without repair. Other environment files and metadata stay intact.

All three deployment pairs use boundary/source/metadata checks before the
original UID1000 file-access probe:

- `APP_ENV=dev APP_SERVICE=dev_app`
- `APP_ENV=prod APP_SERVICE=prod_app`
- `APP_ENV=prod APP_SERVICE=production_app`

Do not rename production's env file or logger prefix to match the leaf name.
Host Python3 selects the exact service image from effective JSON; `config
--images` includes dependencies and is not a unique image selector. Candidate
image Node runs the guards, so host Node is not required. Missing Python,
source, unsafe metadata, invalid image, failed probe and INT/TERM abort before
stop/remove. Preflight never creates missing host sources. Candidate prod and
production binds explicitly set `bind.create_host_path: false`, so direct
Compose invocation also refuses a missing source. The existing dev bind and
its deployment preflight remain unchanged.

Focused tests cover mapping, selected-only initialization, metadata and alias
refusals, consumer scope, interruption and failure propagation. Three simultaneous
owned bind containers check cross-environment marker invisibility and preserved
legacy history. Separate fixture rehearsal covers startup/logging/readiness
failure and restoration of a pinned old image plus its actual runtime mount.
These are local mechanics, not proof that a real production rollout succeeded.

## Production window: prepare a reviewable operation first

1. Review the **entire** candidate application revision against the old running
   production revision, not just this log diff. Do not accidentally bundle every
   accumulated dev change into a supposedly configuration-only rollout. Freeze
   the candidate digest, allowed API smoke, maximum outage and rollback trigger.
   A single container stop/recreate has an outage; zero downtime is not promised.
2. Freeze overlapping CD work. Existing concurrency is per ref, while branches
   share a checkout/host. Preflight must inspect exactly the configuration that
   starts the service. Review CD disk/image cleanup before the window: it must
   not remove the only old image or rollback artifacts. This PR does not add a
   host-wide deployment lock or automatic rollback.
3. Read-only inventory: all running/stopped containers, actual UID/GID, image
   IDs/RepoDigests, every canonical/physical mount, log parent/leaf/file metadata,
   disk space, checkout, Compose overrides/project and installed log consumers.
   Save full old `docker inspect` and effective configuration in a protected
   root-only bundle **on the host**. Full runtime/env snapshots contain secrets;
   do not export them to a report or Git. The sanitized inventory alone cannot
   reconstruct the old runtime.
4. Retain the exact old image ID and verified registry digest or protected image
   archive. Confirm recovery survives the planned cleanup. A mutable production
   tag or a Compose checkout is not a rollback. Rehearse image plus env inputs,
   command/entrypoint, user, binds, network aliases, healthcheck and restart policy
   in an owned isolated fixture before a live cutover.
5. Stage the reviewed helpers and candidate effective JSON in a versioned,
   root-owned0700 directory outside the checkout. Record hashes. Check that the
   shared log parent already satisfies the contract; prepare only the selected
   new production leaf after explicit initialization approval. If inactive prod
   leaf preparation is also approved, treat it as a distinct selected operation;
   preparing it does not authorize starting `prod_app`.

   With host Node available, the reviewed CLI form is:

   ```sh
   node /srv/daodao-rollout/506/helpers/prepare-log-directory.cjs --config /srv/daodao-rollout/506/effective-compose.json --checkout /root/daodao-server --service production_app
   # Only after the selected host write is explicitly approved:
   node /srv/daodao-rollout/506/helpers/prepare-log-directory.cjs --config /srv/daodao-rollout/506/effective-compose.json --checkout /root/daodao-server --service production_app --apply
   ```

   Without host Node, use the already retained fixed candidate image, no pull,
   no network or Docker socket, read-only root filesystem and protected bundle.
   Bind required checkout/inventory paths read-only. Only for approved apply,
   mount the existing dedicated `/var/log/daodao-server` parent at the same
   absolute path RW; never grant all `/var/log` RW. The helper itself may create
   only the chosen leaf. Read back metadata and a bounded own-marker UID1000
   write/append/rename/cleanup, with other services still unchanged.
6. Run the selected production preflight while the old container is still
   healthy. Failure or cancellation must preserve it. Recheck candidate
   revision/config immediately before the separately approved cutover.
   Only the chosen `production_app` may be stopped/recreated. Existing CD may
   reload shared nginx and handle dependencies; review those effects explicitly.
   Do not claim an arbitrary `compose up` changes only one process.
7. After cutover, verify exact image/revision, UID/GID1000, leaf mount, readiness,
   approved normal API and own synthetic request marker in the new Winston log.
   Check rotation audit ownership/retention and actual files via the container-to-
   host bind mapping. Observe natural 20MB/daily rotation; a small separate
   synthetic rotation test is only mechanics evidence. Check all other mounts
   cannot see the new marker; compare dev identity/image/mount and legacy
   owner/mode/inode. Update consumers/cron only under their separate write scope.

## Abort, rollback and completion

Before stop, abort on any failed guard and retain the old service. After a failed
cutover, use the approved trigger to stop only the new production container,
keep its logs, restore the fixed old image and **complete original runtime**
from the protected snapshot. An old image may use root and legacy; recovery
restores that recorded state, while candidate checks never fall back to root.
Verify old readiness/API/logging and other services. If old runtime metadata or
logging is inconsistent, stop and escalate rather than chmod shared logs.

Never move live files, merge old/new rotation audits or mirror-delete history.
Record merge, deployment, live smoke, actual rotation and formal acceptance
separately. AC-01–04 remain required. No production window, global CD lock,
full-version upgrade approval, R2 backup or historical cleanup is implied by
this configuration. Keep #506 open until all applicable live evidence exists.
