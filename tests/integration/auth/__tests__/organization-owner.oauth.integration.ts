import '../../../../src/config/openapi-registry';
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import request from 'supertest';
import nock from 'nock';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../../../../generated/prisma';
import { prisma } from '../../../../src/services/database/prisma.service';
import redis from '../../../../src/services/database/redis.service';
import { initializePassport } from '../../../../src/services/auth/oauth.service';
import authRoutes from '../../../../src/routes/auth.routes';
import organizationRoutes from '../../../../src/routes/organization.routes';
import userRoutes from '../../../../src/routes/user.routes';
import { jwtService } from '../../../../src/services/jwt.service';
import { globalErrorHandler } from '../../../../src/middleware/error.middleware';
import { emailService } from '../../../../src/services/email/email.service';
import { loggerService } from '../../../../src/services/logging/logger.service';

interface Account {
  id: number;
  email: string;
  subject: string;
}
interface State {
  redirectUrl: string;
  source: string;
  timestamp: number;
  nonce: string;
}
interface PendingInvitation {
  organizationId: number;
  invitationId: number;
  token: string;
}

const run = randomUUID().replace(/-/g, '');
const userIds: number[] = [];
const contactIds: number[] = [];
const organizationIds: number[] = [];
const temporarySubjects: string[] = [];
const createdRoleIds: number[] = [];
const nonces = new Set<string>();
const expectedSessions = new Map<number, number>();
let admin: Account;
let adminCookie: string;
let hasPersonaTable = false;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: process.env.SESSION_SECRET as string, resave: false, saveUninitialized: false }));
app.use(initializePassport());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/lighthouse', organizationRoutes);
app.use('/api/v1/users', userRoutes);
app.use(globalErrorHandler);
const server = http.createServer(app);

/** Poll observable async effects without starting production background workers. */
async function eventually<T>(read: () => Promise<T>, ready: (value: T) => boolean): Promise<T> {
  const deadline = Date.now() + 10000;
  let value: T;
  do {
    value = await read();
    if (ready(value)) return value;
    await new Promise(resolve => setTimeout(resolve, 50));
  } while (Date.now() < deadline);
  throw new Error('The expected isolated integration effect did not complete.');
}

/** Use the owned Mailpit HTTP API; never consult a real inbox or SMTP provider. */
async function mailbox<T>(pathname: string): Promise<T> {
  const url = new URL(pathname, process.env.OAUTH_TEST_MAILPIT_URL);
  return await new Promise((resolve, reject) => {
    const req = http.get(url, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode !== 200) return reject(new Error('Local Mailpit API did not return200.'));
        try { resolve(JSON.parse(body) as T); } catch { reject(new Error('Invalid local Mailpit JSON.')); }
      });
    });
    req.setTimeout(3000, () => req.destroy(new Error('Local Mailpit API timed out.')));
    req.on('error', reject);
  });
}

/** Preserve any pre-existing canonical roles, deleting only roles this suite adds. */
async function role(name: string): Promise<number> {
  const existing = await prisma.roles.findUnique({ where: { name } });
  if (existing) return existing.id;
  const created = await prisma.roles.create({ data: { name } });
  createdRoleIds.push(created.id);
  return created.id;
}

/** Seed existing identities without pre-populating provider trust or app sessions. */
async function account(name: string, isAdmin = false): Promise<Account> {
  const email = `${name}-${run}@oauth.example.test`;
  const subject = `google-${name}-${run}`;
  const contact = await prisma.contacts.create({ data: { email, google_id: subject } });
  contactIds.push(contact.id);
  const user = await prisma.users.create({ data: {
    mongo_id: randomUUID(), nickname: `OAuth ${name}`, tag_list: [],
    contact_id: contact.id, role_id: await role(isAdmin ? 'Admin' : 'User'),
    is_active: true, verified: true,
  } });
  userIds.push(user.id);
  expect(user.verified_login_email).toBeNull();
  return { id: user.id, email, subject };
}

