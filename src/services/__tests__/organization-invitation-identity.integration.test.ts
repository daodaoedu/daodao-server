import '../../config/openapi-registry';
import { randomUUID } from 'crypto';
import { PrismaClient } from '../../../generated/prisma';

let mockLivePrisma: PrismaClient;
jest.mock('../database/prisma.service', () => ({ get prisma() { return mockLivePrisma; } }));
import { organizationInvitationService } from '../organization-invitation.service';

const namespace = `invitation_identity_${randomUUID().replace(/-/g, '')}`;
const db = new PrismaClient();
let createdSchema = false;

beforeAll(async () => {
  await db.$connect();
  // A private schema makes this independent of the canonical bootstrap's pinned storage revision.
  await db.$executeRawUnsafe(`CREATE SCHEMA "${namespace}"`);
  createdSchema = true;
  const url = new URL(process.env.DATABASE_URL as string);
  url.searchParams.set('schema', namespace);
  mockLivePrisma = new PrismaClient({ datasourceUrl: url.toString() });
  const fixtures = `
    CREATE TABLE organization (id INTEGER PRIMARY KEY);
    CREATE TABLE users (id INTEGER PRIMARY KEY, nickname TEXT, verified_login_email TEXT, contact_id INTEGER);
    CREATE TABLE contacts (id INTEGER PRIMARY KEY, email TEXT);
    CREATE TABLE organization_invitations (id INTEGER PRIMARY KEY, organization_id INTEGER, email TEXT,
      token_nonce TEXT, token_hash TEXT, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ,
      created_by INTEGER, accepted_at TIMESTAMPTZ, accepted_user_id INTEGER, revoked_at TIMESTAMPTZ);
    CREATE TABLE organization_invitation_requests (id INTEGER PRIMARY KEY, invitation_id INTEGER,
      user_id INTEGER, created_at TIMESTAMPTZ, approved_at TIMESTAMPTZ, approved_by INTEGER);
    CREATE TABLE organization_invitation_dispatches (invitation_id INTEGER PRIMARY KEY, status TEXT,
      attempts INTEGER, next_attempt_at TIMESTAMPTZ, lease_until TIMESTAMPTZ, sent_at TIMESTAMPTZ,
      message_id TEXT, last_error TEXT);
    INSERT INTO organization VALUES (1);
    INSERT INTO contacts VALUES (1, 'invited@example.com'), (2, 'another-contact@example.com');
    INSERT INTO users VALUES (1, 'Applicant', 'actual-login@example.com', 1), (2, 'Unverified', NULL, 2);
    INSERT INTO organization_invitations VALUES (1, 1, 'invited@example.com', 'nonce', 'hash',
      now()+interval '7 days', now(), 1, NULL, NULL, NULL);
    INSERT INTO organization_invitation_requests VALUES (1, 1, 1, now(), NULL, NULL), (2, 1, 2, now(), NULL, NULL);
  `;
  for (const statement of fixtures.split(';').map(sql => sql.trim()).filter(Boolean)) {
    await mockLivePrisma.$executeRawUnsafe(statement);
  }
}, 30000);

afterAll(async () => {
  await mockLivePrisma?.$disconnect();
  if (createdSchema) await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
  await db.$disconnect();
});

it('shows the verified login identity for approval, never a matching editable contact address', async () => {
  const invitations = await organizationInvitationService.list(1);
  expect(invitations[0].requests).toEqual([
    expect.objectContaining({ userId: 1, email: 'actual-login@example.com' }),
    expect.objectContaining({ userId: 2, email: null })
  ]);
  expect(JSON.stringify(invitations[0].requests)).not.toContain('invited@example.com');
  expect(JSON.stringify(invitations[0].requests)).not.toContain('another-contact@example.com');
});
