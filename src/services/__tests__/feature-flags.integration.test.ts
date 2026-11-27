/** Opt-in PostgreSQL coverage in a dedicated local-only schema. */
import { Client } from 'pg';
jest.mock('../database/prisma.service', () => {
  const { PrismaClient } = jest.requireActual('../../../generated/prisma');
  const url = new URL(process.env.FEATURE_FLAGS_TEST_DATABASE_URL ?? 'postgresql://unused:unused@127.0.0.1:1/unused');
  if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Feature flag integration tests require a local database');
  url.searchParams.set('schema', 'feature_flags_service_v2_test');
  return { prisma: new PrismaClient({ datasources: { db: { url: url.toString() } } }) };
});
import { prisma } from '../database/prisma.service';
import { createFeatureFlag, getPublicFeatureFlags, listFeatureFlags, updateFeatureFlag } from '../feature-flags.service';
import type { UpdateFeatureFlagInput } from '../../validators/feature-flags.validator';
const localDatabase = process.env.FEATURE_FLAGS_TEST_DATABASE_URL;
const localSuite = localDatabase ? describe : describe.skip;
const actor = { adminId: 7, ipAddress: '127.0.0.1', userAgent: 'feature-v2-test' };
const config = (stage: UpdateFeatureFlagInput['stage'], organizationIds: number[] = []): UpdateFeatureFlagInput => ({ name: 'Feature', description: 'Description', stage, organizationIds });
localSuite('feature registry PostgreSQL release and transaction contract', () => {
  let client: Client;
  beforeAll(async () => {
    client = new Client({ connectionString: localDatabase }); await client.connect();
    await client.query(`CREATE SCHEMA feature_flags_service_v2_test;
      SET search_path = feature_flags_service_v2_test;
      CREATE TABLE users (id integer PRIMARY KEY, is_active boolean);
      CREATE TABLE organization (id integer PRIMARY KEY, status varchar(20));
      CREATE TABLE organization_members (organization_id integer REFERENCES organization(id), user_id integer REFERENCES users(id), PRIMARY KEY(organization_id,user_id));
      CREATE TABLE feature_flags (key varchar(64) PRIMARY KEY, name varchar(100) NOT NULL, description varchar(500) NOT NULL DEFAULT '', stage varchar(16) NOT NULL DEFAULT 'off' CHECK(stage IN ('off','alpha','beta','ga')), updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE feature_flag_organizations (feature_key varchar(64) REFERENCES feature_flags(key) ON DELETE CASCADE, organization_id integer REFERENCES organization(id) ON DELETE CASCADE, PRIMARY KEY(feature_key,organization_id));
      CREATE TABLE audit_logs (id serial PRIMARY KEY, admin_id integer NOT NULL CHECK (admin_id > 0), action_type text NOT NULL, target_resource text NOT NULL, target_id text, old_value jsonb, new_value jsonb, ip_address inet, user_agent text);`);
  });
  beforeEach(async () => {
    await client.query(`TRUNCATE feature_flag_organizations, feature_flags, audit_logs, organization_members, organization, users RESTART IDENTITY CASCADE;
      INSERT INTO users VALUES (1,true),(2,true),(3,true),(4,false),(5,true);
      INSERT INTO organization VALUES (10,'active'),(20,'active'),(30,'suspended');
      INSERT INTO organization_members VALUES (10,1),(20,2),(10,3),(20,3),(10,4),(30,5);`);
    await createFeatureFlag({ key: 'featureOne', name: 'Feature', description: '' }, actor);
  });
  afterAll(async () => {
    await prisma.$disconnect(); await client.query('DROP SCHEMA feature_flags_service_v2_test CASCADE'); await client.end();
  });
  it('registers arbitrary keys default-off, rejects duplicate creation and unknown updates', async () => {
    const created = await createFeatureFlag({ key: 'futureThirdFeature', name: 'Third', description: '' }, actor);
    expect(created).toMatchObject({ key: 'futureThirdFeature', stage: 'off', organizationIds: [] });
    expect(await getPublicFeatureFlags()).toEqual({ featureOne: false, futureThirdFeature: false });
    await expect(createFeatureFlag({ key: 'futureThirdFeature', name: 'Duplicate', description: '' }, actor)).rejects.toMatchObject({ statusCode: 409 });
    await expect(updateFeatureFlag('missing', config('ga'), actor)).rejects.toMatchObject({ statusCode: 404 });
  });
  test.each(['off', 'beta', 'ga'] as const)('%s follows global release semantics for all identities and contexts', async stage => {
    await updateFeatureFlag('featureOne', config(stage, [10]), actor);
    for (const [user, org] of [[undefined, undefined], [undefined, 10], [1, undefined], [1, 10], [1, 20], [2, 10], [3, 20], [4, 10], [5, 30]]) {
      expect(await getPublicFeatureFlags(user, org)).toEqual({ featureOne: stage !== 'off' });
    }
  });
  it('alpha requires active real membership in the exact currently selected allowlisted organization', async () => {
    await updateFeatureFlag('featureOne', config('alpha', [10]), actor);
    const cases: Array<[number | undefined, number | undefined, boolean]> = [
      [undefined, undefined, false], [undefined, 10, false], [1, undefined, false],
      [1, 10, true], [1, 20, false], [2, 10, false], [2, 20, false],
      [3, 10, true], [3, 20, false], [4, 10, false], [999, 10, false]
    ];
    for (const [user, org, expected] of cases) expect(await getPublicFeatureFlags(user, org)).toEqual({ featureOne: expected });
    // Adding another allowlisted organization still requires membership in that selected organization.
    await updateFeatureFlag('featureOne', config('alpha', [10, 20]), actor);
    expect(await getPublicFeatureFlags(3, 20)).toEqual({ featureOne: true });
    expect(await getPublicFeatureFlags(1, 20)).toEqual({ featureOne: false });
    expect(await getPublicFeatureFlags(3)).toEqual({ featureOne: false });
  });
  it('rechecks membership, account and organization status after removal/disable on subsequent reads', async () => {
    await updateFeatureFlag('featureOne', config('alpha', [10]), actor);
    expect((await getPublicFeatureFlags(1, 10)).featureOne).toBe(true);
    await client.query('DELETE FROM organization_members WHERE organization_id=10 AND user_id=1');
    expect((await getPublicFeatureFlags(1, 10)).featureOne).toBe(false);
    expect((await getPublicFeatureFlags(3, 10)).featureOne).toBe(true);
    await client.query('UPDATE users SET is_active=false WHERE id=3');
    expect((await getPublicFeatureFlags(3, 10)).featureOne).toBe(false);
    await client.query('UPDATE users SET is_active=true WHERE id=3; UPDATE organization SET status=\'suspended\' WHERE id=10');
    expect((await getPublicFeatureFlags(3, 10)).featureOne).toBe(false);
  });
  it('rejects unknown orgs at all stages and inactive alpha orgs without changing state or audit', async () => {
    const before = await listFeatureFlags();
    const auditBefore = (await client.query('SELECT count(*) FROM audit_logs')).rows[0].count;
    for (const input of [config('alpha', [999]), config('alpha', [10, 30]), config('ga', [999])]) {
      await expect(updateFeatureFlag('featureOne', input, actor)).rejects.toMatchObject({ statusCode: 400 });
    }
    expect(await listFeatureFlags()).toEqual(before);
    expect((await client.query('SELECT count(*) FROM audit_logs')).rows[0].count).toBe(auditBefore);
    // An inactive roster may be retained outside alpha, and never limits beta/ga.
    expect((await updateFeatureFlag('featureOne', config('ga', [30]), actor)).organizationIds).toEqual([30]);
    expect((await getPublicFeatureFlags()).featureOne).toBe(true);
  });
  it('atomically audits full metadata and roster; audit failure rolls back create and update', async () => {
    const changed = await updateFeatureFlag('featureOne', config('alpha', [10, 20]), actor);
    const audit = (await client.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 1')).rows[0];
    expect(audit.admin_id).toBe(7); expect(audit.old_value).toMatchObject({ stage: 'off', organizationIds: [] });
    expect(audit.new_value).toEqual(changed);
    await expect(updateFeatureFlag('featureOne', { ...config('ga', [30]), name: 'Will rollback' }, { adminId: -1 })).rejects.toThrow();
    expect(await listFeatureFlags()).toEqual([changed]);
    await expect(createFeatureFlag({ key: 'rollbackCreate', name: 'Rollback', description: '' }, { adminId: -1 })).rejects.toThrow();
    expect(await listFeatureFlags()).toEqual([changed]);
  });
  it('serializes concurrent full configuration writes into an accurate committed audit chain', async () => {
    await Promise.all([config('alpha', [10]), config('beta', [20]), config('ga', [10, 20]), config('off')].map(input => updateFeatureFlag('featureOne', input, actor)));
    const { rows } = await client.query("SELECT old_value, new_value FROM audit_logs WHERE action_type='feature_flag.update' ORDER BY id");
    expect(rows).toHaveLength(4);
    let previous = (await client.query("SELECT new_value FROM audit_logs WHERE action_type='feature_flag.create'")).rows[0].new_value;
    for (const row of rows) { expect(row.old_value).toEqual(previous); previous = row.new_value; }
    expect(await listFeatureFlags()).toEqual([previous]);
  });
});
