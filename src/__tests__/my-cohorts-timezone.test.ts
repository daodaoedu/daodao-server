import express, { type Request, type Response } from 'express';
import request from 'supertest';
import { cohortJoinController } from '../controllers/cohort-join.controller';
import { globalErrorHandler } from '../middleware/error.middleware';
import { prisma } from '../services/database/prisma.service';

jest.mock('../services/database/prisma.service', () => ({ prisma: {
  cohort_enrollments: { findMany: jest.fn() }
} }));
jest.mock('../services/notification-event.service', () => ({ notificationEventService: {} }));
jest.mock('../services/chat-room.service', () => ({ appendSystemMessage: jest.fn() }));
jest.mock('../services/cohort-draft.service', () => ({ ensureCohortDrafts: jest.fn() }));

const app = express();
app.get('/cohorts', (req: Request, res: Response, next) => {
  req.user = { id: 42 } as Request['user'];
  return cohortJoinController.listMyCohorts(req, res, next);
});
app.use(globalErrorHandler);

const db = jest.mocked(prisma);

/** Cohorts remain listed before their start and after their end while enrollment is joined. */
const enrollment = (id: number, timezone: string, startDate: string, endDate: string) => ({
  joined_at: new Date('2026-01-01T00:00:00Z'),
  cohort: {
    id, display_name: `cohort-${id}`, timezone,
    start_date: new Date(startDate), end_date: new Date(endDate), status: 'published',
    program: { name: 'Program', organization: { name: 'Organization' } }
  }
});

it('returns each joined cohort timezone without dropping future or ended cohorts', async () => {
  db.cohort_enrollments.findMany.mockResolvedValue([
    enrollment(8, 'Pacific/Honolulu', '2099-01-01', '2099-02-01'),
    enrollment(9, 'Asia/Tokyo', '2001-01-01', '2001-02-01')
  ] as never);

  const res = await request(app).get('/cohorts').expect(200);

  expect(res.body.data).toEqual([
    expect.objectContaining({ cohortId: 8, timezone: 'Pacific/Honolulu', startDate: '2099-01-01T00:00:00.000Z' }),
    expect.objectContaining({ cohortId: 9, timezone: 'Asia/Tokyo', endDate: '2001-02-01T00:00:00.000Z' })
  ]);
  expect(db.cohort_enrollments.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { user_id: 42, status: 'joined' },
    select: expect.objectContaining({ cohort: expect.objectContaining({ select: expect.objectContaining({ timezone: true }) }) })
  }));
});

it('returns no cohorts for a user with no joined enrollment', async () => {
  db.cohort_enrollments.findMany.mockResolvedValue([]);
  const res = await request(app).get('/cohorts').expect(200);
  expect(res.body.data).toEqual([]);
});
