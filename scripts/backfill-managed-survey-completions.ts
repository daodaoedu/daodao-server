import { readFileSync } from 'fs';
import { Client } from 'pg';
import { deriveSurveyCompletionKey, parseSurveyCompletionHmacKey } from '../src/services/survey-completion-key';

/** Blinding and migration104 share one exclusive transaction; no intermediate plaintext-write window is committed. */
async function main(): Promise<void> {
  const secret = parseSurveyCompletionHmacKey(process.env.SURVEY_COMPLETION_HMAC_KEY);
  const args = process.argv.slice(2);
  const migrationIndex = args.indexOf('--migration');
  if (migrationIndex < 0 || !args[migrationIndex + 1]) throw new Error('Specify the reviewed migration104 SQL with --migration');
  const migration = readFileSync(args[migrationIndex + 1], 'utf8');
  if (!migration.includes('completion_key') || !/["]?user_id["]?\s+IS\s+NULL/i.test(migration)) throw new Error('Expected the reviewed completion-blinding migration104');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('An explicit DATABASE_URL is required');
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '10s'");
    const prerequisites = await client.query<{ column_name: string }>("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='managed_survey_completions'");
    const columns = prerequisites.rows.map(row => row.column_name);
    const version = await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveys' AND column_name='managed_version'");
    if (!columns.includes('survey_id') || !columns.includes('user_id') || columns.some(column => !['survey_id', 'user_id', 'completion_key'].includes(column)) || version.rowCount !== 1) throw new Error('Requires the reviewed migration103 completion schema');
    await client.query('LOCK TABLE managed_survey_completions IN ACCESS EXCLUSIVE MODE');
    await client.query('ALTER TABLE managed_survey_completions ADD COLUMN IF NOT EXISTS completion_key VARCHAR(64)');
    const primary = await client.query<{ conname: string }>("SELECT conname FROM pg_constraint WHERE conrelid='managed_survey_completions'::regclass AND contype='p'");
    for (const constraint of primary.rows) await client.query('ALTER TABLE managed_survey_completions DROP CONSTRAINT "' + constraint.conname.replace(/"/g, '""') + '"');
    await client.query('ALTER TABLE managed_survey_completions ALTER COLUMN user_id DROP NOT NULL');
    const rows = await client.query<{ survey_id: number; user_id: number | null; completion_key: string | null }>('SELECT survey_id,user_id,completion_key FROM managed_survey_completions FOR UPDATE');
    let blinded = 0;
    for (const row of rows.rows) {
      if (row.user_id === null) {
        if (!row.completion_key || !/^[0-9a-f]{64}$/.test(row.completion_key)) throw new Error('A row has no recoverable identity or valid opaque key; manual review is required');
        continue;
      }
      const key = deriveSurveyCompletionKey(row.survey_id, row.user_id, secret);
      if (row.completion_key !== null && row.completion_key !== key) throw new Error('A prior partial key does not match the configured stable key; no changes applied');
      const updated = await client.query('UPDATE managed_survey_completions SET completion_key=$1,user_id=NULL WHERE survey_id=$2 AND user_id=$3', [key, row.survey_id, row.user_id]);
      if (updated.rowCount !== 1) throw new Error('Unexpected duplicate completion rows; no changes applied');
      blinded++;
    }
    await client.query(migration);
    const apply = args.includes('--apply');
    await client.query(apply ? 'COMMIT' : 'ROLLBACK');
    console.log(JSON.stringify({ applied: apply, total_rows: rows.rowCount, blinded_rows: blinded, preserved_opaque_rows: rows.rows.length - blinded }));
  } catch {
    await client.query('ROLLBACK');
    // Database errors may contain row values or parameters; never print the original error.
    throw new Error('Completion backfill failed; transaction rolled back. Inspect schema/configuration without logging identities or key material.');
  } finally {
    await client.end();
  }
}
main().catch(() => { console.error('Completion backfill unavailable or rejected; no partial migration was committed. Check prerequisites without logging secrets.'); process.exitCode = 1; });
