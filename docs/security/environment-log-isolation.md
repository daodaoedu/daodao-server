# Dev log isolation: reviewed rollout plan

This change moves only `dev_app` to `${DAODAO_LOG_ROOT:-/var/log/daodao-server}/dev:/app/logs`.
`prod_app` and `production_app` retain `./logs:/app/logs` (the deployed checkout's
legacy `/root/daodao-server/logs`). Both use the `prod` filename prefix and share
that physical directory. They are **not isolated from one another**. Historical
dev files remain in legacy; nothing is automatically moved, removed or repaired.
Full #506 AC and a production migration window remain outstanding.

## Consumers

Every consumer now requires `--env dev|prod|production|legacy`; omission fails
before external access. Repository callers are the logging guide and cron
installer; no application UI invokes these scripts. Existing installed cron
entries are unverified and must be reviewed during the authorized window.

| Selector | Source | Visible files |
| --- | --- | --- |
| dev | `${DAODAO_LOG_ROOT:-/var/log/daodao-server}/dev` | `dev-*.log*` |
| prod / production | `/root/daodao-server/logs` | `prod-*.log*` (shared) |
| legacy | `/root/daodao-server/logs` | all immediate regular files, including old dev history |

`bash scripts/log-monitor.sh --env dev` reads host files and never creates a
missing directory. `bash scripts/download-logs.sh --env dev` downloads via SSH
alias `daodao` and rsync into `./logs/dev/<timestamp>-<pid>`. rsync is required;
there is no unfiltered scp fallback, recursive traversal, symlink following,
remote delete or mirror deletion. gzip decompression affects only the selected
local download; compressed copies remain. `other/` entrypoints delegate to the
same implementation. All existing source ancestors are checked for symlinks before reads, locally
and by a metadata-only remote shell check. Dev overrides cannot nest under
legacy or the known checkout; relative/dot/double-slash paths are rejected.
`DAODAO_LOG_ROOT` must be explicitly exported to select an
approved nondefault dev root; missing dev never falls back to legacy.

`bash scripts/other/setup-log-backup-cron.sh --env dev` is a real installation
operation: it creates a per-environment wrapper and pins both selector and root.
The execution log remains local `logs/cron-backup.log`. Review old schedules
before installation; an old unscoped wrapper will now fail until replaced. The
installer replaces only a matching new per-environment wrapper entry, allowing
separate schedules. Do not execute it during local verification: tests use stub
crontab, SSH and rsync only. No SMTP, environment-file or live-log access is
needed for these consumer tests.

## Dev-only host window (plan only; not executed)

1. Obtain the host window and record checkout canonical path, candidate image
   digest, old running container ID and exact old image digest. Save `docker
   inspect` JSON for dev **and both production services**, including every mount
   (type/source/destination/read-only), image, UID and runtime settings. Capture
   effective Compose JSON with the same approved environment and override files
   used by CD. Protect snapshots as operational data; do not commit secrets.
   Snapshot old Compose/configuration and retain the old image locally. Capture
   owner/group/mode and canonical paths of legacy logs, their parent, all other
   bind sources and new root. Confirm new dev leaf is outside checkout and has
   no ancestor/descendant overlap or symlink alias with any other service mount.
2. Review the full inventory, including non-Compose containers. New parent root
   must be root-owned and not group/other writable, so UID 1000 cannot rename
   leaves or modify another environment. Never recursively chown/chmod a shared
   root or legacy logs. Only the new dedicated dev leaf may become `1000:1000`
   mode `0750`. If a parent is missing, review the tool's root-owned `0755`
   parent creation separately; no existing parent is repaired automatically.