/** Start through the actual route, obtaining the real Redis-backed nonce. */
async function begin(): Promise<string> {
  const response = await request(server).get('/api/v1/auth/google')
    .query({ redirectUrl: '/en/organization-invitation', source: 'app' }).expect(302);
  const authorization = new URL(response.headers.location);
  expect(authorization.origin).toBe('https://accounts.google.com');
  expect(authorization.searchParams.get('client_id')).toBe(process.env.GOOGLE_CLIENT_ID);
  expect(authorization.searchParams.get('response_type')).toBe('code');
  expect(authorization.searchParams.get('redirect_uri')).toBe(process.env.GOOGLE_CALLBACK_URL);
  const value = authorization.searchParams.get('state');
  if (!value) throw new Error('Google authorization redirect is missing state.');
  const state = JSON.parse(Buffer.from(value, 'base64url').toString()) as State;
  expect(state.redirectUrl).toBe('/en/organization-invitation');
  expect(state.source).toBe('app');
  nonces.add(state.nonce);
  expect(await redis.exists(`oauth_nonce:${state.nonce}`)).toBe(1);
  return value;
}

/** Stub only Google's wire responses; actual Passport exchanges and parses them. */
function googleProfile(identity: Pick<Account, 'email' | 'subject'>, verified = true): void {
  const token = `controlled-google-access-${randomUUID()}`;
  nock('https://www.googleapis.com')
    .post('/oauth2/v4/token', (body: unknown) => {
      const values = typeof body === 'string' ? Object.fromEntries(new URLSearchParams(body)) : body;
      return typeof values === 'object' && values !== null
        && Reflect.get(values, 'client_id') === process.env.GOOGLE_CLIENT_ID
        && Reflect.get(values, 'client_secret') === process.env.GOOGLE_CLIENT_SECRET
        && Reflect.get(values, 'redirect_uri') === process.env.GOOGLE_CALLBACK_URL
        && Reflect.get(values, 'grant_type') === 'authorization_code'
        && typeof Reflect.get(values, 'code') === 'string';
    })
    .reply(200, { access_token: token, token_type: 'Bearer', expires_in: 3600 })
    .get('/oauth2/v3/userinfo')
    .query(query => query.access_token === token)
    .reply(200, { sub: identity.subject, email: identity.email, email_verified: verified, name: 'OAuth test account' });
}

/** Return the cookie issued by production code, asserting its security attributes. */
function authenticationCookie(response: request.Response): string {
  const values = response.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = values?.find(value => value.startsWith('auth_token='));
  if (!cookie) throw new Error('Successful real callback did not issue an auth cookie.');
  expect(cookie).toContain('HttpOnly');
  expect(cookie).toContain('Secure');
  expect(cookie).toContain('SameSite=None');
  return cookie.split(';')[0];
}

/** Authenticate through actual OAuth HTTP; never manufacture an application JWT. */
async function login(identity: Account): Promise<string> {
  const state = await begin();
  googleProfile(identity);
  const response = await request(server).get('/api/v1/auth/google/callback').query({ code: randomUUID(), state }).expect(302);
  const callback = new URL(response.headers.location);
  expect(callback.pathname).toBe('/auth/callback');
  expect(callback.searchParams.get('redirect')).toBe('/en/organization-invitation');
  expect(callback.searchParams.has('token')).toBe(false);
  const cookie = authenticationCookie(response);
  expect((await prisma.users.findUniqueOrThrow({ where: { id: identity.id } })).verified_login_email).toBe(identity.email);
  expectedSessions.set(identity.id, (expectedSessions.get(identity.id) ?? 0) + 1);
  return cookie;
}

