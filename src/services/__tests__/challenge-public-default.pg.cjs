/**
 * Real PostgreSQL/HTTP regression for FR-CC-05/13. No Prisma/auth mocks.
 * Start task-owned PG16 (qa213/qa213, qa213_public) on 127.0.0.1:55438
 * and Redis on 127.0.0.1:56383, then run this file with node.
 * An isolated schema is created and dropped; no dev DB or SMTP is used.
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const repo = path.resolve(__dirname, '../../..');
const schema = `qa213_public_default_${process.pid}`;
const db = new URL('postgresql://qa213:qa213@127.0.0.1:55438/qa213_public');
db.searchParams.set('schema', schema);
assert.equal(db.hostname, '127.0.0.1');
assert.equal(db.port, '55438');
assert.equal(db.pathname, '/qa213_public');
assert.match(schema, /^qa213_public_default_\d+$/);
Object.assign(process.env, {
  DATABASE_URL: db.toString(), JWT_SECRET: crypto.randomBytes(32).toString('hex'), JWT_EXPIRES_IN: '7d',
  NODE_ENV: 'test', REDIS_HOST: '127.0.0.1', REDIS_PORT: '56383', REDIS_DB: '0', REDIS_PASSWORD: '',
  SMTP_HOST: '127.0.0.1', SMTP_PORT: '9', SMTP_SECURE: 'false', EMAIL_USER: 'qa@invalid.test',
  FRONTEND_URL: 'http://127.0.0.1:3213', BACKEND_URL: 'http://127.0.0.1:4213', WEBSITE_URL: 'http://127.0.0.1:3213',
  GOOGLE_CLIENT_ID: 'local-fixture', GOOGLE_CLIENT_SECRET: 'local-fixture', GOOGLE_CALLBACK_URL: 'http://127.0.0.1:4213/auth/callback'
});
require(path.join(repo, 'node_modules/ts-node')).register({ transpileOnly: true, project: path.join(repo, 'tsconfig.json') });
require(path.join(repo, 'node_modules/tsconfig-paths')).register({ baseUrl: repo, paths: { '@/*': ['src/*'] } });
const RealDate = Date;
let clock = RealDate.now();
// A local test clock lets the normal future join/start/checkin guards run in order.
global.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [clock])); }
  static now() { return clock; }
};
const rows = [];
let prisma, server;
async function main() {
  const { Client } = require(path.join(repo, 'node_modules/pg'));
  const probe = new Client({ host: db.hostname, port: Number(db.port), user: 'qa213', password: 'qa213', database: 'qa213_public' });
  await probe.connect();
  try {
    const identity = (await probe.query('SELECT current_database() AS database, current_user AS username, inet_server_port() AS server_port, version() AS version')).rows[0];
    assert.equal(identity.database, 'qa213_public'); assert.equal(identity.username, 'qa213');
    assert.match(identity.version, /^PostgreSQL 16\./);
    rows.push({ name: 'database identity verified before schema DDL', host: db.hostname, publishedPort: db.port, ...identity });
  } finally { await probe.end(); }
  execFileSync(process.execPath, [require.resolve('prisma/build/index.js', { paths: [repo] }), 'db', 'push', '--schema', path.join(repo, 'prisma/schema.prisma'), '--skip-generate'], { cwd: repo, env: process.env, stdio: 'inherit' });
  ({ prisma } = require(path.join(repo, 'src/services/database/prisma.service')));
  const identity = await prisma.$queryRaw`SELECT current_database() AS database, current_schema() AS schema, inet_server_port() AS server_port`;
  assert.equal(identity[0].database, 'qa213_public'); assert.equal(identity[0].schema, schema);
  rows.push({ name: 'disposable-local-PG-identity', host: db.hostname, publishedPort: db.port, ...identity[0] });
  await prisma.roles.createMany({ data: [{ id: 1, name: 'User' }, { id: 2, name: 'SuperAdmin' }] });
  for (const id of [10, 20, 30]) {
    await prisma.contacts.create({ data: { id, email: `qa213-${id}@invalid.test`, is_subscribe_email: false } });
    await prisma.users.create({ data: { id, mongo_id: `qa213-${id}`, external_id: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`, nickname: `QA213-${id}`, contact_id: id, role_id: id === 10 ? 2 : 1, verified: true, is_active: true, tag_list: [] } });
  }
  await prisma.organization.create({ data: { id: 1, name: 'QA213 official', is_official: true, status: 'active', timezone: 'Asia/Taipei' } });
  const express = require(path.join(repo, 'node_modules/express'));
  const app = express(); app.use(express.json()); app.use(require(path.join(repo, 'node_modules/cookie-parser'))());
  require(path.join(repo, 'src/app')).setupTypescriptRoutes(app);
  app.use(require(path.join(repo, 'src/middleware/error.middleware')).globalErrorHandler);
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  rows.push({ name: 'actual-loopback-HTTP', base });
  const { generateToken } = require(path.join(repo, 'src/services/jwt.service'));
  const tokens = {};
  for (const id of [10, 20, 30]) tokens[id] = generateToken({ id, _id: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`, username: `QA213-${id}`, isTemp: false, roles: [id === 10 ? 'SuperAdmin' : 'User'], permissions: [] });
  async function request(name, method, route, actor, body, status) {
    const headers = { 'Content-Type': 'application/json' }; if (actor) headers.Authorization = `Bearer ${tokens[actor]}`;
    const res = await fetch(base + route, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const raw = await res.text(); const result = raw ? JSON.parse(raw) : null;
    rows.push({ name, method, route, status: res.status, body: result });
    assert.equal(res.status, status, `${name}: ${raw}`); return result?.data;
  }
  const day = offset => new RealDate(clock + offset * 86400000).toISOString().slice(0, 10);
  const program = await request('admin creates challenge program', 'POST', '/admin/challenges/programs', 10, { name: 'QA213 public regression' }, 201);
  const template = await request('admin creates template', 'POST', '/admin/challenges/templates', 10, { title: 'QA213 template', durationDays: null, practiceAction: 'QA213 checkin', frequencyMinDays: 1, frequencyMaxDays: 2, sessionDurationMinutes: 15, practiceTimePeriods: ['evening'] }, 201);
  // Preserve a genuinely pre-existing private challenge and its private practice.
  await prisma.cohorts.create({ data: { id: 9000, program_id: program.id, slug: 'legacy-private', display_name: 'legacy private', status: 'published', is_private: true, start_date: new Date(day(1)), end_date: new Date(day(2)) } });
  const legacyPractice = await prisma.practices.create({ data: { user_id: 30, cohort_id: 9000, title: 'legacy private practice', status: 'not_started', privacy_status: 'private', practice_time_periods: [] } });
  for (const actor of [null, 20]) {
    for (const suffix of ['', '/checkins']) {
      await request(`${actor ? 'outsider' : 'guest'} still cannot read legacy private${suffix}`, 'GET', `/practices/${legacyPractice.external_id}${suffix}`, actor, undefined, 403);
      assert.ok(!JSON.stringify(rows[rows.length - 1].body).includes('legacy private practice'));
    }
  }
  const cohort = await request('admin creates future challenge', 'POST', `/admin/challenges/programs/${program.id}/cohorts`, 10, { displayName: 'QA213 public challenge', startDate: day(1), endDate: day(2), capacity: 1, templateId: template.id }, 201);
  await request('publish', 'POST', `/admin/challenges/programs/${program.id}/cohorts/${cohort.id}/status`, 10, { status: 'published' }, 200);
  const joined = await request('normal participant join', 'POST', `/challenges/${cohort.id}/join`, 20, undefined, 201);
  assert.equal((await prisma.cohorts.findUnique({ where: { id: 9000 } })).is_private, true);
  assert.equal((await prisma.practices.findFirst({ where: { cohort_id: 9000 } })).privacy_status, 'private');
  rows.push({ name: 'legacy private cohort and practice preserved', pass: true });
  const practice = await request('new participant practice is public', 'GET', `/practices/${joined.practiceId}`, 20, undefined, 200);
  assert.equal(practice.privacyStatus, 'public', 'FR-CC-05: a newly created challenge must produce a public practice');
  assert.equal(practice.status, 'not_started');
  await prisma.cohort_templates.create({ data: { cohort_id: 9000, template_id: template.id, start_date: new Date(day(1)) } });
  const duplicated = await request('duplicate legacy private challenge creates a new cohort', 'POST', `/admin/challenges/programs/${program.id}/cohorts/9000/duplicate`, 10, undefined, 201);
  await request('publish duplicated challenge', 'POST', `/admin/challenges/programs/${program.id}/cohorts/${duplicated.id}/status`, 10, { status: 'published' }, 200);
  const duplicateJoin = await request('join duplicated challenge normally', 'POST', `/challenges/${duplicated.id}/join`, 30, undefined, 201);
  const duplicatePractice = await request('duplicated challenge new practice is public', 'GET', `/practices/${duplicateJoin.practiceId}`, 30, undefined, 200);
  assert.equal(duplicatePractice.privacyStatus, 'public', 'FR-CC-05: newly duplicated challenge must also be public');
  assert.equal((await prisma.cohorts.findUnique({ where: { id: 9000 } })).is_private, true);
  assert.equal((await prisma.practices.findFirst({ where: { cohort_id: 9000 } })).privacy_status, 'private');
  await request('guest public practice read', 'GET', `/practices/${joined.practiceId}`, null, undefined, 200);
  await request('outsider cannot comment on public challenge', 'POST', '/comments', 30, { targetType: 'practice', targetId: joined.practiceId, content: 'outsider forbidden', visibility: 'public' }, 403);
  await request('guest cannot comment', 'POST', '/comments', null, { targetType: 'practice', targetId: joined.practiceId, content: 'guest forbidden', visibility: 'public' }, 401);
  // Advance beyond the real start day; no DB date/status manipulation is used.
  clock += 86400000;
  await request('participant activates after normal start', 'PUT', `/practices/${joined.practiceId}`, 20, { status: 'active' }, 200);
  const checkin = await request('participant normal public checkin', 'POST', `/practices/${joined.practiceId}/checkins`, 20, { note: 'QA213_PUBLIC_CHECKIN', mood: 'happy', tags: ['QA213'] }, 201);
  for (const actor of [null, 30]) {
    const list = await request(`${actor ? 'outsider' : 'guest'} reads public checkins`, 'GET', `/practices/${joined.practiceId}/checkins`, actor, undefined, 200);
    assert.ok(JSON.stringify(list).includes('QA213_PUBLIC_CHECKIN'));
  }
  await request('participant can comment', 'POST', '/comments', 20, { targetType: 'checkin', targetId: String(checkin.id), content: 'participant allowed', visibility: 'public' }, 201);
  await request('outsider cannot comment on public checkin', 'POST', '/comments', 30, { targetType: 'checkin', targetId: String(checkin.id), content: 'outsider forbidden', visibility: 'public' }, 403);
  assert.equal((await prisma.cohorts.findUnique({ where: { id: 9000 } })).is_private, true);
  assert.equal((await prisma.practices.findFirst({ where: { cohort_id: 9000 } })).privacy_status, 'private');
  rows.push({ name: 'legacy privacy still preserved after public reads/comments', pass: true });
}
(async () => {
  let error;
  try { await main(); } catch (e) { error = e; console.error(e.message); }
  finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (prisma) { await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await prisma.$disconnect(); rows.push({ name: 'owned schema dropped', schema }); }
    global.Date = RealDate;
    if (process.env.QA213_EVIDENCE_PATH) fs.writeFileSync(process.env.QA213_EVIDENCE_PATH, JSON.stringify({ pass: !error, error: error?.message, rows, boundary: 'real PG16, actual HTTP/JWT/routes; test clock advances one day; no main/SMTP workers/dev data' }, null, 2));
    process.exit(error ? 1 : 0);
  }
})();
