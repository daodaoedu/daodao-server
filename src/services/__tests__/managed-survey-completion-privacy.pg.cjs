/** Explicit local harness only: raw SQL assertions verify transaction metadata cannot expose member identity. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const base = new URL(process.env.MANAGED_SURVEY_TEST_BASE || '');
const database = new URL(process.env.DATABASE_URL || '');
if (base.hostname !== '127.0.0.1' || base.port !== '14529' || database.hostname !== '127.0.0.1' || database.port !== '16529' || database.pathname !== '/survey529') throw new Error('Requires isolated survey529 HTTP/PG fixtures');
const fixtures = JSON.parse(fs.readFileSync(process.env.MANAGED_SURVEY_TEST_FIXTURES, 'utf8'));
Object.assign(process.env, { NODE_ENV: 'test', EMAIL_ADDRESS: 'privacy529@example.invalid', EMAIL_PASSWORD: 'local-only', FRONTEND_URL: 'http://127.0.0.1:13529' });
require('ts-node').register({ transpileOnly: true }); require('tsconfig-paths/register');
const { managedSurveyService } = require('../managed-survey.service');
const { surveyService } = require('../survey.service');
const client = new Client({ connectionString: database.toString() });
const cleanup = [];
async function request(method, path, body, actor = 'admin') {
  const response = await fetch(new URL(path, base), { method, headers: { 'Content-Type': 'application/json', ...(actor ? { Authorization: `Bearer ${fixtures[actor].token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const text = await response.text(); return { status: response.status, body: text ? JSON.parse(text) : null };
}
(async () => {
  await client.connect();
  try {
    const created = await request('POST', '/api/v1/admin/surveys', { title: 'privacy529 ' + randomUUID(), is_public: false, is_anonymous: true, questions: [{ question_type: 'text', question_text: '感想' }] });
    assert.equal(created.status, 201); const survey = created.body.data; cleanup.push(survey.id);
    assert.equal((await request('PATCH', `/api/v1/admin/surveys/${survey.id}/status`, { status: 'active' })).status, 200);
    const path = `/api/v1/surveys/public/${survey.external_id}`;
    assert.equal((await request('GET', path, undefined, 'member')).body.data.has_responded, false);
    const body = { answers: [{ question_id: survey.questions[0].id, answer_text: '匿名感想' }] };
    const raced = await Promise.all([request('POST', path + '/responses', body, 'member'), request('POST', path + '/responses', body, 'member')]);
    assert.deepEqual(raced.map(result => result.status).sort(), [201, 409]);
    assert.equal((await request('GET', path, undefined, 'member')).body.data.has_responded, true);
    assert.equal((await request('GET', path, undefined, 'member2')).body.data.has_responded, false);
    assert.equal((await request('POST', path + '/responses', body, 'member2')).status, 201);
    const raw = await client.query('SELECT user_id,completion_key FROM managed_survey_completions WHERE survey_id=$1', [survey.id]);
    assert.equal(raw.rowCount, 2);
    assert.ok(raw.rows.every(row => row.user_id === null && /^[0-9a-f]{64}$/.test(row.completion_key)), 'Completion identities must be opaque');
    assert.equal(new Set(raw.rows.map(row => row.completion_key)).size, 2);
    const correlated = await client.query('SELECT c.user_id,r.user_id AS answer_user_id FROM managed_survey_completions c JOIN survey_responses r ON c.xmin=r.xmin AND c.survey_id=r.survey_id WHERE c.survey_id=$1', [survey.id]);
    assert.ok(correlated.rowCount >= 2, 'Exercise the original xmin join, not a vacuous empty join');
    assert.ok(correlated.rows.every(row => row.user_id === null && row.answer_user_id === null), 'xmin must not reveal a member identity');
    await assert.rejects(client.query('INSERT INTO managed_survey_completions(survey_id,user_id,completion_key) VALUES($1,$2,$3)', [survey.id, fixtures.member3.id, 'a'.repeat(64)]), error => error.code === '23514');
    console.log('PASS API dedup/concurrency/hasResponded and nonvacuous raw xmin anonymity');
    const legacy = await request('POST', '/api/v1/surveys', { title: 'privacy529 legacy ' + randomUUID(), questions: [{ question_type: 'text', question_text: '舊問卷' }] }, 'member');
    assert.equal(legacy.status, 201); cleanup.push(legacy.body.data.id);
    assert.equal((await request('PATCH', `/api/v1/admin/surveys/${legacy.body.data.id}/status`, { status: 'active' })).status, 200);
    const key = process.env.SURVEY_COMPLETION_HMAC_KEY;
    try {
      delete process.env.SURVEY_COMPLETION_HMAC_KEY;
      await assert.rejects(managedSurveyService.public(survey.external_id, fixtures.member.id), error => error.statusCode === 503);
      await assert.rejects(managedSurveyService.submit(survey.external_id, fixtures.member3.id, body.answers), error => error.statusCode === 503);
      await assert.rejects(managedSurveyService.create(fixtures.admin.id, { title: 'must not create', questions: [], tags: [], is_public: true, is_anonymous: true }), error => error.statusCode === 503);
      assert.ok((await surveyService.getPublic(legacy.body.data.external_id, null)).success);
      assert.ok((await surveyService.submitResponse(legacy.body.data.external_id, null, { answers: [{ question_id: legacy.body.data.questions[0].id, answer_text: '舊服務仍可填' }] })).success);
    } finally { process.env.SURVEY_COMPLETION_HMAC_KEY = key; }
    console.log('PASS missing independent key fails managed flows closed without affecting legacy');
    console.log(JSON.stringify({ raw_xmin_join_exercised: true, completion_user_ids_null: true, opaque_completion_count: raw.rowCount, dedup_concurrency_preserved: true, missing_key_fail_closed: true }));
  } finally {
    for (const id of cleanup) await request('DELETE', `/api/v1/admin/surveys/${id}`);
    await client.end();
    const { prisma } = require('../database/prisma.service'); await prisma.$disconnect();
  }
  process.exit(0);
})().catch(() => { console.error('FAIL completion privacy regression; inspect locally without printing identity/key rows'); process.exit(1); });
