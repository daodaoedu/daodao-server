/** 真實 PostgreSQL 行為回歸：僅可在本機專用測試資料庫執行。 */
const assert = require('node:assert/strict');
const { randomUUID, randomInt } = require('node:crypto');
const databaseUrl = process.env.FEEDBACK_TEST_DATABASE_URL;
if (!databaseUrl) throw new Error('Set FEEDBACK_TEST_DATABASE_URL to an isolated local test database');
const target = new URL(databaseUrl);
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || !/471|feedback.*test/.test(target.pathname)) throw new Error('Refusing non-local or non-test database');
process.env.DATABASE_URL = databaseUrl;
process.env.NODE_ENV = 'test';
process.env.APP_ENV = 'dev';
require('ts-node').register({ transpileOnly: true, compilerOptions: { allowJs: false } });
require('tsconfig-paths/register');
const { prisma } = require('../database/prisma.service');
const { createCohortFeedbackSurvey, getCohortFeedbackMetadata, submitCohortFeedback, getCohortFeedback, isCohortFeedbackEnabled, shuffleFeedbackTexts } = require('../cohort-feedback.service');
const { surveyService } = require('../survey.service');
const { adminSurveyController } = require('../../controllers/admin-survey.controller');
const { cohortFeedbackResponseSchema, cohortFeedbackQuerySchema } = require('../../validators/cohort-feedback.validators');
const marker = `feedback471-${randomUUID()}`;
const userIds = [];
let organizationId, programId, cohortId, surveyId, externalId, roleId, legacySurveyId;
let checks = 0;
const check = (name, fn) => Promise.resolve().then(fn).then(() => { checks++; console.log(`PASS ${name}`); });
const expectStatus = async (promise, status) => assert.rejects(promise, error => error.statusCode === status);

async function setup() {
  roleId = (await prisma.roles.findFirstOrThrow()).id;
  for (let i = 0; i < 10; i++) {
    const user = await prisma.users.create({ data: { id: randomInt(500000000, 800000000), mongo_id: `${marker}-${i}`, nickname: `測試學員 ${i}`, tag_list: [], role_id: roleId } });
    userIds.push(user.id);
  }
  const org = await prisma.organization.create({ data: { id: randomInt(500000000, 800000000), name: marker, organization_members: { create: [{ user_id: userIds[0], role: 'owner' }] } } });
  organizationId = org.id;
  const program = await prisma.programs.create({ data: { id: randomInt(500000000, 800000000), organization_id: org.id, name: marker } });
  programId = program.id;
  const cohort = await prisma.cohorts.create({ data: { id: randomInt(500000000, 800000000), program_id: program.id, slug: marker, display_name: '期末回饋測試', start_date: new Date('2026-01-01'), end_date: new Date('2026-01-31'), status: 'published' } });
  cohortId = cohort.id;
  await prisma.cohort_enrollments.createMany({ data: userIds.slice(2, 9).map((id, i) => ({ cohort_id: cohortId, user_id: id, email: `${marker}-${i}@example.invalid`, status: 'joined', role: i === 0 ? 'assistant' : 'member' })) });
  await createCohortFeedbackSurvey(cohortId, userIds[0], new Date('2026-02-01'));
  const mapping = await prisma.cohort_feedback_surveys.findUniqueOrThrow({ where: { cohort_id: cohortId }, include: { survey: true } });
  surveyId = mapping.survey_id; externalId = mapping.survey.external_id;
}