/** Create through real admin HTTP, retrieve the invitation from actual local SMTP. */
async function pending(email: string): Promise<PendingInvitation> {
  const name = `OAuth-${run}-${organizationIds.length}`;
  const response = await request(server).post('/api/v1/lighthouse/admin/organizations')
    .set('Cookie', adminCookie).send({ name, ownerEmail: email }).expect(201);
  const organizationId: number = response.body.data.id;
  organizationIds.push(organizationId);
  expect(JSON.stringify(response.body)).not.toMatch(/token_hash|token_nonce|verified_login_email/);
  const invitation = await prisma.organization_invitations.findFirstOrThrow({ where: { organization_id: organizationId } });
  expect(invitation.accepted_at).toBeNull();
  const messages = await eventually(
    () => mailbox<{ messages: Array<{ ID: string; Subject: string; To: Array<{ Address: string }> }> }>('/api/v1/messages'),
    value => value.messages.some(message => message.Subject.includes(name)
      && message.To.some(recipient => recipient.Address.toLowerCase() === email.toLowerCase())),
  );
  const messageId = messages.messages.find(message => message.Subject.includes(name)
    && message.To.some(recipient => recipient.Address.toLowerCase() === email.toLowerCase()))?.ID;
  const message = await mailbox<{ HTML: string; Text: string }>(`/api/v1/message/${messageId}`);
  const token = `${message.HTML}\n${message.Text}`.match(/organization-invitation\?token=([a-f0-9]{64})/)?.[1];
  if (!token) throw new Error('The actual local invitation email is missing its capability.');
  await eventually(
    () => prisma.organization_invitation_dispatches.findUniqueOrThrow({ where: { invitation_id: invitation.id } }),
    value => value.status === 'sent',
  );
  return { organizationId, invitationId: invitation.id, token };
}

/** Rejections must not expose organization, invitation or provider-private fields. */
function privateRejection(body: unknown, invitation: PendingInvitation, email: string): void {
  const value = JSON.stringify(body);
  expect(value).not.toContain(invitation.token);
  expect(value).not.toContain(email);
  expect(value).not.toMatch(/token_hash|token_nonce|verified_login_email/);
}

beforeAll(async () => {
  loggerService.getWinstonLogger().silent = true;
  await new Promise<void>(resolve => { server.listen(0, '127.0.0.1', resolve); });
  await prisma.$connect();
  await redis.ping();
  expect((await mailbox<{ messages: unknown[] }>('/api/v1/messages')).messages).toEqual(expect.any(Array));
  const [persona] = await prisma.$queryRaw<Array<{ exists: boolean }>>`SELECT to_regclass('public.persona_user_state') IS NOT NULL AS exists`;
  hasPersonaTable = persona.exists;
  admin = await account('admin', true);
  adminCookie = await login(admin);
});

const unmatchedProviderAttempts: string[] = [];
const recordUnmatchedProvider = (outbound: { options?: { hostname?: string; host?: string }; hostname?: string; host?: string }): void => {
  const host = outbound.options?.hostname ?? outbound.options?.host ?? outbound.hostname ?? outbound.host ?? '';
  if (host.includes('googleapis.com') || host.includes('google.com')) unmatchedProviderAttempts.push(host);
};
beforeAll(() => { nock.emitter.on('no match', recordUnmatchedProvider); });
beforeEach(() => { unmatchedProviderAttempts.length = 0; });
afterAll(() => { nock.emitter.removeListener('no match', recordUnmatchedProvider); });

afterEach(() => {
  try { expect(nock.pendingMocks()).toEqual([]); }
  finally { nock.cleanAll(); }
});

