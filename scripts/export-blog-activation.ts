import { writeFile } from 'node:fs/promises';
import { resolvePrivateActivationOutput } from './private-activation-output';
import { parseArgs } from 'node:util';
import { PrismaClient } from '../generated/prisma';
import { exportBlogActivationEvidence } from '../src/services/blog-activation-export.service';

/** Run with an explicitly provided read-only DSN; output is private, never a public article asset. */
async function main(): Promise<void> {
  const { values } = parseArgs({ options: { 'registered-since': { type: 'string' }, 'as-of': { type: 'string' }, 'instrumented-since': { type: 'string' }, output: { type: 'string' } } });
  const connection = process.env.BLOG_ACTIVATION_EXPORT_DATABASE_URL;
  if (!connection || !values.output) throw new Error('Explicit BLOG_ACTIVATION_EXPORT_DATABASE_URL and --output PRIVATE_JSON required');
  const output = await resolvePrivateActivationOutput(values.output, process.env.BLOG_ACTIVATION_EVIDENCE_ROOT);
  const db = new PrismaClient({ datasourceUrl: connection });
  try {
    const result = await exportBlogActivationEvidence(db, { registeredSince: values['registered-since'], asOf: values['as-of'], instrumentedSince: values['instrumented-since'] });
    await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
    console.log('Private activation evidence written; attribution is browser-reported context or unknown.');
  } finally { await db.$disconnect(); }
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Activation export failed'); process.exitCode = 1; });
