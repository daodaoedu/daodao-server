# 2026-06-23 Checkin Image Storage Audit

Goal: find today's `practice_checkins.image_urls` that point to `https://storage.daodao.so/checkins/%`, verify whether prod URLs return 404, and copy the same object key from `storage-dev` to prod when needed.

Status:
- `mcp__daodao_pg_prod` query attempts failed with `read ECONNRESET`.
- Fallback investigation in progress.