afterAll(async () => {
  try {
    // Older canonical bootstrap snapshots omit persona's optional tables. The
    // production callback already catches that side effect; auth is still real.
    for (const [userId, count] of hasPersonaTable ? expectedSessions : []) {
      await eventually(
        () => prisma.persona_user_state.findUnique({ where: { user_id: userId } }),
        value => value !== null && value.session_count_since_last_prompt >= count,
      );
    }
    const stats = await prisma.users.findMany({ where: { id: { in: userIds } }, select: { activity_stats_id: true } });
    await prisma.organization_invitation_requests.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.organization.deleteMany({ where: { id: { in: organizationIds } } });
    if (userIds.length) await prisma.$executeRaw`DELETE FROM audit_logs WHERE admin_id IN (${Prisma.join(userIds)})`;
    await prisma.user_login_history.deleteMany({ where: { user_id: { in: userIds } } });
    if (hasPersonaTable) await prisma.persona_user_state.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.email_logs.deleteMany({ where: { user_id: { in: userIds } } });
    await prisma.users.deleteMany({ where: { id: { in: userIds } } });
    await prisma.user_activity_stats.deleteMany({ where: { id: { in: stats.flatMap(value => value.activity_stats_id === null ? [] : [value.activity_stats_id]) } } });
    await prisma.contacts.deleteMany({ where: { id: { in: contactIds } } });
    await prisma.temp_users.deleteMany({ where: { google_id: { in: temporarySubjects } } });
    await prisma.roles.deleteMany({ where: { id: { in: createdRoleIds } } });
    if (nonces.size) await redis.del(...Array.from(nonces, nonce => `oauth_nonce:${nonce}`));
  } finally {
    if (server.listening) await new Promise<void>((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); });
    await emailService.close();
    const redisEnded = new Promise<void>(resolve => { redis.once('end', resolve); });
    await redis.quit();
    await redisEnded;
    await prisma.$disconnect();
    loggerService.getWinstonLogger().close();
    nock.enableNetConnect();
  }
});

