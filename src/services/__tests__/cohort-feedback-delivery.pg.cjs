/** 真實 PostgreSQL、BullMQ 及本機 SMTP sink 的期末回饋寄送回歸。 */
const assert = require('node:assert/strict');
const { randomUUID, randomInt } = require('node:crypto');

const databaseUrl = process.env.FEEDBACK_TEST_DATABASE_URL;
if (!databaseUrl) throw new Error('Set FEEDBACK_TEST_DATABASE_URL to the isolated issue database');
const target = new URL(databaseUrl);
if (target.hostname !== '127.0.0.1' || target.port !== '5571' || target.pathname !== '/daodao471') {
  throw new Error('Refusing a database outside the local issue-owned PostgreSQL');
}
// Pin every transport before importing modules; copied workspace .env cannot enable external delivery.
Object.assign(process.env, {
  DATABASE_URL: databaseUrl, NODE_ENV: 'test', APP_ENV: 'dev',
  REDIS_HOST: '127.0.0.1', REDIS_PORT: '6371', REDIS_QUEUE_DB: '13', REDIS_PASSWORD: '',
  SMTP_HOST: '127.0.0.1', SMTP_PORT: '1071', SMTP_SECURE: 'false',
  EMAIL_ADDRESS: 'feedback-test@example.invalid', EMAIL_PASSWORD: '',
  FRONTEND_URL: 'http://127.0.0.1:3071', BACKEND_URL: 'http://127.0.0.1:4071',
  DISABLE_SCHEDULED_JOBS: 'true',
});
require('ts-node').register({ transpileOnly: true });
require('tsconfig-paths/register');
const { Queue } = require('bullmq');
const { prisma } = require('../database/prisma.service');
const { createCohortFeedbackSurvey } = require('../cohort-feedback.service');
const { enqueueCohortFeedbackSurvey, refreshCohortFeedbackDelivery, cohortFeedbackReceiptKey } = require('../cohort-feedback-delivery.service');
const { EMAIL_QUEUE_NAME, setEmailQueue } = require('../../queues/email.queue');
const { getQueueConnection, closeQueueConnection } = require('../../queues/connection');
const { createEmailWorker } = require('../../queues/email.worker');

