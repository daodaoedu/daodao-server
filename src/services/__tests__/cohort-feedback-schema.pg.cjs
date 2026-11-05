/** Staged rollout regression: isolated local database, legacy schema then additive migration. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const base = new URL(process.env.FEEDBACK_TEST_DATABASE_URL || '');
if (base.hostname !== '127.0.0.1' || base.port !== '5571' || base.pathname !== '/daodao471') throw new Error('Requires the issue-owned local PostgreSQL');
const database = `feedback471_compat_${randomUUID().replaceAll('-', '')}`;
const storage = path.resolve(__dirname, '../../../../daodao-storage');
const sql = input => execFileSync('docker', ['exec', '-i', 'daodao-471-pg', 'psql', '-X', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-f', '-'], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
execFileSync('docker', ['exec', 'daodao-471-pg', 'createdb', '-U', 'postgres', database]);
let prisma;
let checks = 0;
const check = async (name, fn) => { await fn(); checks++; console.log(`PASS ${name}`); };
const invoke = (handler, request) => new Promise((resolve, reject) => {
  const res = { status() { return res; }, json(data) { resolve(data); return res; }, send(data) { resolve(data); return res; } };
  handler(request, res, reject);
});
async function main() {
  for (const file of fs.readdirSync(path.join(storage, 'schema')).filter(file => file.endsWith('.sql') && file !== '737_create_cohort_feedback_privacy.sql').sort()) sql(fs.readFileSync(path.join(storage, 'schema', file), 'utf8'));
  base.pathname = '/' + database;
  Object.assign(process.env, { DATABASE_URL: base.toString(), NODE_ENV: 'test', APP_ENV: 'dev', SMTP_HOST: '127.0.0.1', SMTP_PORT: '1071', SMTP_SECURE: 'false', EMAIL_ADDRESS: 'compat471@example.invalid', EMAIL_PASSWORD: '', FRONTEND_URL: 'http://localhost:3471', DISABLE_SCHEDULED_JOBS: 'true' });
  require('ts-node').register({ transpileOnly: true, compilerOptions: { allowJs: false } });
  require('tsconfig-paths/register');
  ({ prisma } = require('../database/prisma.service'));
  const { surveyService } = require('../survey.service');
  const feedback = require('../cohort-feedback.service');
  const { sendCohortFeedbackSurveys } = require('../cohort-feedback-survey.service');
  const delivery = require('../cohort-feedback-delivery.service');
  const { adminSurveyController } = require('../../controllers/admin-survey.controller');
  const role = await prisma.roles.findFirstOrThrow();
  const user = await prisma.users.create({ data: { mongo_id: database, nickname: '分段部署驗證', tag_list: [], role_id: role.id } });
  const survey = await prisma.surveys.create({ data: { title: '既有一般問卷', status: 'active', is_public: true, is_anonymous: false, created_by: user.id, questions: { create: { question_text: '既有文字題', question_type: 'text', is_required: true, position: 0, conditions: [] } } }, include: { questions: true } });
  const request = { params: { id: String(survey.id) }, query: {}, body: { title: '一般問卷仍可修改' }, user: { id: user.id } };
  await check('unmigrated legacy public read and submit remain valid in production and dev', async () => {
    for (const nodeEnv of ['prod', 'test']) {
      process.env.NODE_ENV = nodeEnv;
      const read = await surveyService.getPublic(survey.external_id, null);
      assert.equal(read.data.is_anonymous, false);
      assert.equal(read.data.cohort_feedback, undefined);
      const submitted = await surveyService.submitResponse(survey.external_id, null, { answers: [{ question_id: survey.questions[0].id, answer_text: '中文 ABC 舊問卷' }] });
      assert.equal(typeof submitted.data.response_id, 'number');
    }
    assert.equal(await prisma.survey_responses.count({ where: { survey_id: survey.id } }), 2);
  });
  await check('unmigrated creator and admin queries omit unavailable relation predicates', async () => {
    assert.equal((await surveyService.listMine(user.id)).data.length, 1);
    const listed = await invoke(adminSurveyController.listSurveys, request);
    assert.equal(listed.data.length, 1);
    const read = await invoke(adminSurveyController.getSurvey, request);
    assert.equal(read.data.id, survey.id);
    await invoke(adminSurveyController.updateSurvey, request);
    assert.equal((await prisma.surveys.findUniqueOrThrow({ where: { id: survey.id } })).title, '一般問卷仍可修改');
  });
  await check('new dev flow defers without schema instead of creating a legacy replacement', async () => {
    assert.equal(await feedback.hasCohortFeedbackSchema(), false);
    const count = await prisma.surveys.count();
    assert.equal(await sendCohortFeedbackSurveys(), 0);
    assert.equal(await delivery.recoverPendingCohortFeedbackEmails(), 0);
    await delivery.enqueueCohortFeedbackSurvey(471);
    await delivery.refreshCohortFeedbackDelivery(471);
    assert.equal(await prisma.surveys.count(), count);
    await assert.rejects(feedback.createCohortFeedbackSurvey(471, user.id, new Date()), error => error.statusCode === 404);
    await assert.rejects(feedback.getCohortFeedback(471, 471, user.id, { status: 'all', page: 1 }), error => error.statusCode === 404);
  });
  const migration = fs.readFileSync(path.join(storage, 'migrate/sql/100_create_cohort_feedback_privacy.sql'), 'utf8');
  await check('partial schema does not enable feedback; full additive migration becomes visible without restart', async () => {
    // Isolated database only: a table appearing first must not enable the flow.
    sql(migration.slice(0, migration.indexOf('CREATE TABLE IF NOT EXISTS "cohort_feedback_completions"')));
    assert.equal(await feedback.hasCohortFeedbackSchema(), false);
    sql(migration);
    assert.equal(await feedback.hasCohortFeedbackSchema(), true);
  });
  const org = await prisma.organization.create({ data: { name: database, organization_members: { create: { user_id: user.id, role: 'owner' } } } });
  const program = await prisma.programs.create({ data: { organization_id: org.id, name: database } });
  const cohort = await prisma.cohorts.create({ data: { program_id: program.id, slug: database.slice(0, 35), display_name: '部署後新問卷', status: 'published', start_date: new Date('2026-01-01'), end_date: new Date('2026-01-31') } });
  await feedback.createCohortFeedbackSurvey(cohort.id, user.id, new Date());
  const mapping = await prisma.cohort_feedback_surveys.findUniqueOrThrow({ where: { cohort_id: cohort.id }, include: { survey: true } });
  await check('disabled feature still rejects existing mapped feedback instead of generic fallback', async () => {
    process.env.NODE_ENV = 'prod';
    await assert.rejects(surveyService.getPublic(mapping.survey.external_id, user.id), error => error.statusCode === 404);
    await assert.rejects(surveyService.submitResponse(mapping.survey.external_id, user.id, { answers: [] }), error => error.statusCode === 404);
    await assert.rejects(feedback.assertGenericSurvey(mapping.survey_id), error => error.statusCode === 403);
    const list = await surveyService.listMine(user.id);
    assert.equal(list.data.some(row => row.id === mapping.survey_id), false);
    const adminList = await invoke(adminSurveyController.listSurveys, request);
    assert.equal(adminList.data.some(row => row.id === mapping.survey_id), false);
    await assert.rejects(invoke(adminSurveyController.updateSurvey, { ...request, params: { id: String(mapping.survey_id) } }), error => error.statusCode === 403);
    assert.equal((await surveyService.getPublic(survey.external_id)).data.is_anonymous, false);
  });
  console.log(`PASS ${checks} real PostgreSQL staged-schema compatibility checks`);
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (prisma) await prisma.$disconnect();
  execFileSync('docker', ['exec', 'daodao-471-pg', 'dropdb', '-U', 'postgres', '--force', database]);
});