3. Run the initializer **on the actual deployment host**, after steps 1–2.
   Before merging, the approved host window must stage the reviewed PR helpers
   in a separate protected `/srv/daodao-rollout/506/helpers` bundle (initializer
   and its sibling guard, with hashes checked against the reviewed PR). This
   does not replace the running checkout or start an app. Generate the candidate
   effective JSON from the reviewed Compose file with the actual host project
   directory and approved env/override files; keep the old effective snapshot
   separately. Do not assume the old checkout already contains these new tools.
   The fixed retained image below supplies Node only; it need not contain the
   new helper files. Prepare and read back the new directory before merge/CD.
   If merge happens first, an expected missing-directory preflight failure must
   preserve old dev; authorized preparation and a later CD retry are still
   required. Never treat merge as authorization to create the directory.
   A workstation cannot validate host paths: the tool calls `lstat`/`stat` on its
   own filesystem. First manually resolve and review the complete mount/ancestor
   inventory (including containers outside Compose). Unknown paths, unresolved
   aliases or symlinks block this step; a container view cannot establish facts
   about host ancestors hidden by bind mounts.

   If the host already has Node, use its existing Node without installing a new
   runtime. These commands run on the host, with the captured config at its real
   protected snapshot path:

   ```sh
   cd /root/daodao-server
   node /srv/daodao-rollout/506/helpers/prepare-log-directory.cjs --config /srv/daodao-rollout/506/effective-compose.json --checkout /root/daodao-server --service dev_app
   # Only after separate approval, as root on this same host:
   node /srv/daodao-rollout/506/helpers/prepare-log-directory.cjs --config /srv/daodao-rollout/506/effective-compose.json --checkout /root/daodao-server --service dev_app --apply
   ```

   Alternatively use Node from the **already pulled fixed candidate image**.
   The following is a reviewable host command for the default `/var/log` root
   and canonical `/root/daodao-server` checkout. It assumes `/root`, `/var/log`
   and `/srv/daodao-rollout/506` already exist and were manually checked for
   aliases. The snapshot directory is root-owned and protected. Adapt every
   literal path from the reviewed inventory before approval; do not run this
   unchanged for a custom log root or checkout. No host Node install is needed.

   ```bash
   # Host shell; set this to the exact locally retained candidate digest.
   : "${CANDIDATE_IMAGE:?set the reviewed already-pulled image digest}"
   case "$CANDIDATE_IMAGE" in *@sha256:*) ;; *) echo 'Digest required' >&2; exit 1;; esac
   # Add EVERY effective bind outside the three trees mounted below, at its
   # exact reviewed canonical host path. Example syntax only:
   EXTRA_RO=()
   # EXTRA_RO+=(--mount type=bind,src=/data/other,dst=/data/other,readonly)
   # Empty is valid ONLY if the full inventory proves no other paths exist.
   INIT_ARGS=(--config /srv/daodao-rollout/506/effective-compose.json --checkout /root/daodao-server --service dev_app)
   COMMON=(--rm --pull never --network none --read-only --user 0:0
     --mount type=bind,src=/root,dst=/root,readonly
     --mount type=bind,src=/srv/daodao-rollout/506,dst=/srv/daodao-rollout/506,readonly
     --workdir /root/daodao-server --entrypoint node)
   # Default dry-run: host log parent and all legacy/checkout/snapshot data RO.
   docker run "${COMMON[@]}" "${EXTRA_RO[@]}" \
     --mount type=bind,src=/var/log,dst=/var/log,readonly \
     "$CANDIDATE_IMAGE" /srv/daodao-rollout/506/helpers/prepare-log-directory.cjs "${INIT_ARGS[@]}"
   # ONLY after explicit host apply approval: selected parent tree becomes RW.
   # /root (including legacy logs), checkout, snapshots and other binds stay RO.
   docker run "${COMMON[@]}" "${EXTRA_RO[@]}" \
     --mount type=bind,src=/var/log,dst=/var/log \
     "$CANDIDATE_IMAGE" /srv/daodao-rollout/506/helpers/prepare-log-directory.cjs "${INIT_ARGS[@]}" --apply
   ```

   Prefer the narrower existing `/var/log/daodao-server` parent bind at that
   same path when it already exists; `/var/log` is needed only to allow the
   explicitly reviewed creation of a missing root-owned parent. The initializer
   itself permits only the selected new dev leaf plus that missing parent;
   it never repairs existing metadata or changes legacy logs. This is a trusted
   reviewed helper running as root, so review its code and fixed image before
   granting any RW bind. Do not mount `/` or the Docker socket. Read-only mounts
   must not obscure an ancestor alias that was left unverified on the host.

   Expected dry-run JSON action is `would-create` or `unchanged`; refusal blocks
   the window. Read back actual parent/leaf metadata and every previous source
   after approved apply. Local fixtures must substitute their own canonical
   checkout/config/all-bind paths and disposable parent mount consistently;
   they prove command mechanics only, never host metadata or rollout readiness.
4. Pull/retain the candidate, validate effective Compose again, then run **before
   any stop/remove** from the host canonical checkout:

   ```sh
   APP_ENV=dev APP_SERVICE=dev_app sh scripts/preflight-container-logs.sh
   ```

   Host Python 3 (verified during preparation) selects the exact service image from effective JSON; a missing interpreter or invalid image aborts before stop/remove.
   This uses the candidate image's Node for boundary validation and a read-only
   metadata gate (dev leaf exactly UID/GID 1000 and mode 0750 without special
   bits; root-owned parent with no group/other write permission), then performs
   the read-only UID 1000 access probe. A missing source, unsafe boundary or
   unreadable rotation metadata blocks deployment with old dev still running.
   Preflight does not create the source. No new host Node dependency is needed
   for preflight. Review override-file handling against the deployment command.
5. Start only dev with the reviewed new mount. Verify real application readiness
   and a bounded dev request; confirm the actual Winston marker lands in new
   `dev-*-YYYY-MM-DD.log`. Check UID 1000 write, append and rename/rotation using
   an approved marker; inspect audit metadata and retention behavior. Do not
   inject failure into production or mistake a synthetic local HTTP probe for
   live API readiness. Confirm the marker cannot be seen through **any**
   production container mount. Old legacy dev history may still be visible.
6. Read back both production containers' IDs/images/mounts and host log metadata
   and compare to step 1. Verify their own existing logging still works without
   restarting or changing production. Any unexpected image/mount/metadata change
   blocks acceptance. Verify selected dev monitor/download/backup manually only
   after the corresponding external actions are authorized.
7. If preflight, startup, readiness, writes or rotation fail: retain evidence and
   both log locations. Before stopping a running old dev, prefer aborting the
   cutover. After a failed cutover, stop only the new dev, restore the captured
   **old image digest plus exact original mount/runtime configuration**, and
   restart dev from that snapshot. Merely checking out a Compose file is not a
   rollback. Verify old readiness and logging, production comparison, and retain
   new logs for diagnosis. Never mirror-delete or merge legacy/new directories.
   If old logging is blocked by permissions, stop and escalate; do not chmod
   production or run as root to force recovery.

Record each check and rollback outcome separately. Local disposable-container
rehearsal is evidence for mechanics only; host preparation, live deployment,
real application readiness and PM acceptance remain pending. Schedule the
prod/production separation as a separate reviewed window.
