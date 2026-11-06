/**
 * Real Prisma/PostgreSQL regression for #276. Run only against a disposable DB:
 * COHORT_ORGANIZATION_TEST_DATABASE_URL=postgresql://.../daodao276_acl \
 * pnpm exec jest --runInBand --testMatch '<rootDir>/src/services/__tests__/cohort-organization-access.postgres.ts'
 * Bootstrap that database from canonical storage schema first. No shared data is used.
 */
jest.mock('../database/prisma.service', () => {
  const { PrismaClient } = jest.requireActual('../../../generated/prisma');
  return { prisma: new PrismaClient({ datasourceUrl: process.env.COHORT_ORGANIZATION_TEST_DATABASE_URL }) };
});
jest.mock('../comment.service', () => ({ commentService: { createComment: jest.fn(async (): Promise<{ data: { id: number; userId: number; content: string } }> => ({ data: { id: 1, userId: 27701, content: '鼓勵' } })) } }));
jest.mock('../ai-backend.client', () => ({ aiBackendClient: { isConfigured: (): boolean => false }, AiBackendError: class extends Error {} }));

import { prisma } from '../database/prisma.service';
import { cohortDashboardService } from '../cohort-dashboard.service';
import { cohortEncouragementService } from '../cohort-encouragement.service';
import { cohortExportService } from '../cohort-export.service';
import { cohortFeedService } from '../cohort-feed.service';
import { cohortFocusService } from '../cohort-focus.service';
import { cohortOutcomeService } from '../cohort-outcome.service';
import { cohortActivityService } from '../cohort-activity.service';
import { commentService } from '../comment.service';

const actor = 27701;
const learner = 27702;
const id = 27701;
const now = new Date('2026-11-05T00:00:00Z');
const cases = [
  ['outcome', (): Promise<unknown> => cohortOutcomeService.get(id, id, actor, now)],
  ['report export', (): Promise<unknown> => cohortOutcomeService.recordReportExport(id, id, actor, undefined, now)],
  ['learner export', (): Promise<unknown> => cohortExportService.exportOutcome(id, id, actor, now)],
  ['encouragement draft', (): Promise<unknown> => cohortEncouragementService.draft(id, id, id, actor)],
  ['encouragement submit', (): Promise<unknown> => cohortEncouragementService.submit(id, id, id, actor, '鼓勵')],
  ['dashboard', (): Promise<unknown> => cohortDashboardService.get(id, id, actor, {}, now)],
  ['participants', (): Promise<unknown> => cohortDashboardService.listParticipants(id, id, actor, { sort: 'nickname', order: 'asc' }, now)],
  ['focus', (): Promise<unknown> => cohortFocusService.get(id, id, actor, now)],
  ['coach feed', (): Promise<unknown> => cohortFeedService.get(id, actor, 20, 0, id)],
  ['activity list', async (): Promise<unknown> => {
    const response = await cohortActivityService.list(id, id, actor, { hasText: false, limit: 50, offset: 0 }, now);
    expect(response.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: String(id), summary: '組織私密打卡' })]));
    return response;
  }],
  ['activity detail', async (): Promise<unknown> => {
    const response = await cohortActivityService.get(id, id, actor, 'checkin', String(id), now);
    expect(response).toMatchObject({ id: String(id), detail: '組織私密打卡' });
    return response;
  }]
] as const;

