/** Run against the task-local HTTP/PG harness; creates and cleans only its own fixtures. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const base = new URL(process.env.MANAGED_SURVEY_TEST_BASE || '');
const database = new URL(process.env.DATABASE_URL || '');
if (base.hostname !== '127.0.0.1' || base.port !== '14529' || database.hostname !== '127.0.0.1' || database.port !== '16529' || database.pathname !== '/survey529') throw new Error('Requires the isolated #529 HTTP/PG harness');
const fixtures = JSON.parse(fs.readFileSync(process.env.MANAGED_SURVEY_TEST_FIXTURES, 'utf8'));
Object.assign(process.env, { NODE_ENV: 'test', EMAIL_ADDRESS: 'review529@example.invalid', EMAIL_PASSWORD: 'local-only', FRONTEND_URL: 'http://127.0.0.1:13529' });
require('ts-node').register({ transpileOnly: true });
require('tsconfig-paths/register');
const { prisma } = require('../database/prisma.service');
const r2 = require('../r2.service');
const { managedSurveyService } = require('../managed-survey.service');
const cleanup = [];
const failures = [];
async function request(method, path, body, actor = 'admin') {
  const response = await fetch(new URL(path, base), { method, headers: { 'Content-Type': 'application/json', ...(actor ? { Authorization: `Bearer ${fixtures[actor].token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}
async function create(questions) {
  const response = await request('POST', '/api/v1/admin/surveys', { title: 'review529 ' + randomUUID(), is_public: true, questions });
  assert.equal(response.status, 201);
  cleanup.push(response.data.data.id);
  assert.equal((await request('PATCH', `/api/v1/admin/surveys/${response.data.data.id}/status`, { status: 'active' })).status, 200);
  return response.data.data;
}
async function check(name, fn) { try { await fn(); console.log('PASS ' + name); } catch (error) { failures.push(name); console.error('FAIL ' + name + ': ' + error.message); } }
(async () => {
  try {
    await check('unchanged question saves preserve the already-open responder form', async () => {
      const survey = await create([{ question_type: 'single_choice', question_text: '選一項', options: [{ option_text: '甲' }, { option_text: '乙' }] }]);
      const question = survey.questions[0];
      const saved = await request('PUT', `/api/v1/admin/surveys/${survey.id}`, { description: '只改描述', questions: survey.questions });
      assert.equal(saved.status, 200);
      const submitted = await request('POST', `/api/v1/surveys/public/${survey.external_id}/responses`, { answers: [{ question_id: question.id, selected_option_ids: [question.options[0].id] }] }, null);
      console.log('OBSERVED pre-save question/option=' + question.id + '/' + question.options[0].id + ' saved=' + saved.data.data.questions[0].id + '/' + saved.data.data.questions[0].options[0].id + ' old-form submit=' + submitted.status);
      assert.equal(submitted.status, 201, 'metadata save invalidated a live response form');
      assert.equal(saved.data.data.questions[0].id, question.id);
      assert.deepEqual(saved.data.data.questions[0].options.map(option => option.id), question.options.map(option => option.id));
      assert.equal((await request('PUT', `/api/v1/admin/surveys/${survey.id}`, { questions: [{ question_type: 'text', question_text: '歷史不可改' }] })).status, 409);
      const revised = await create([{ question_type: 'text', question_text: '尚無回應的舊題' }]);
      const rebuilt = await request('PUT', `/api/v1/admin/surveys/${revised.id}`, { questions: [{ question_type: 'text', question_text: '真正改動後的新題' }] });
      assert.equal(rebuilt.status, 200);
      assert.notEqual(rebuilt.data.data.questions[0].id, revised.questions[0].id);
      assert.equal((await request('POST', `/api/v1/surveys/public/${revised.external_id}/responses`, { answers: [{ question_id: rebuilt.data.data.questions[0].id, answer_text: '新版回答' }] }, null)).status, 201);
    });
    await check('managed views increment only the aggregate counter, with no member/session records', async () => {
      const survey = await create([{ question_type: 'text', question_text: '可選填' }]);
      assert.equal((await request('GET', `/api/v1/surveys/public/${survey.external_id}`, undefined, null)).status, 200);
      assert.equal((await request('POST', `/api/v1/surveys/public/${survey.external_id}/views`, { session_key: 'must-not-store', user_id: fixtures.member.id }, null)).status, 204);
      const loaded = await prisma.surveys.findUniqueOrThrow({ where: { id: survey.id }, select: { view_count: true } });
      console.log('OBSERVED managed view_count=' + loaded.view_count);
      assert.equal(loaded.view_count, 1);
      const listed = await request('GET', `/api/v1/admin/surveys?q=${encodeURIComponent(survey.title)}`);
      assert.equal(listed.data.data.find(item => item.id === survey.id).view_count, 1);
      await prisma.surveys.update({ where: { id: survey.id }, data: { start_time: new Date(Date.now() + 60000) } });
      await request('POST', `/api/v1/surveys/public/${survey.external_id}/views`, {}, null);
      assert.equal((await prisma.surveys.findUniqueOrThrow({ where: { id: survey.id } })).view_count, 1);
      await prisma.surveys.update({ where: { id: survey.id }, data: { start_time: null, end_time: new Date(Date.now() - 60000) } });
      await request('POST', `/api/v1/surveys/public/${survey.external_id}/views`, {}, null);
      assert.equal((await prisma.surveys.findUniqueOrThrow({ where: { id: survey.id } })).view_count, 1);
      await prisma.surveys.update({ where: { id: survey.id }, data: { end_time: null } });
      assert.equal(await prisma.survey_partial_submissions.count({ where: { survey_id: survey.id } }), 0);
      assert.equal(await prisma.managed_survey_completions.count({ where: { survey_id: survey.id } }), 0);
      assert.equal(await prisma.survey_responses.count({ where: { survey_id: survey.id } }), 0);
      await request('PATCH', `/api/v1/admin/surveys/${survey.id}/status`, { status: 'closed' });
      await request('POST', `/api/v1/surveys/public/${survey.external_id}/views`, {}, null);
      assert.equal((await prisma.surveys.findUniqueOrThrow({ where: { id: survey.id } })).view_count, 1);
    });
    await check('image quota mutex does not block unrelated user foreign-key inserts during upload', async () => {
      const admin = await prisma.users.findUniqueOrThrow({ where: { id: fixtures.admin.id }, select: { role_id: true } });
      const user = await prisma.users.create({ data: { mongo_id: 'review529-' + randomUUID(), nickname: 'lock-only fixture', tag_list: [], role_id: admin.role_id } });
      const survey = await prisma.surveys.create({ data: { title: 'FK lock fixture', created_by: user.id } });
      const client = new Client({ connectionString: database.toString() });
      let releaseUpload;
      let uploadEntered;
      const entered = new Promise(resolve => { uploadEntered = resolve; });
      const held = new Promise(resolve => { releaseUpload = resolve; });
      const original = r2.uploadToR2Api;
      let uploading;
      try {
        await client.connect();
        r2.uploadToR2Api = async () => { uploadEntered(); await held; return { data: { url: 'http://127.0.0.1:16532/review529-lock-fixture.png' } }; };
        uploading = managedSurveyService.uploadImage(user.id, { size: 8, buffer: Buffer.from([137,80,78,71,13,10,26,10]), mimetype: 'image/png' });
        await entered;
        await client.query('SET statement_timeout = 750');
        await client.query('INSERT INTO survey_response_deletion_audits(survey_id,actor_id) VALUES($1,$2)', [survey.id, user.id]);
        assert.equal(await prisma.survey_response_deletion_audits.count({ where: { survey_id: survey.id } }), 1);
      } finally {
        releaseUpload();
        if (uploading) await uploading;
        r2.uploadToR2Api = original;
        await client.end();
        await prisma.surveys.delete({ where: { id: survey.id } });
        await prisma.users.delete({ where: { id: user.id } });
      }
    });
  } finally {
    for (const id of cleanup) await request('DELETE', `/api/v1/admin/surveys/${id}`);
    await prisma.$disconnect();
  }
  console.log(`RESULT ${3 - failures.length}/3 passed`);
  process.exit(failures.length ? 1 : 0);
})().catch(error => { console.error(error); process.exit(1); });
