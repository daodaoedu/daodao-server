/** HTTP response contracts: real routing, serialization and service mapping; mocked persistence/auth. */
import '../config/openapi-registry';
import express, { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { prisma } from '../services/database/prisma.service';
import router from '../routes/cohort-join.routes';
import { globalErrorHandler } from '../middleware/error.middleware';
import { apiSuccessResponseSchema } from '../validators/api-response.validators';
import { cohortJoinInfoWireResponseSchema, cohortMemberHomeWireResponseSchema } from '../validators/cohort-join.validators';

jest.mock('../services/database/prisma.service', () => ({ prisma: {
  cohorts: { findUnique: jest.fn() }, cohort_enrollments: { count: jest.fn(), findFirst: jest.fn() },
  practices: { findMany: jest.fn() }, practice_checkins: { groupBy: jest.fn() }
} }));
jest.mock('../services/notification-event.service', () => ({ notificationEventService: {} }));
jest.mock('../services/chat-room.service', () => ({ appendSystemMessage: jest.fn() }));
jest.mock('../services/cohort-draft.service', () => ({ ensureCohortDrafts: jest.fn() }));
jest.mock('../controllers/cohort-membership.controller', () => ({ cohortMembershipController: { exit: jest.fn() } }));
jest.mock('../controllers/cohort-export.controller', () => ({ cohortExportController: { consent: jest.fn() } }));
jest.mock('../controllers/cohort-feed.controller', () => ({ cohortFeedController: { get: jest.fn() } }));
jest.mock('../middleware/cohort-content-lifecycle.middleware', () => ({ enforceCohortContentLifecycle: jest.fn() }));
jest.mock('../middleware/auth', () => ({ authenticateAny: (req: Request, _res: Response, next: NextFunction): void => {
  req.user = { id: 42 } as Request['user']; next();
} }));

const db = jest.mocked(prisma);
const token = '123e4567-e89b-12d3-a456-426614174000';
const app = express();
app.use('/api/v1/cohorts', router);
app.use(globalErrorHandler);
const privateUrl = 'https://meet.example.com/members-only';
/** Build complete database records; sensitive sentinels must never escape the public response. */
const cohort = {
  id: 8, display_name: '夏季期', start_date: new Date('2026-07-01'), end_date: new Date('2099-08-31'),
  join_deadline: null, capacity: 10, invite_message: 'private invitation', show_invite_message_on_signup: false,
  tagline: null, interaction_modes: ['sync'], meeting_url: privateUrl, location: null,
  fee_type: 'free', fee_amount: null, signup_method: 'island_form', external_signup_url: null,
  is_private: true, checkin_default_private: true, host_comment_default_private: false,
  status: 'published', join_paused: false,
  cohort_sessions: [{ id: 1, session_date: new Date('2026-07-01'), start_time: new Date('1970-01-01T10:00:00Z'), end_time: null, position: 0 }],
  program: { organization: { name: '島島', bio: null, external_link: null, internalToken: 'secret-org' } }
};

beforeEach(() => {
  db.cohorts.findUnique.mockResolvedValue(cohort as never);
  db.cohort_enrollments.count.mockResolvedValue(1);
  db.cohort_enrollments.findFirst.mockResolvedValue({ id: 99, export_opt_in: true, cohort: cohort } as never);
  db.practices.findMany.mockResolvedValue([{
    id: 900, external_id: token, title: '每日反思', practice_action: null, status: 'draft', creation_source: null,
    start_date: new Date('2026-07-01'), end_date: null, progress_percentage: 0, theme_color: null
  }] as never);
  db.practice_checkins.groupBy.mockResolvedValue([]);
});

it('validates the entire public HTTP response and excludes member-only and internal fields', async () => {
  const res = await request(app).get(`/api/v1/cohorts/join/${token}`).expect(200);
  expect(() => apiSuccessResponseSchema(cohortJoinInfoWireResponseSchema).parse(res.body)).not.toThrow();
  expect(res.body.data).not.toHaveProperty('meetingUrl');
  expect(res.body.data).not.toHaveProperty('meeting_url');
  expect(res.body.data.organization).not.toHaveProperty('internalToken');
  expect(res.text).not.toContain(privateUrl);
  expect(res.body.data.inviteMessage).toBeNull();
  expect(res.body.data.startDate).toBe('2026-07-01T00:00:00.000Z');
});

it('validates member response including nested nullable serialized dates and allowed meeting URL', async () => {
  const res = await request(app).get('/api/v1/cohorts/8').expect(200);
  expect(() => apiSuccessResponseSchema(cohortMemberHomeWireResponseSchema).parse(res.body)).not.toThrow();
  expect(res.body.data.meetingUrl).toBe(privateUrl);
  expect(res.body.data.practices[0].startDate).toBe('2026-07-01T00:00:00.000Z');
  expect(res.body.data.practices[0].lastCheckinAt).toBeNull();
  expect(res.body.data.organization).not.toHaveProperty('internalToken');
  expect(db.cohort_enrollments.findFirst).toHaveBeenCalledWith(expect.objectContaining({
    where: { cohort_id: 8, user_id: 42, status: 'joined' }
  }));
});

it('returns no member content when there is no joined enrollment', async () => {
  db.cohort_enrollments.findFirst.mockResolvedValue(null);
  const res = await request(app).get('/api/v1/cohorts/8').expect(404);
  expect(res.body.data).toBeNull();
  expect(res.text).not.toContain(privateUrl);
  expect(db.practices.findMany).not.toHaveBeenCalled();
});

it('publishes invitation text only when its existing visibility flag is enabled', async () => {
  db.cohorts.findUnique.mockResolvedValue({ ...cohort, show_invite_message_on_signup: true } as never);
  const res = await request(app).get(`/api/v1/cohorts/join/${token}`).expect(200);
  expect(res.body.data.inviteMessage).toBe('private invitation');
});

it('rejects mutations of required fields, types, date format and private nested keys', async () => {
  const res = await request(app).get(`/api/v1/cohorts/join/${token}`).expect(200);
  const schema = apiSuccessResponseSchema(cohortJoinInfoWireResponseSchema);
  const wrongType = { ...res.body, data: { ...res.body.data, participantCount: '1' } };
  const missingField = { ...res.body, data: { ...res.body.data } };
  delete missingField.data.displayName;
  const invalidDate = { ...res.body, data: { ...res.body.data, startDate: 'yesterday' } };
  const privateField = { ...res.body, data: { ...res.body.data, meetingUrl: privateUrl } };
  const nestedPrivateField = { ...res.body, data: { ...res.body.data,
    organization: { ...res.body.data.organization, internalToken: 'secret' } } };
  for (const mutation of [wrongType, missingField, invalidDate, privateField, nestedPrivateField,
    { ...res.body, success: false }, { ...res.body, timestamp: 'yesterday' },
    { ...res.body, data: null }]) {
    expect(schema.safeParse(mutation).success).toBe(false);
  }
});
