# Minimal production image hardening

This candidate retains the **actual deployed production artifact**, rather than
rebuilding its Git revision or upgrading to current dev. It only changes the
runtime user, PM2 home and ownership of two runtime directories. Production
initialization, registry publication and cutover require a separate approved
window; this document is not a deployment receipt.

## Fixed artifact and scope

`Dockerfile.production-hardening` starts from:

```text
vincentxxx/app@sha256:9f4e7c959e44be88340737494238e0cecab2b60fc56e2f646ee6e64d8b8647d8
```

The verified amd64 image ID is
`sha256:a2f913ba07668f19b1db7bc55457b1ef6b26951b88fd06598e539197db9f376f`.
The deployed tag was `production-4bd1ce56`, but the tag is not the artifact pin.
The actual generated Prisma schema hash differs from the checked-in Git
baseline; do not assume rebuilding that commit reproduces the deployed image.

No workspace source is copied. There is no package installation, compilation,
Prisma regeneration, schema migration, new feature, auth change or encryption
keyring requirement in this derivative. Original entrypoint, CMD, healthcheck,
ports, working directory and non-PM2 environment stay inherited. Application,
public assets, generated clients, Prisma files and dependencies are compared by
hash, symlink target and owner/mode metadata. Original filesystem layers remain
parents of the derivative.

Only `/home/node/.pm2` and `/app/logs` receive node ownership. There is no recursive
program-tree chown. Do not enable a read-only root filesystem as part of this
change: existing exports use `/tmp`, and PM2 needs its writable home. Program
paths retain their original metadata; runtime write-denial checks cover the
critical program locations.

## Build and repeat local verification

These commands act on local Docker only. Fetch the exact base if it is absent:

```sh
docker pull --platform linux/amd64 vincentxxx/app@sha256:9f4e7c959e44be88340737494238e0cecab2b60fc56e2f646ee6e64d8b8647d8
docker build --platform linux/amd64 --network none --pull=false -f Dockerfile.production-hardening -t daodao506-production-hardening:local .
node --test scripts/__tests__/production-image-hardening.test.cjs
```

The integration test requires that exact local base, builds a uniquely labeled
candidate and checks artifact equality, inherited runtime metadata, UID/GID1000,
PM2/logs/tmp writes and program write denial. A Linux volume's daemon mountpoint
is used as a real bind source for owner/mode refusal and acceptance. macOS file
sharing can emulate ownership and is not production permission evidence. The
test checks cleanup command results and absence of its labeled resources; it
never prunes shared Docker state. The base image and build cache may remain.

Actual application and manual rollback mechanics can be repeated separately:

```sh
# EVIDENCE_DIR must be outside the source checkout.
PRODUCTION_HARDENING_APP_TEST=1 PRODUCTION_HARDENING_EVIDENCE_DIR="$EVIDENCE_DIR" python3 scripts/test-production-hardening-app.py
```

Prerequisites: Python3, local Docker, the pinned base, retained local Postgres14
and Redis6.0-alpine images, and the repository's existing pnpm/Prisma CLI. The
script never pulls database or Redis images. It creates a private internal
network, synthetic DB/Redis, synthetic credentials and a new owned log leaf.
DDL comes from the **actual image's generated client** and is applied only to
this new disposable DB. It does not run migrations or queries against production.
Evidence, DDL and synthetic failure logs go outside the source checkout.

The inherited PM2 CMD starts the real application. To avoid starting one worker
for each of the test machine's 12 CPUs, only the test mounts a one-worker PM2
fixture; the image's own ecosystem file is unchanged. The test checks health200,
a unique404 request, real Winston output, UID1000, stable PM2 and permission
rejection while the healthy fixture remains available.

The rollback test is **manual isolated mechanics**, not automatic deployment
rollback: stop the owned fixture, observe a controlled candidate exit41, recreate
the old fixture using its fixed image ID and original config/mount, then verify
root runtime, retained synthetic history and health200. Environment equality
compares every effective key/value, rejects duplicates and records raw ordering;
Docker may return different array order without changing values. This is not a
snapshot/restoration test of the real production container, nginx, or every
production HostConfig/network setting.