async function main() {
  await setup();
  const questions = await prisma.questions.findMany({ where: { survey_id: surveyId }, orderBy: { position: 'asc' } });
  const body = { answers: [{ question_id: questions[0].id, rating_value: 4 }] };
  await check('dev gating never enabled in production even APP_ENV=dev', () => {
    for (const alias of ['prod', 'production']) { process.env.NODE_ENV = alias; assert.equal(isCohortFeedbackEnabled(), false); } process.env.NODE_ENV = 'test';
  });
  await check('new questionnaire has four required/optional questions and anonymous version mapping', async () => {
    assert.equal(questions.length, 4); assert.deepEqual(questions.map(q => q.is_required), [true, false, false, false]);
    const survey = await prisma.surveys.findUniqueOrThrow({ where: { id: surveyId } });
    assert.equal(survey.title, '活動回饋'); assert.equal(survey.is_anonymous, true);
  });
  await check('login, eligibility, initial completion states', async () => {
    assert.equal((await getCohortFeedbackMetadata(surveyId, null)).state, 'login_required');
    assert.equal((await getCohortFeedbackMetadata(surveyId, userIds[9])).state, 'ineligible');
    assert.equal((await getCohortFeedbackMetadata(surveyId, userIds[2])).state, 'ready');
    assert.equal((await surveyService.getPublic(externalId, userIds[2])).data.cohort_feedback.state, 'ready');
  });
  await check('anonymous and non-enrolled POST rejected without persisting answers', async () => {
    await expectStatus(surveyService.submitResponse(externalId, null, body), 401);
    await expectStatus(surveyService.submitResponse(externalId, userIds[9], body), 403);
    assert.equal(await prisma.cohort_feedback_answers.count({ where: { survey_id: surveyId } }), 0);
  });
  await check('missing rating, out-of-range rating, repeated question rejected', async () => {
    await expectStatus(submitCohortFeedback(surveyId, userIds[2], { answers: [{ question_id: questions[1].id, answer_text: '文字' }] }), 400);
    await expectStatus(submitCohortFeedback(surveyId, userIds[2], { answers: [{ question_id: questions[0].id, rating_value: 0 }] }), 400);
    await expectStatus(submitCohortFeedback(surveyId, userIds[2], { answers: [body.answers[0], body.answers[0]] }), 400);
    assert.equal(await prisma.cohort_feedback_completions.count({ where: { cohort_id: cohortId } }), 0);
  });
  await check('only owner can view; creator authority cannot bypass owner', async () => {
    await expectStatus(getCohortFeedback(programId, cohortId, userIds[1], { status: 'all', page: 1 }), 403);
    await expectStatus(getCohortFeedback(programId, cohortId, userIds[2], { status: 'all', page: 1 }), 403);
    await expectStatus(getCohortFeedback(programId, cohortId, userIds[9], { status: 'all', page: 1 }), 403);
    await expectStatus(getCohortFeedback(programId + 100000, cohortId, userIds[0], { status: 'all', page: 1 }), 404);
  });
  await check('pending delivery is not falsely waiting; sent zero answers shows waiting and max five people', async () => {
    let result = await getCohortFeedback(programId, cohortId, userIds[0], { status: 'all', page: 1 });
    assert.equal(result.state, 'sending'); assert.equal(result.eligibleCount, 7); assert.equal(result.participants.length, 5); assert.equal(result.pagination.totalPages, 2);
    await prisma.cohort_feedback_surveys.update({ where: { cohort_id: cohortId }, data: { delivery_state: 'sent' } });
    result = await getCohortFeedback(programId, cohortId, userIds[0], { status: 'all', page: 2 });
    assert.equal(result.state, 'waiting'); assert.equal(result.participants.length, 2); assert.equal(result.completedCount, 0);
  });
  await check('simultaneous same-user submit is exactly once, blank optional fields allowed', async () => {
    const value = { ...body, answers: [...body.answers, { question_id: questions[1].id, answer_text: '  ' }], started_at: new Date().toISOString(), session_key: 'do-not-save-me' };
    const results = await Promise.allSettled([surveyService.submitResponse(externalId, userIds[2], value), surveyService.submitResponse(externalId, userIds[2], value)]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    const rejected = results.find(r => r.status === 'rejected'); assert.equal(rejected.reason.statusCode, 409);
    assert.equal(await prisma.cohort_feedback_completions.count({ where: { cohort_id: cohortId } }), 1);
    assert.equal(await prisma.cohort_feedback_answers.count({ where: { survey_id: surveyId } }), 1);
    assert.equal(await prisma.survey_responses.count({ where: { survey_id: surveyId } }), 0);
    assert.equal(await prisma.survey_partial_submissions.count({ where: { survey_id: surveyId } }), 0);
    assert.equal((await getCohortFeedbackMetadata(surveyId, userIds[2])).state, 'completed');
    const firstResult = await getCohortFeedback(programId, cohortId, userIds[0], { status: 'all', page: 1 });
    assert.equal(firstResult.state, 'available'); assert.equal(firstResult.totalResponses, 1); assert.equal(firstResult.ratingDistribution[3].count, 1);
  });
  await check('failed answer write rolls back completion; retry can succeed', async () => {
    // This one-off failure injector exists only in this isolated local database.
    await prisma.$executeRawUnsafe(`CREATE OR REPLACE FUNCTION feedback471_fail_answer() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.answer_text = '__feedback471_fail__' THEN RAISE EXCEPTION 'feedback test injected failure'; END IF; RETURN NEW; END $$`);
    await prisma.$executeRawUnsafe(`CREATE TRIGGER feedback471_fail_answer BEFORE INSERT ON cohort_feedback_answers FOR EACH ROW EXECUTE FUNCTION feedback471_fail_answer()`);
    try {
      await assert.rejects(submitCohortFeedback(surveyId, userIds[3], { answers: [...body.answers, { question_id: questions[1].id, answer_text: '__feedback471_fail__' }] }), /feedback test injected failure/);
      assert.equal(await prisma.cohort_feedback_completions.count({ where: { cohort_id: cohortId, user_id: userIds[3] } }), 0);
      assert.equal(await prisma.cohort_feedback_answers.count({ where: { survey_id: surveyId } }), 1);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER feedback471_fail_answer ON cohort_feedback_answers');
      await prisma.$executeRawUnsafe('DROP FUNCTION feedback471_fail_answer()');
    }
    await submitCohortFeedback(surveyId, userIds[3], { answers: [...body.answers, { question_id: questions[1].id, answer_text: '  中文 ABC 空白  ' }] });
  });
  await check('first response shown without minimum threshold; ratings and anonymous text rendered by question', async () => {
    const result = cohortFeedbackResponseSchema.parse(await getCohortFeedback(programId, cohortId, userIds[0], { status: 'completed', page: 1 }));
    assert.equal(result.state, 'available'); assert.equal(result.completedCount, 2); assert.equal(result.eligibleCount, 7); assert.equal(result.totalResponses, 2);
    assert.deepEqual(result.ratingDistribution.map(r => r.count), [0, 0, 0, 2, 0]);
    assert.equal(result.participants.length, 2); assert.ok(result.participants.every(p => p.completed));
    assert.deepEqual(result.textQuestions[0].answers, ['中文 ABC 空白']);
    assert.deepEqual(Object.keys(result.textQuestions[0]).sort(), ['answers', 'questionId', 'title']);
    assert.equal(JSON.stringify(result).includes('completed_at'), false); assert.equal(JSON.stringify(result).includes('response_id'), false);
    const pending = await getCohortFeedback(programId, cohortId, userIds[0], { status: 'pending', page: 1 });
    assert.equal(pending.participants.length, 5); assert.ok(pending.participants.every(p => !p.completed));
  });
  await check('generic creator endpoints and tracking all blocked; no identities/times in answer schema', async () => {
    const calls = [() => surveyService.getById(surveyId, userIds[0]), () => surveyService.getAnalytics(surveyId, userIds[0]), () => surveyService.listResponses(surveyId, userIds[0]), () => surveyService.getResponse(surveyId, userIds[0], 1), () => surveyService.deleteResponse(surveyId, userIds[0], 1), () => surveyService.update(surveyId, userIds[0], { title: 'bad' }), () => surveyService.updateStatus(surveyId, userIds[0], { status: 'closed' }), () => surveyService.delete(surveyId, userIds[0]), () => surveyService.trackView(externalId), () => surveyService.trackPartial(externalId, { session_key: 'private', last_position: 1 })];
    for (const call of calls) await expectStatus(call(), 403);
    assert.equal((await surveyService.listMine(userIds[0])).data.some(s => s.id === surveyId), false);
    const columns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='cohort_feedback_answers' ORDER BY ordinal_position`;
    assert.deepEqual(columns.map(c => c.column_name).sort(), ['id', 'survey_id', 'question_id', 'rating_value', 'answer_text'].sort());
    const completionColumns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='cohort_feedback_completions'`;
    assert.deepEqual(completionColumns.map(c => c.column_name).sort(), ['cohort_id', 'user_id']);
  });
  await check('generic admin mutation and analytics paths refuse feedback without changing persisted rows', async () => {
    const before = await prisma.surveys.findUniqueOrThrow({ where: { id: surveyId }, select: { status: true, is_anonymous: true } });
    const invoke = async (handler, body = {}) => new Promise(resolve => {
      const res = { status() { return res; }, json(data) { resolve(data); return res; }, send(data) { resolve(data); return res; } };
      handler({ params: { id: String(surveyId), responseId: '1' }, body, query: {}, user: { id: userIds[0] } }, res, resolve);
    });
    for (const [handler, body] of [[adminSurveyController.updateSurvey, { is_anonymous: false }], [adminSurveyController.updateStatus, { status: 'closed' }], [adminSurveyController.deleteSurvey, {}], [adminSurveyController.deleteResponse, {}], [adminSurveyController.getSurvey, {}], [adminSurveyController.listResponses, {}], [adminSurveyController.getResponse, {}], [adminSurveyController.getAnalytics, {}]]) {
      const result = await invoke(handler, body); assert.equal(result.statusCode, 403);
    }
    const after = await prisma.surveys.findUniqueOrThrow({ where: { id: surveyId }, select: { status: true, is_anonymous: true } });
    assert.deepEqual(after, before);
    assert.equal(await prisma.cohort_feedback_answers.count({ where: { survey_id: surveyId } }), 3);
    assert.equal(await prisma.cohort_feedback_completions.count({ where: { cohort_id: cohortId } }), 2);
  });
  await check('revoking owner removes access immediately', async () => {
    await prisma.organization_members.deleteMany({ where: { organization_id: organizationId, user_id: userIds[0] } });
    await expectStatus(getCohortFeedback(programId, cohortId, userIds[0], { status: 'all', page: 1 }), 403);
    await prisma.organization_members.create({ data: { organization_id: organizationId, user_id: userIds[0], role: 'owner' } });
  });
  await check('old non-anonymous survey remains unchanged and uses its original response storage', async () => {
    const legacy = await prisma.surveys.create({ data: { title: marker, created_by: userIds[0], status: 'active', is_public: true, is_anonymous: false, tags: [], questions: { create: { question_text: '舊問題', question_type: 'text', is_required: true, position: 0, conditions: [] } } }, include: { questions: true } });
    legacySurveyId = legacy.id;
    const read = await surveyService.getPublic(legacy.external_id, userIds[4]);
    assert.equal(read.data.is_anonymous, false); assert.equal(read.data.cohort_feedback, undefined);
    const submitted = await surveyService.submitResponse(legacy.external_id, userIds[4], { answers: [{ question_id: legacy.questions[0].id, answer_text: '舊版具名答案' }] });
    assert.ok(submitted.data.response_id);
    const saved = await prisma.survey_responses.findUniqueOrThrow({ where: { id: submitted.data.response_id } });
    assert.equal(saved.user_id, userIds[4]);
    assert.equal(await prisma.cohort_feedback_answers.count({ where: { survey_id: legacy.id } }), 0);
  });
  await check('query boundary and nonmutating independent shuffle preserve answers', () => {
    assert.equal(cohortFeedbackQuerySchema.safeParse({ page: 0 }).success, false);
    assert.equal(cohortFeedbackQuerySchema.safeParse({ status: 'anything' }).success, false);
    assert.deepEqual(cohortFeedbackQuerySchema.parse({}), { status: 'all', page: 1 });
    const original = ['a', 'b', 'a']; assert.deepEqual(shuffleFeedbackTexts(original).sort(), [...original].sort()); assert.deepEqual(original, ['a', 'b', 'a']);
  });
  console.log(`PASS ${checks} PostgreSQL behavior checks`);
}

async function cleanup() {
  if (cohortId) {
    await prisma.cohort_feedback_surveys.deleteMany({ where: { cohort_id: cohortId } });
    await prisma.cohort_enrollments.deleteMany({ where: { cohort_id: cohortId } });
    await prisma.cohorts.deleteMany({ where: { id: cohortId } });
  }
  if (surveyId) await prisma.surveys.deleteMany({ where: { id: surveyId } });
  if (legacySurveyId) await prisma.surveys.deleteMany({ where: { id: legacySurveyId } });
  if (programId) await prisma.programs.deleteMany({ where: { id: programId } });
  if (organizationId) await prisma.organization.deleteMany({ where: { id: organizationId } });
  await prisma.users.deleteMany({ where: { id: { in: userIds } } });
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { try { await cleanup(); } finally { await prisma.$disconnect(); } });