describe('Actual Passport / Redis / PostgreSQL owner invitation flow', () => {
  it('repeats first registration with the same provider identity in clean owned data and keeps signup sessions usable in Lighthouse', async () => {
    // A stable Google identity is new to the application whenever its owned app
    // data is absent. The provider's token/profile HTTP is controlled by Nock;
    // signup, cookies, identity checks and organization permissions stay real.
    const identity = { subject: `first-signup-${run}`, email: `first-signup-${run}@oauth.example.test` };
    temporarySubjects.push(identity.subject);
    await role('User'); // createUser assigns the canonical ordinary-user role2.

    for (const cycle of [1, 2]) {
      let invite: PendingInvitation | undefined;
      try {
        expect(await prisma.contacts.count({ where: { google_id: identity.subject } })).toBe(0);
        expect(await prisma.users.count({ where: { contacts: { email: identity.email } } })).toBe(0);
        expect(await prisma.temp_users.count({ where: { email: identity.email } })).toBe(0);
        invite = await pending(identity.email);
        expect(await prisma.organization_members.count({ where: { organization_id: invite.organizationId } })).toBe(0);

        const state = await begin();
        googleProfile(identity);
        const callback = await request(server).get('/api/v1/auth/google/callback')
          .query({ code: randomUUID(), state }).expect(302);
        const callbackUrl = new URL(callback.headers.location);
        expect(callbackUrl.searchParams.get('isNewUser')).toBe('true');
        expect(callbackUrl.searchParams.get('redirect')).toBe('/en/organization-invitation');
        const temporaryCookie = authenticationCookie(callback);
        const temporary = await prisma.temp_users.findFirstOrThrow({ where: { google_id: identity.subject } });
        expect(temporary.verified_login_email).toBe(identity.email);
        const beforeSignup = await request(server).get('/api/v1/auth/me').set('Cookie', temporaryCookie).expect(200);
        expect(beforeSignup.body.data.isTemporary).toBe(true);
        await request(server).post('/api/v1/lighthouse/organization-invitations/accept')
          .set('Cookie', temporaryCookie).send({ token: invite.token }).expect(401);
        expect(await prisma.organization_members.count({ where: { organization_id: invite.organizationId } })).toBe(0);

        // Use the production users route including auth, form parsing and DTO
        // validation. No user/contact/trusted-email row is seeded for signup.
        const signup = await request(server).post('/api/v1/users/me').set('Cookie', temporaryCookie)
          .send({ customId: `oauth_${run.slice(0, 16)}_${cycle}`, name: `首次註冊 ${run} ${cycle}`, isSubscribeEmail: false, isSendEmail: false, isOpenProfile: false })
          .expect(201);
        const formalCookie = authenticationCookie(signup);
        const formalToken: string = signup.body.data.token;
        expect(decodeURIComponent(formalCookie.slice('auth_token='.length))).toBe(formalToken);
        const claims = jwtService.verifyToken(formalToken);
        const user = await prisma.users.findFirstOrThrow({ where: { contacts: { google_id: identity.subject } } });
        if (!user.external_id) throw new Error('Persisted signup user must have a public UUID.');
        expect(claims).toMatchObject({ id: user.id, _id: user.external_id, isTemp: false });
        expect(user.verified_login_email).toBe(identity.email);
        expect(await prisma.temp_users.count({ where: { google_id: identity.subject } })).toBe(0);
        const me = await request(server).get('/api/v1/auth/me').set('Cookie', formalCookie).expect(200);
        expect(me.body.data).toMatchObject({ isTemporary: false, user: { id: user.external_id } });

        // Deliberately signed but inconsistent regression input. Normal-session
        // cookies above are issued only by the real callback/signup handlers.
        const absentNumericId = 2_000_000_000;
        expect(await prisma.users.count({ where: { id: absentNumericId } })).toBe(0);
        const stale = jwtService.generateToken({ id: absentNumericId, _id: user.external_id, isTemp: false });
        await request(server).post('/api/v1/lighthouse/organization-invitations/accept')
          .set('Authorization', `Bearer ${stale}`).send({ token: invite.token }).expect(401);
        expect((await prisma.organization_invitations.findUniqueOrThrow({ where: { id: invite.invitationId } })).accepted_at).toBeNull();
        expect(await prisma.organization_members.count({ where: { organization_id: invite.organizationId } })).toBe(0);

        const accepted = await request(server).post('/api/v1/lighthouse/organization-invitations/accept')
          .set('Cookie', formalCookie).send({ token: invite.token }).expect(200);
        expect(accepted.body.data).toMatchObject({ status: 'accepted', organizationId: invite.organizationId });
        expect(await prisma.organization_members.findMany({ where: { organization_id: invite.organizationId }, select: { user_id: true, role: true } }))
          .toEqual([{ user_id: user.id, role: 'owner' }]);
        const list = await request(server).get('/api/v1/lighthouse/organizations').set('Cookie', formalCookie).expect(200);
        expect(list.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: invite.organizationId })]));
        const detail = await request(server).get(`/api/v1/lighthouse/organizations/${invite.organizationId}`).set('Cookie', formalCookie).expect(200);
        expect(detail.body.data.id).toBe(invite.organizationId);
        const adminView = await request(server).get(`/api/v1/lighthouse/admin/organizations/${invite.organizationId}/invitations`)
          .set('Cookie', adminCookie).expect(200);
        expect(adminView.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: invite.invitationId, status: 'accepted' })]));
        const replay = await request(server).post('/api/v1/lighthouse/organization-invitations/accept')
          .set('Cookie', formalCookie).send({ token: invite.token }).expect(200);
        expect(replay.body.data).toEqual({ status: 'used' });
      } finally {
        // This runner's whole DB is disposable. Even here, remove only the
        // exact subject/email/org created by this test, never a shared QA user.
        if (invite) await prisma.organization.delete({ where: { id: invite.organizationId } });
        const owned = await prisma.users.findFirst({ where: { contacts: { google_id: identity.subject, email: identity.email } } });
        if (owned) {
          await prisma.user_login_history.deleteMany({ where: { user_id: owned.id } });
          if (hasPersonaTable) await prisma.persona_user_state.deleteMany({ where: { user_id: owned.id } });
          await prisma.email_logs.deleteMany({ where: { user_id: owned.id } });
          await prisma.users.delete({ where: { id: owned.id } });
          if (owned.basic_info_id !== null) await prisma.basic_info.delete({ where: { id: owned.basic_info_id } });
          if (owned.activity_stats_id !== null) await prisma.user_activity_stats.delete({ where: { id: owned.activity_stats_id } });
        }
        await prisma.contacts.deleteMany({ where: { google_id: identity.subject, email: identity.email } });
        await prisma.temp_users.deleteMany({ where: { google_id: identity.subject, email: identity.email } });
      }
      expect(await prisma.contacts.count({ where: { google_id: identity.subject } })).toBe(0);
      expect(await prisma.temp_users.count({ where: { google_id: identity.subject } })).toBe(0);
    }
  });

  it('records an unmatched Google request while Nock blocks the external network', () => {
    // A child process contains Nock's native HTTP parser handles after denied I/O.
    // Serialize the exact recorder used by the negative callback cases.
    const script = `
      const nock = require(${JSON.stringify(require.resolve('nock'))});
      const https = require('node:https');
      const unmatchedProviderAttempts = [];
      const record = ${recordUnmatchedProvider.toString()};
      nock.disableNetConnect();
      nock.emitter.on('no match', record);
      https.get('https://www.googleapis.com/oauth2/v3/userinfo').on('error', error => {
        process.stdout.write(JSON.stringify({ code: error.code, attempts: unmatchedProviderAttempts }));
      });
    `;
    const result = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', timeout: 5000 });
    expect(result.status).toBe(0);
    expect(result.error).toBeUndefined();
    expect(JSON.parse(result.stdout)).toEqual({
      code: expect.stringMatching(/^(?:ENETUNREACH|ERR_NOCK_NO_MATCH)$/),
      attempts: [expect.stringContaining('www.googleapis.com')],
    });
  });

  it('persists the provider-verified identity and consumes an emailed invitation exactly once', async () => {
    const recipient = await account('recipient');
    const invite = await pending(recipient.email);
    const cookie = await login(recipient);
    const forbidden = await request(server).get(`/api/v1/lighthouse/organizations/${invite.organizationId}`).set('Cookie', cookie).expect(403);
    privateRejection(forbidden.body, invite, recipient.email);
    const accepted = await request(server).post('/api/v1/lighthouse/organization-invitations/accept').set('Cookie', cookie).send({ token: invite.token }).expect(200);
    expect(accepted.body.data).toEqual({ status: 'accepted', organizationId: invite.organizationId, organizationName: expect.any(String) });
    await request(server).get(`/api/v1/lighthouse/organizations/${invite.organizationId}`).set('Cookie', cookie).expect(200);
    const replay = await request(server).post('/api/v1/lighthouse/organization-invitations/accept').set('Cookie', cookie).send({ token: invite.token }).expect(200);
    expect(replay.body.data).toEqual({ status: 'used' });
    expect(await prisma.organization_members.count({ where: { organization_id: invite.organizationId, user_id: recipient.id, role: 'owner' } })).toBe(1);
    const other = await account('used-link-other');
    const otherCookie = await login(other);
    const stolen = await request(server).post('/api/v1/lighthouse/organization-invitations/accept').set('Cookie', otherCookie).send({ token: invite.token }).expect(200);
    expect(stolen.body.data).toEqual({ status: 'used' });
    await request(server).get(`/api/v1/lighthouse/organizations/${invite.organizationId}`).set('Cookie', otherCookie).expect(403);
    expect(await prisma.organization_members.count({ where: { organization_id: invite.organizationId, user_id: other.id } })).toBe(0);
  });

  it('keeps a different verified Google identity unauthorized until exact admin approval', async () => {
    const invited = await account('invited');
    const applicant = await account('applicant');
    const invite = await pending(invited.email);
    const cookie = await login(applicant);
    const accepted = await request(server).post('/api/v1/lighthouse/organization-invitations/accept').set('Cookie', cookie).send({ token: invite.token }).expect(200);
    expect(accepted.body.data).toEqual({ status: 'needs_confirmation' });
    privateRejection(accepted.body, invite, invited.email);
    await request(server).get(`/api/v1/lighthouse/organizations/${invite.organizationId}`).set('Cookie', cookie).expect(403);
    expect(await prisma.organization_members.count({ where: { organization_id: invite.organizationId } })).toBe(0);
    const approval = await prisma.organization_invitation_requests.findUniqueOrThrow({ where: { invitation_id_user_id: { invitation_id: invite.invitationId, user_id: applicant.id } } });
    const path = `/api/v1/lighthouse/admin/organizations/${invite.organizationId}/invitations/${invite.invitationId}/requests/${approval.id}/approve`;
    await request(server).post(path).set('Cookie', cookie).send({}).expect(403);
    await request(server).post(path).set('Cookie', adminCookie).send({}).expect(200);
    await request(server).get(`/api/v1/lighthouse/organizations/${invite.organizationId}`).set('Cookie', cookie).expect(200);
    expect(await prisma.organization_members.count({ where: { organization_id: invite.organizationId, user_id: applicant.id } })).toBe(1);
    expect(await prisma.organization_members.count({ where: { organization_id: invite.organizationId, user_id: invited.id } })).toBe(0);
  });

  it('rejects an unverified Google email without issuing a session or trusting the account', async () => {
    const identity = await account('unverified');
    const state = await begin();
    googleProfile(identity, false);
    const response = await request(server).get('/api/v1/auth/google/callback').query({ code: randomUUID(), state }).expect(302);
    expect(response.headers.location).toContain('/auth/error?reason=passport_error');
    expect(response.headers['set-cookie'] ?? []).not.toEqual(expect.arrayContaining([expect.stringMatching(/^auth_token=/)]));
    expect((await prisma.users.findUniqueOrThrow({ where: { id: identity.id } })).verified_login_email).toBeNull();
  });

  it('rejects the same contact email with a different provider subject rather than taking over the account', async () => {
    const identity = await account('collision');
    const state = await begin();
    googleProfile({ ...identity, subject: `other-${identity.subject}` });
    const response = await request(server).get('/api/v1/auth/google/callback').query({ code: randomUUID(), state }).expect(302);
    expect(response.headers.location).toContain('/auth/error?reason=passport_error');
    expect(response.headers['set-cookie'] ?? []).not.toEqual(expect.arrayContaining([expect.stringMatching(/^auth_token=/)]));
    expect((await prisma.users.findUniqueOrThrow({ where: { id: identity.id } })).verified_login_email).toBeNull();
    expect(await prisma.temp_users.count({ where: { email: identity.email } })).toBe(0);
  });

  it('persists the verified provider email for a genuine temporary identity but denies formal owner acceptance', async () => {
    const identity = { subject: `temp-${run}`, email: `temp-${run}@oauth.example.test` };
    temporarySubjects.push(identity.subject);
    const invite = await pending(identity.email);
    const state = await begin();
    googleProfile(identity);
    const response = await request(server).get('/api/v1/auth/google/callback').query({ code: randomUUID(), state }).expect(302);
    const cookie = authenticationCookie(response);
    const temporary = await prisma.temp_users.findFirstOrThrow({ where: { google_id: identity.subject } });
    expect(temporary.verified_login_email).toBe(identity.email);
    await request(server).post('/api/v1/lighthouse/organization-invitations/accept').set('Cookie', cookie).send({ token: invite.token }).expect(401);
    expect(await prisma.organization_members.count({ where: { organization_id: invite.organizationId } })).toBe(0);
  });

  it.each(['missing', 'malformed', 'unknown-nonce'] as const)('rejects %s callback state before calling Google', async kind => {
    const state = kind === 'missing' ? undefined : kind === 'malformed' ? 'not-a-state' : Buffer.from(JSON.stringify({ redirectUrl: '/en/organization-invitation', source: 'app', timestamp: Date.now(), nonce: randomUUID() })).toString('base64url');
    const response = await request(server).get('/api/v1/auth/google/callback').query({ code: randomUUID(), ...(state ? { state } : {}) }).expect(302);
    // Missing state currently throws in the state-store diagnostic before any provider request.
    const reason = kind === 'missing' ? 'passport_error' : 'auth_failed';
    expect(response.headers.location).toContain(`/auth/error?reason=${reason}`);
    expect(unmatchedProviderAttempts).toEqual([]);
    expect(response.headers['set-cookie'] ?? []).not.toEqual(expect.arrayContaining([expect.stringMatching(/^auth_token=/)]));
  });

  it('rejects an expired Redis nonce without calling the external provider', async () => {
    const state = await begin();
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString()) as State;
    await redis.pexpire(`oauth_nonce:${decoded.nonce}`, 1);
    await eventually(() => redis.exists(`oauth_nonce:${decoded.nonce}`), value => value === 0);
    const response = await request(server).get('/api/v1/auth/google/callback').query({ code: randomUUID(), state }).expect(302);
    expect(response.headers.location).toContain('/auth/error?reason=auth_failed');
    expect(unmatchedProviderAttempts).toEqual([]);
    expect(response.headers['set-cookie'] ?? []).not.toEqual(expect.arrayContaining([expect.stringMatching(/^auth_token=/)]));
  });

  it('rejects a nonce tampered inside an otherwise valid issued state', async () => {
    const original = JSON.parse(Buffer.from(await begin(), 'base64url').toString()) as State;
    const state = Buffer.from(JSON.stringify({ ...original, nonce: randomUUID().replace(/-/g, '') })).toString('base64url');
    const response = await request(server).get('/api/v1/auth/google/callback').query({ code: randomUUID(), state }).expect(302);
    expect(response.headers.location).toContain('/auth/error?reason=auth_failed');
    expect(unmatchedProviderAttempts).toEqual([]);
    expect(response.headers['set-cookie'] ?? []).not.toEqual(expect.arrayContaining([expect.stringMatching(/^auth_token=/)]));
  });

  it('rejects an expired state timestamp without issuing an application session', async () => {
    const identity = await account('expired');
    const original = JSON.parse(Buffer.from(await begin(), 'base64url').toString()) as State;
    const state = Buffer.from(JSON.stringify({ ...original, timestamp: Date.now() - 11 * 60 * 1000 })).toString('base64url');
    googleProfile(identity);
    const response = await request(server).get('/api/v1/auth/google/callback').query({ code: randomUUID(), state }).expect(302);
    expect(response.headers.location).toContain('/auth/error?reason=state_expired');
    expect(response.headers['set-cookie'] ?? []).not.toEqual(expect.arrayContaining([expect.stringMatching(/^auth_token=/)]));
  });

  it('rejects replay of consumed state in a fresh unauthenticated client', async () => {
    const identity = await account('replay');
    const state = await begin();
    googleProfile(identity);
    const first = await request(server).get('/api/v1/auth/google/callback').query({ code: randomUUID(), state }).expect(302);
    authenticationCookie(first);
    expectedSessions.set(identity.id, 1);
    const second = await request(server).get('/api/v1/auth/google/callback').query({ code: randomUUID(), state }).expect(302);
    expect(second.headers.location).toContain('/auth/error?reason=auth_failed');
    expect(unmatchedProviderAttempts).toEqual([]);
    expect(second.headers['set-cookie'] ?? []).not.toEqual(expect.arrayContaining([expect.stringMatching(/^auth_token=/)]));
  });

  it('rejects an external return URL at initiation without creating a provider request', async () => {
    const response = await request(server).get('/api/v1/auth/google').query({ redirectUrl: 'https://outside.example.test/', source: 'app' }).expect(302);
    expect(response.headers.location).toContain('/auth/error?reason=invalid_redirect_uri');
  });
});