Cleanup checks containers, volumes, networks and images by the unique run label,
checks command failures and records residue. No real recipients, OAuth tokens,
R2 credentials or business records are used. Fixture DB schema completeness does
not prove production schema compatibility. Documentation route status is compared
with the restored root baseline. Startup OpenAPI regeneration can emit a caught
write warning because program files stay root-owned; do not grant program write
access to suppress it. CSV/XLSX endpoint behavior and full-cluster load remain
window smoke items; the local filesystem probe only proves `/tmp` is writable. Existing legacy email-trigger/admin-
notification catalog gaps are unchanged, not repaired by this image.

## Production build/deploy path must be explicit

The normal CD still builds the regular `Dockerfile` from current source. It does
**not** select this derivative. Do not deploy current dev or run a production
branch release expecting it to use `Dockerfile.production-hardening`.

A reviewed minimal release must explicitly build this file, record the resulting
image ID/digest and artifact manifest, and use that image in the selected
production effective configuration. Registry push, host stage and execution are
separate steps. Old-image environment and app semantics remain; do not introduce
new app readiness-route assumptions merely because current dev has them. Before
a window, define liveness plus direct DB SELECT1 and Redis PING checks that are
compatible with the retained application and reveal no credentials.

Follow [environment isolation](environment-log-isolation.md) for selected leaf
provisioning and boundary/metadata/UID1000 preflight before stop. Host parent
must already be safe; only a new `/production` leaf1000:1000/0750 may be prepared
under its own authorization. Missing or unsafe sources fail; no shared chmod or
root fallback. An inactive `prod_app` must stay inactive.

Before cutover, freeze concurrent shared-checkout CD work, review cleanup and
retain a protected complete old runtime snapshot plus the fixed old image. Review
all actual consumer execution hosts/users; pending legacy backup schedules must
remain explicit legacy reads until separately migrated. A single production
container recreate can have an outage; the local test is not a zero-downtime or
full-cluster load result. Approve a concrete outage limit, failure trigger and
manual rollback before replacing it. Preserve both new logs and legacy history.

This image avoids the full dev application's missing keyring, migration and
startup-backlog requirements by retaining old code; it does not ship current
dev's other security/product fixes. Full application upgrades remain a distinct
release. #506 stays open until the real production window and required live
isolation, writes, normal API and rotation evidence are complete.


## Dedicated CI publisher

After `publish-production-hardening.yml` is merged into the default `dev`
branch, manually run **Publish verified production hardening image** on `dev`.
There are no release inputs. This workflow freezes the release definition at
`662bd2c96b22aa5ef86e92c1c22d081d8ab5c0d9` and the actual production base digest
specified above; merging newer application changes does not include them in this
image.

The verification job has no Docker Hub credentials. It builds only the derivative,
compares all 27,894 application artifact entries, runs isolated synthetic database
and Redis fixtures, and verifies controlled old-image restoration. It exports the
exact tested image with a checksum and run-bound receipt. Fixture dependencies and
Prisma generation run on the runner, never inside the release image.

A separate publishing job downloads that run's artifact and uses the existing
`DOCKER_HUB_USERNAME` and `DOCKER_HUB_ACCESS_TOKEN` repository secrets. It loads
and pushes the tested archive without rebuilding or running application code.
Only `vincentxxx/app:production-hardening-662bd2c96b22-ci-<run>-<attempt>` is
published. It then reads the registry config identity and pulls by digest to
confirm the tested image ID. Obtain the immutable reference from the
`production-hardening-publication-<run>-<attempt>` artifact's
`publication-receipt.json`; retain that receipt with the approved release record.
Workflow artifacts expire after seven days.

If a run fails, use **Re-run all jobs** or start a new manual run. Re-running only
the failed publishing job changes the attempt identity and cannot reuse an older
attempt's verification artifact. A failed remote verification does not authorize
cutover, even if the unique candidate tag was already pushed.

This workflow performs no SSH, host directory preparation, Compose changes or
production deployment. A successful publication makes a candidate available;
the production maintenance window and live acceptance remain separate.