const marker = `f471d-${randomUUID()}`;
const userIds = [];
const cohortIds = [];
const surveyIds = [];
const jobIds = new Set();
let organizationId, programId, queue, worker;
let checks = 0;
const check = async (name, fn) => { await fn(); checks++; console.log(`PASS ${name}`); };
const logsFor = cohortId => prisma.email_logs.findMany({ where: { entity_type: 'cohort_feedback', entity_id: cohortId, email_code: 'CF01' }, orderBy: { id: 'asc' } });
const mappingFor = cohortId => prisma.cohort_feedback_surveys.findUniqueOrThrow({ where: { cohort_id: cohortId } });
async function waitFor(name, fn) {
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    const result = await fn();
    if (result) return result;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${name}`);
}
async function ownedMessages() {
  const response = await fetch('http://127.0.0.1:8071/api/v1/messages?limit=1000');
  assert.equal(response.ok, true, 'Local SMTP sink API is available');
  const body = await response.json();
  return body.messages.filter(message => message.To.some(to => to.Address.includes(marker)));
}
async function setup() {
  const role = await prisma.roles.findFirstOrThrow();
  for (let i = 0; i < 4; i++) {
    const user = await prisma.users.create({ data: { id: randomInt(500000000, 800000000), mongo_id: `${marker}-${i}`, nickname: `回饋寄送 ${i}`, tag_list: [], role_id: role.id } });
    userIds.push(user.id);
  }
  const org = await prisma.organization.create({ data: { id: randomInt(500000000, 800000000), name: marker, organization_members: { create: { user_id: userIds[0], role: 'owner' } } } });
  organizationId = org.id;
  const program = await prisma.programs.create({ data: { id: randomInt(500000000, 800000000), organization_id: org.id, name: marker } });
  programId = program.id;
  for (let i = 0; i < 5; i++) {
    const cohort = await prisma.cohorts.create({ data: { id: randomInt(500000000, 800000000), program_id: program.id, slug: `${marker}-${i}`, display_name: `寄送驗證 ${i}`, start_date: new Date('2026-01-01'), end_date: new Date('2026-01-31'), status: 'published' } });
    cohortIds.push(cohort.id);
    const recipients = i === 0 || i === 4 ? userIds.slice(1, 3) : userIds.slice(3);
    await prisma.cohort_enrollments.createMany({ data: recipients.map((userId, index) => ({ cohort_id: cohort.id, user_id: userId, email: `${marker}-${i}-${index}@example.invalid`, status: 'joined', role: 'member' })) });
    await createCohortFeedbackSurvey(cohort.id, userIds[0], new Date('2026-02-01'));
    surveyIds.push((await mappingFor(cohort.id)).survey_id);
  }
}
async function rememberJobs(cohortId) {
  const logs = await logsFor(cohortId);
  for (const log of logs) jobIds.add(`cohort-feedback-email-${log.id}`);
  return logs;
}
async function main() {
  await setup();
  const successCohort = cohortIds[0];
  const failedCohort = cohortIds[1];
  await check('queue unavailable retains complete pending outbox with no false sent state', async () => {
    assert.equal(queue, undefined);
    await assert.rejects(enqueueCohortFeedbackSurvey(successCohort), /queue is not initialized/);
    const logs = await rememberJobs(successCohort);
    assert.equal(logs.length, 2);
    assert.ok(logs.every(log => log.status === 'pending' && log.sent_at === null));
    assert.equal((await mappingFor(successCohort)).delivery_state, 'pending');
    assert.equal((await ownedMessages()).length, 0);
  });
  queue = new Queue(EMAIL_QUEUE_NAME, { connection: getQueueConnection(), defaultJobOptions: { attempts: 1, removeOnComplete: false, removeOnFail: false } });
  await queue.waitUntilReady();
  setEmailQueue(queue);
  await check('outbox recovery and repeated enqueue produce one durable job per recipient', async () => {
    const before = (await logsFor(successCohort)).map(log => log.id);
    await enqueueCohortFeedbackSurvey(successCohort);
    await enqueueCohortFeedbackSurvey(successCohort);
    assert.deepEqual((await logsFor(successCohort)).map(log => log.id), before);
    assert.equal((await mappingFor(successCohort)).delivery_state, 'queued');
    const jobs = await queue.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed']);
    const own = jobs.filter(job => jobIds.has(job.id));
    assert.equal(own.length, 2);
    assert.ok(own.every(job => job.data.trackingToken === undefined));
    assert.equal((await ownedMessages()).length, 0);
    assert.ok((await logsFor(successCohort)).every(log => log.status === 'pending'));
  });
  await check('actual SMTP acceptance transitions recipient logs and aggregate survey state to sent', async () => {
    worker = createEmailWorker({ concurrency: 1 });
    await worker.waitUntilReady();
    await waitFor('two real SMTP messages and sent logs', async () => {
      const logs = await logsFor(successCohort);
      return logs.every(log => log.status === 'sent') && (await mappingFor(successCohort)).delivery_state === 'sent' && (await ownedMessages()).length === 2;
    });
    const mapping = await mappingFor(successCohort);
    assert.ok(mapping.delivered_at instanceof Date);
    assert.ok((await logsFor(successCohort)).every(log => log.sent_at instanceof Date));
    for (const message of await ownedMessages()) {
      const body = await (await fetch(`http://127.0.0.1:8071/api/v1/message/${message.ID}`)).json();
      assert.ok(body.HTML.includes('/survey/r/'));
      assert.equal(body.HTML.includes('/api/v1/email/track/open/'), false);
    }
  });
  await check('rerunning sent cohort does not enqueue or send duplicate emails', async () => {
    const before = (await logsFor(successCohort)).map(log => log.id);
    await enqueueCohortFeedbackSurvey(successCohort);
    await enqueueCohortFeedbackSurvey(successCohort);
    assert.deepEqual((await logsFor(successCohort)).map(log => log.id), before);
    assert.equal((await ownedMessages()).length, 2);
    const logs = await logsFor(successCohort);
    for (const log of logs) assert.equal(await (await queue.getJob(`cohort-feedback-email-${log.id}`)).getState(), 'completed');
  });
  await check('failed real worker attempt marks failed and never claims delivered', async () => {
    await worker.pause();
    await enqueueCohortFeedbackSurvey(failedCohort);
    const [log] = await rememberJobs(failedCohort);
    const job = await queue.getJob(`cohort-feedback-email-${log.id}`);
    await job.updateData({ ...job.data, to: 'not-an-email' });
    await worker.resume();
    await waitFor('worker failure persisted', async () => (await logsFor(failedCohort))[0].status === 'failed' && (await mappingFor(failedCohort)).delivery_state === 'failed');
    assert.equal(await job.getState(), 'failed');
    assert.equal((await mappingFor(failedCohort)).delivered_at, null);
    assert.equal((await logsFor(failedCohort))[0].sent_at, null);
    assert.equal((await ownedMessages()).length, 2);
  });
  await check('failed owned job can recover without another outbox row or a new job identity', async () => {
    await worker.pause();
    const [log] = await logsFor(failedCohort);
    const job = await queue.getJob(`cohort-feedback-email-${log.id}`);
    const enrollment = await prisma.cohort_enrollments.findFirstOrThrow({ where: { cohort_id: failedCohort, user_id: log.user_id } });
    await job.updateData({ ...job.data, to: enrollment.email });
    await enqueueCohortFeedbackSurvey(failedCohort);
    assert.equal((await logsFor(failedCohort)).length, 1);
    assert.equal((await mappingFor(failedCohort)).delivery_state, 'failed');
    await worker.resume();
    await waitFor('retried SMTP job sent', async () => (await logsFor(failedCohort))[0].status === 'sent' && (await mappingFor(failedCohort)).delivery_state === 'sent' && (await ownedMessages()).length === 3);
    assert.equal((await logsFor(failedCohort))[0].id, log.id);
    assert.equal(await job.getState(), 'completed');
  });
  await check('SMTP receipt repairs a failed status write without resending the accepted message', async () => {
    const receiptCohort = cohortIds[2];
    await worker.pause();
    await enqueueCohortFeedbackSurvey(receiptCohort);
    const [log] = await rememberJobs(receiptCohort);
    const jobId = `cohort-feedback-email-${log.id}`;
    const delegate = prisma.email_logs;
    const originalUpdate = delegate.update.bind(delegate);
    let injected = 0;
    delegate.update = async args => {
      if (args.where.id === log.id && args.data.status === 'sent' && injected === 0) {
        injected++;
        throw new Error('feedback471 injected post-SMTP status-write failure');
      }
      return originalUpdate(args);
    };
    try {
      await worker.resume();
      const completedJob = await waitFor('durable SMTP receipt despite log write failure', async () => {
        const current = await queue.getJob(jobId);
        return await current.getState() === 'completed' && current;
      });
      assert.equal(injected, 1);
      assert.deepEqual(completedJob.returnvalue, { cohortFeedbackDelivered: true });
      assert.equal((await logsFor(receiptCohort))[0].status, 'pending');
      assert.equal((await logsFor(receiptCohort))[0].sent_at, null);
      assert.equal((await mappingFor(receiptCohort)).delivery_state, 'queued');
      await waitFor('fourth accepted SMTP message', async () => (await ownedMessages()).length === 4);
    } finally {
      delegate.update = originalUpdate;
    }
    await enqueueCohortFeedbackSurvey(receiptCohort);
    assert.equal((await logsFor(receiptCohort))[0].status, 'sent');
    assert.equal((await mappingFor(receiptCohort)).delivery_state, 'sent');
    assert.equal((await ownedMessages()).length, 4);
    assert.equal((await logsFor(receiptCohort)).length, 1);
    assert.equal((await queue.getJob(jobId)).attemptsMade, 1);
    assert.equal((await ownedMessages()).filter(message => message.To.some(to => to.Address.endsWith('-2-0@example.invalid'))).length, 1);
  });
  await check('stale pending refresh cannot overwrite a newer sent mapping', async () => {
    // Both owned recipients have already been SMTP-accepted above. Rewind only
    // their DB status to inject the two-refresh interleaving deterministically.
    await prisma.email_logs.updateMany({ where: { entity_type: 'cohort_feedback', entity_id: successCohort }, data: { status: 'pending', sent_at: null } });
    await prisma.cohort_feedback_surveys.update({ where: { cohort_id: successCohort }, data: { delivery_state: 'queued', delivered_at: null } });
    const delegate = prisma.email_logs;
    const originalFindMany = delegate.findMany.bind(delegate);
    let releaseSnapshot;
    const snapshotRelease = new Promise(resolve => { releaseSnapshot = resolve; });
    let snapshotCaptured;
    const captured = new Promise(resolve => { snapshotCaptured = resolve; });
    let delayed = false;
    delegate.findMany = async args => {
      const rows = await originalFindMany(args);
      if (!delayed && args.where.entity_id === successCohort && args.select?.status) {
        delayed = true;
        assert.ok(rows.every(log => log.status === 'pending'));
        snapshotCaptured();
        await snapshotRelease;
      }
      return rows;
    };
    const staleRefresh = refreshCohortFeedbackDelivery(successCohort);
    try {
      await captured;
      await prisma.email_logs.updateMany({ where: { entity_type: 'cohort_feedback', entity_id: successCohort }, data: { status: 'sent', sent_at: new Date() } });
      await refreshCohortFeedbackDelivery(successCohort);
      const sentMapping = await mappingFor(successCohort);
      assert.equal(sentMapping.delivery_state, 'sent');
      assert.ok(sentMapping.delivered_at instanceof Date);
      releaseSnapshot();
      await staleRefresh;
      const finalMapping = await mappingFor(successCohort);
      assert.equal(finalMapping.delivery_state, 'sent');
      assert.equal(finalMapping.delivered_at.getTime(), sentMapping.delivered_at.getTime());
      assert.equal((await ownedMessages()).length, 4);
    } finally {
      releaseSnapshot();
      await staleRefresh;
      delegate.findMany = originalFindMany;
    }
  });
  await check('pruned BullMQ completion cannot erase SMTP acceptance and cause duplicate delivery', async () => {
    const receiptCohort = cohortIds[3];
    await worker.pause();
    await enqueueCohortFeedbackSurvey(receiptCohort);
    const [log] = await rememberJobs(receiptCohort);
    const jobId = `cohort-feedback-email-${log.id}`;
    const delegate = prisma.email_logs;
    const originalUpdate = delegate.update.bind(delegate);
    let injected = 0;
    delegate.update = async args => {
      if (args.where.id === log.id && args.data.status === 'sent' && injected === 0) {
        injected++;
        throw new Error('feedback471 injected status-write failure before completed-job pruning');
      }
      return originalUpdate(args);
    };
    try {
      await worker.resume();
      const accepted = await waitFor('SMTP acceptance and completed job before pruning', async () => {
        const job = await queue.getJob(jobId);
        return job && await job.getState() === 'completed' && job;
      });
      assert.equal(injected, 1);
      assert.equal((await logsFor(receiptCohort))[0].status, 'pending');
      await waitFor('fifth accepted SMTP message', async () => (await ownedMessages()).length === 5);
      await worker.pause();
      await accepted.remove();
      assert.equal(await queue.getJob(jobId), undefined);
      assert.equal(await (await queue.client).get(cohortFeedbackReceiptKey(log.id)), 'accepted');
    } finally {
      delegate.update = originalUpdate;
    }
    await enqueueCohortFeedbackSurvey(receiptCohort);
    assert.equal((await logsFor(receiptCohort))[0].status, 'sent');
    assert.equal((await mappingFor(receiptCohort)).delivery_state, 'sent');
    assert.equal(await queue.getJob(jobId), undefined, 'Recovery must not enqueue another SMTP job');
    assert.equal((await logsFor(receiptCohort)).length, 1);
    assert.equal(await (await queue.client).get(cohortFeedbackReceiptKey(log.id)), null);
    assert.equal((await ownedMessages()).filter(message => message.To.some(to => to.Address.endsWith('-3-0@example.invalid'))).length, 1);
    await worker.resume();
  });
  await check('departed pending recipient cannot hold current delivery state queued forever', async () => {
    const changingCohort = cohortIds[4];
    await worker.pause();
    setEmailQueue(null);
    try {
      await assert.rejects(enqueueCohortFeedbackSurvey(changingCohort), /queue is not initialized/);
    } finally {
      setEmailQueue(queue);
    }
    const logs = await rememberJobs(changingCohort);
    assert.equal(logs.length, 2);
    assert.ok(logs.every(log => log.status === 'pending'));
    const departed = logs.find(log => log.user_id === userIds[2]);
    const current = logs.find(log => log.user_id === userIds[1]);
    assert.ok(departed && current);
    await prisma.cohort_enrollments.updateMany({ where: { cohort_id: changingCohort, user_id: departed.user_id }, data: { status: 'exited' } });
    assert.equal(await prisma.cohort_enrollments.count({ where: { cohort_id: changingCohort, status: 'joined' } }), 1);
    await enqueueCohortFeedbackSurvey(changingCohort);
    assert.equal(await queue.getJob(`cohort-feedback-email-${departed.id}`), undefined);
    await worker.resume();
    await waitFor('only remaining joined recipient accepted', async () => {
      const rows = await logsFor(changingCohort);
      return rows.find(row => row.id === current.id).status === 'sent' && (await ownedMessages()).length === 6;
    });
    assert.equal((await logsFor(changingCohort)).find(log => log.id === departed.id).status, 'pending');
    assert.equal((await mappingFor(changingCohort)).delivery_state, 'sent');
    assert.equal((await ownedMessages()).filter(message => message.To.some(to => to.Address.endsWith('-4-1@example.invalid'))).length, 0);
    // With no currently reachable recipient, keep a pending survey pending;
    // historical sent rows must not make the empty current set look delivered.
    await prisma.cohort_enrollments.updateMany({ where: { cohort_id: changingCohort, user_id: current.user_id }, data: { email: null } });
    await prisma.cohort_feedback_surveys.update({ where: { cohort_id: changingCohort }, data: { delivery_state: 'pending', delivered_at: null } });
    await refreshCohortFeedbackDelivery(changingCohort);
    assert.equal((await mappingFor(changingCohort)).delivery_state, 'pending');
    assert.equal((await mappingFor(changingCohort)).delivered_at, null);
  });
  console.log(`PASS ${checks} real PostgreSQL/BullMQ/SMTP delivery checks`);
}
async function cleanup() {
  if (worker) await worker.close();
  if (queue) {
    for (const jobId of jobIds) {
      await (await queue.client).del(cohortFeedbackReceiptKey(Number(jobId.replace('cohort-feedback-email-', ''))));
      const job = await queue.getJob(jobId);
      if (job) await job.remove();
    }
    await queue.close();
  }
  const messages = await ownedMessages();
  if (messages.length) {
    const response = await fetch('http://127.0.0.1:8071/api/v1/messages', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ IDs: messages.map(message => message.ID) }) });
    assert.equal(response.ok, true, 'Remove only this run SMTP messages');
  }
  await prisma.email_logs.deleteMany({ where: { entity_type: 'cohort_feedback', entity_id: { in: cohortIds } } });
  await prisma.cohort_feedback_surveys.deleteMany({ where: { cohort_id: { in: cohortIds } } });
  await prisma.cohort_enrollments.deleteMany({ where: { cohort_id: { in: cohortIds } } });
  await prisma.cohorts.deleteMany({ where: { id: { in: cohortIds } } });
  await prisma.surveys.deleteMany({ where: { id: { in: surveyIds } } });
  if (programId) await prisma.programs.deleteMany({ where: { id: programId } });
  if (organizationId) await prisma.organization.deleteMany({ where: { id: organizationId } });
  await prisma.users.deleteMany({ where: { id: { in: userIds } } });
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  try { await cleanup(); } finally { await closeQueueConnection(); await prisma.$disconnect(); }
});
