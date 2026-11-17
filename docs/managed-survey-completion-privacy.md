# Managed survey completion keys

A PostgreSQL reader can join `xmin` on answer and completion rows even when the application omits response IDs and timestamps. Managed completions therefore store `survey_id`, an opaque `completion_key`, and a deliberately NULL compatibility `user_id`. They do not store a member mapping, timestamp or response reference. The answer transaction can share `xmin` with an opaque completion, but that join no longer reveals which member completed it without the separate application secret.

`SURVEY_COMPLETION_HMAC_KEY` must be an independently generated, stable 32-byte value encoded as 64 hex characters. Store it only in the deployment secret manager, outside the database and logs. All API instances and the backfill must use exactly the same value. There is no JWT fallback. Missing/malformed configuration makes managed public reads, writes and feature operations unavailable; existing legacy questionnaires and #471 cohort-feedback paths retain their separate behavior. Admin metadata reads remain available for diagnosis.

The identifier is HMAC-SHA256(key, `daodao:managed-survey-completion:v1` + NUL + decimal survey ID + NUL + decimal member ID), encoded as lowercase hex. Do not rotate or replace this key as part of JWT/auth rotation. Existing opaque records cannot be recomputed after raw identities have been removed; changing the key would break deduplication and `has_responded`. Key rotation requires a separately reviewed design.

## Controlled upgrade from migration103

1. Back up the database and retain the key in the approved secret manager. Stop managed-survey traffic during the upgrade, including older API instances that still write raw IDs. Do not provision shared secrets from development scripts.
2. Set `DATABASE_URL` to the explicitly selected target and inject the same `SURVEY_COMPLETION_HMAC_KEY` into the backfill process. Do not pass the key on the command line or print the environment.
3. Preview with `pnpm exec ts-node -r tsconfig-paths/register scripts/backfill-managed-survey-completions.ts --migration ../daodao-storage/migrate/sql/104_blind_managed_survey_completions.sql`. Without `--apply`, the entire transaction is rolled back and only counts are reported.
4. Review the counts, then run the same command with `--apply`. The script locks the completion table, removes its old identity primary key, derives keys, nulls user IDs, and applies migration104 inside the same transaction. No unconstrained intermediate state is committed. A malformed partial key, duplicate or SQL failure rolls everything back. It neither deletes completion rows nor modifies responses/answers, so the same key preserves existing deduplication.
5. Roll out API instances with the stable key and migration104 Prisma contract. Verify authenticated deduplication/hasResponded, anonymous raw rows, and #471/legacy regression before reopening managed traffic.

Migration104 alone refuses any raw user IDs or missing/malformed opaque keys. It never wipes data or attempts to generate secrets in SQL. Reapplying the backfill to already blinded rows preserves them; it cannot certify that a differently configured but valid-looking key matches historical rows, so preserving the original secret remains an operational prerequisite.

This protects current SQL-visible records from identity inference through transaction metadata. It does not erase correlations already exported from the former schema or promise anonymity against an operator who can read both the application secret and the database.