beforeAll(async () => {
  const value = process.env.COHORT_ORGANIZATION_TEST_DATABASE_URL;
  if (!value || !['127.0.0.1', 'localhost'].includes(new URL(value).hostname) || new URL(value).pathname !== '/daodao276_acl') throw new Error('Use the disposable daodao276_acl database explicitly');
  const statements = [
    'TRUNCATE contacts, users, organization, programs, cohorts, practices, practice_checkins RESTART IDENTITY CASCADE',
    "INSERT INTO roles (id, name) VALUES (2, 'User') ON CONFLICT DO NOTHING",
    "INSERT INTO contacts (id,email) VALUES (27701,'acl-owner@example.invalid'),(27702,'acl-learner@example.invalid')",
    "INSERT INTO users (id,external_id,mongo_id,nickname,role_id,contact_id,tag_list,verified,is_active,is_open_profile,custom_id) VALUES (27701,'00000000-0000-4000-8000-000000027701','acl27701','測試成員',2,27701,ARRAY[]::text[],true,true,true,'acl27701'),(27702,'00000000-0000-4000-8000-000000027702','acl27702','測試學員',2,27702,ARRAY[]::text[],true,true,true,'acl27702')",
    "INSERT INTO organization (id,name,status,timezone) VALUES (27701,'ACL 組織','active','Asia/Taipei')",
    "INSERT INTO programs (id,organization_id,name,kind) VALUES (27701,27701,'ACL 系列','lighthouse')",
    "INSERT INTO cohorts (id,program_id,slug,display_name,start_date,end_date,status,visibility) VALUES (27701,27701,'acl-cohort','ACL 場次','2026-10-01','2026-12-31','published','private')",
    "INSERT INTO practices (id,external_id,user_id,title,practice_action,cohort_id,status,privacy_status,visibility,start_date,end_date,practice_time_periods) VALUES (27701,'00000000-0000-4000-8000-000000037701',27702,'ACL 實踐','練習',27701,'active','private','private','2026-10-01','2026-12-31',ARRAY[]::text[])",
    "INSERT INTO practice_checkins (id,practice_id,user_id,checkin_date,note,image_urls,created_at) VALUES (27701,27701,27702,'2026-11-01','組織私密打卡',ARRAY[]::text[],'2026-11-01')"
  ];
  for (const statement of statements) await prisma.$executeRawUnsafe(statement);
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe("UPDATE organization SET status='active' WHERE id=27701");
  await prisma.$executeRawUnsafe('DELETE FROM organization_members WHERE organization_id=27701');
  await prisma.$executeRawUnsafe("INSERT INTO organization_members (organization_id,user_id,role) VALUES (27701,27701,'owner')");
  await prisma.$executeRawUnsafe('DELETE FROM cohort_enrollments WHERE cohort_id=27701');
  await prisma.$executeRawUnsafe("INSERT INTO cohort_enrollments (cohort_id,user_id,status,role) VALUES (27701,27702,'joined','member')");
});

afterAll(async () => { await prisma.$disconnect(); });

describe('organization membership and suspension at the actual PostgreSQL boundary', () => {
  it.each(cases)('allows an active member to use %s', async (_name, invoke) => {
    await expect(invoke()).resolves.toBeDefined();
  });

  it.each(cases)('denies %s after suspension despite existing membership', async (_name, invoke) => {
    await prisma.$executeRawUnsafe("UPDATE organization SET status='suspended' WHERE id=27701");
    await expect(invoke()).rejects.toMatchObject({ statusCode: 403 });
    expect(commentService.createComment).not.toHaveBeenCalled();
  });

  it.each(cases)('denies %s immediately after membership removal', async (_name, invoke) => {
    await prisma.$executeRawUnsafe('DELETE FROM organization_members WHERE organization_id=27701');
    await expect(invoke()).rejects.toMatchObject({ statusCode: 403 });
    expect(commentService.createComment).not.toHaveBeenCalled();
  });

  it('does not promote an enrolled member of a suspended organization to coach', async () => {
    await prisma.$executeRawUnsafe("UPDATE organization SET status='suspended' WHERE id=27701");
    await prisma.$executeRawUnsafe("INSERT INTO cohort_enrollments (cohort_id,user_id,status,role) VALUES (27701,27701,'joined','member')");
    await expect(cohortFeedService.get(id, actor, 20, 0, id)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('preserves joined learners access and learner perspective when the organization is suspended', async () => {
    await prisma.$executeRawUnsafe("UPDATE organization SET status='suspended' WHERE id=27701");
    await expect(cohortFeedService.get(id, learner, 20, 0)).resolves.toMatchObject({
      perspective: 'learner', total: 1, items: [expect.objectContaining({ note: '組織私密打卡' })]
    });
  });

  it('does not expose the feed to an outsider', async () => {
    await expect(cohortFeedService.get(id, 27703, 20, 0)).rejects.toMatchObject({ statusCode: 403 });
  });
});
