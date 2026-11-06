/** Read-only candidate report. Usage: pnpm exec ts-node scripts/report-cohort-resource-legacy.ts <binding-id> */
import { prisma } from '../src/services/database/prisma.service';
import { inspectLegacyCohortResourceLinks } from '../src/services/cohort-template-resources.service';

const bindingId = Number(process.argv[2]);
if (!Number.isSafeInteger(bindingId) || bindingId <= 0) throw new Error('請提供有效的 cohort_templates.id');
prisma.$transaction(async tx => {
  await tx.$executeRaw`SET TRANSACTION READ ONLY`;
  return inspectLegacyCohortResourceLinks(tx, bindingId);
}).then(rows => {
  process.stdout.write(JSON.stringify({ bindingId, status: 'candidates-require-human-review', rows }, null, 2) + '\n');
}).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : '報表失敗');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
