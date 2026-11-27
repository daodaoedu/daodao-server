import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { BadRequestError, ConflictError, NotFoundError } from '../middleware/error.middleware';
import type { AdminFeatureFlag, CreateFeatureFlagInput, UpdateFeatureFlagInput } from '../validators/feature-flags.validator';

type FlagRow = { key: string; name: string; description: string; stage: AdminFeatureFlag['stage']; organization_ids: number[]; updated_at: Date };
type AuditActor = { adminId: number; ipAddress?: string; userAgent?: string };
type Reader = Pick<Prisma.TransactionClient, '$queryRaw'>;

/** Map database metadata to the administrative API contract. */
const asFlag = (row: FlagRow): AdminFeatureFlag => ({
  key: row.key, name: row.name, description: row.description, stage: row.stage,
  organizationIds: row.organization_ids, updatedAt: row.updated_at.toISOString()
});
/** Read registry metadata and sorted per-feature organization lists. */
async function readFlags(db: Reader, key?: string): Promise<AdminFeatureFlag[]> {
  const rows = await db.$queryRaw<FlagRow[]>(Prisma.sql`
    SELECT f.*, ARRAY(SELECT organization_id FROM feature_flag_organizations WHERE feature_key = f.key ORDER BY organization_id) AS organization_ids
    FROM feature_flags f ${key === undefined ? Prisma.empty : Prisma.sql`WHERE f.key = ${key}`} ORDER BY f.key
  `);
  return rows.map(asFlag);
}
/** List the extensible registry. Database errors are never turned into success. */
export async function listFeatureFlags(): Promise<AdminFeatureFlag[]> {
  return readFlags(prisma);
}
/** Evaluate only the explicitly selected organization, never another membership. */
export async function getPublicFeatureFlags(userId?: number, organizationId?: number): Promise<Record<string, boolean>> {
  const rows = await prisma.$queryRaw<Array<{ key: string; enabled: boolean }>>`
    SELECT f.key, (f.stage IN ('beta', 'ga') OR (f.stage = 'alpha' AND EXISTS (
      SELECT 1 FROM feature_flag_organizations a
      JOIN organization o ON o.id = a.organization_id AND o.status = 'active'
      JOIN organization_members m ON m.organization_id = o.id AND m.user_id = ${userId ?? null}::integer
      JOIN users u ON u.id = m.user_id AND u.is_active = true
      WHERE a.feature_key = f.key AND o.id = ${organizationId ?? null}::integer
    ))) AS enabled FROM feature_flags f ORDER BY f.key
  `;
  return Object.fromEntries(rows.map(row => [row.key, row.enabled]));
}
/** Write metadata and roster snapshots in the same transaction as the change. */
async function audit(tx: Prisma.TransactionClient, action: string, key: string, before: AdminFeatureFlag | null, after: AdminFeatureFlag, actor: AuditActor): Promise<void> {
  await tx.$executeRaw`
    INSERT INTO audit_logs (admin_id, action_type, target_resource, target_id, old_value, new_value, ip_address, user_agent)
    VALUES (${actor.adminId}, ${action}, 'feature_flags', ${key},
      ${before ? JSON.stringify(before) : null}::jsonb, ${JSON.stringify(after)}::jsonb,
      ${actor.ipAddress ?? null}::inet, ${actor.userAgent ?? null})
  `;
}
/** Register an arbitrary supported identifier, initially off, atomically with audit. */
export async function createFeatureFlag(input: CreateFeatureFlagInput, actor: AuditActor): Promise<AdminFeatureFlag> {
  return prisma.$transaction(async tx => {
    const inserted = await tx.$queryRaw<Array<{ key: string }>>`
      INSERT INTO feature_flags (key, name, description, stage) VALUES (${input.key}, ${input.name}, ${input.description}, 'off')
      ON CONFLICT (key) DO NOTHING RETURNING key
    `;
    if (!inserted.length) throw new ConflictError('功能識別碼已存在');
    const [created] = await readFlags(tx, input.key);
    await audit(tx, 'feature_flag.create', input.key, null, created, actor);
    return created;
  });
}
/** Lock the feature then atomically replace its metadata, stage, roster and audit. */
export async function updateFeatureFlag(key: string, input: UpdateFeatureFlagInput, actor: AuditActor): Promise<AdminFeatureFlag> {
  return prisma.$transaction(async tx => {
    const locked = await tx.$queryRaw<Array<{ key: string }>>`SELECT key FROM feature_flags WHERE key = ${key} FOR UPDATE`;
    if (!locked.length) throw new NotFoundError('找不到功能');
    const [before] = await readFlags(tx, key);
    if (input.organizationIds.length) {
      const organizations = await tx.$queryRaw<Array<{ id: number; status: string }>>(Prisma.sql`
        SELECT id, status FROM organization WHERE id IN (${Prisma.join(input.organizationIds)}) FOR SHARE
      `);
      if (organizations.length !== input.organizationIds.length) throw new BadRequestError('組織不存在');
      if (input.stage === 'alpha' && organizations.some(org => org.status !== 'active')) throw new BadRequestError('Alpha組織必須啟用');
    }
    await tx.$executeRaw`UPDATE feature_flags SET name = ${input.name}, description = ${input.description}, stage = ${input.stage}, updated_at = clock_timestamp() WHERE key = ${key}`;
    await tx.$executeRaw`DELETE FROM feature_flag_organizations WHERE feature_key = ${key}`;
    if (input.organizationIds.length) {
      await tx.$executeRaw(Prisma.sql`INSERT INTO feature_flag_organizations (feature_key, organization_id) VALUES ${Prisma.join(input.organizationIds.map(id => Prisma.sql`(${key}, ${id})`))}`);
    }
    const [updated] = await readFlags(tx, key);
    await audit(tx, 'feature_flag.update', key, before, updated, actor);
    return updated;
  });
}
