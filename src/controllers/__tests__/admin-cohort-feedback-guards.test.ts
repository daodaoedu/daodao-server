import express from 'express';
import request from 'supertest';
import { prismaMock } from '@tests/utils/prisma-mock';
import { globalErrorHandler } from '../../middleware/error.middleware';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { adminSurveyController } from '../admin-survey.controller';

const app = express();
app.use(express.json());
app.patch('/surveys/:id/status', adminSurveyController.updateStatus);
app.put('/surveys/:id', adminSurveyController.updateSurvey);
app.delete('/surveys/:id', adminSurveyController.deleteSurvey);
app.get('/surveys/:id', adminSurveyController.getSurvey);
app.get('/surveys/:id/responses', adminSurveyController.listResponses);
app.get('/surveys/:id/responses/:responseId', adminSurveyController.getResponse);
app.delete('/surveys/:id/responses/:responseId', adminSurveyController.deleteResponse);
app.get('/surveys/:id/analytics', adminSurveyController.getAnalytics);
app.use(globalErrorHandler);

const existingSurvey = { id: 471, status: 'active', is_anonymous: true, updated_at: new Date(), created_at: new Date(), questions: [], _count: { responses: 0 } };
describe('generic admin survey endpoints cannot mutate or inspect mapped cohort feedback', () => {
  beforeEach(() => {
    prismaMock.cohort_feedback_surveys.findUnique.mockResolvedValue({ cohort_id: 471, survey_id: 471 } as never);
    prismaMock.surveys.findUnique.mockResolvedValue(existingSurvey as never);
    prismaMock.surveys.update.mockResolvedValue(existingSurvey as never);
    prismaMock.surveys.delete.mockResolvedValue(existingSurvey as never);
  });
  it('refuses changing the anonymous flag through generic admin update', async () => {
    const result = await request(app).put('/surveys/471').send({ is_anonymous: false }).expect(403);
    expect(result.body.success).toBe(false);
    expect(prismaMock.surveys.update).not.toHaveBeenCalled();
  });
  it('refuses closing the feedback survey through generic admin status update', async () => {
    await request(app).patch('/surveys/471/status').send({ status: 'closed' }).expect(403);
    expect(prismaMock.surveys.update).not.toHaveBeenCalled();
  });
  it('refuses deleting the feedback questionnaire and its completion/answer rows', async () => {
    await request(app).delete('/surveys/471').expect(403);
    expect(prismaMock.surveys.delete).not.toHaveBeenCalled();
  });
  it.each(['/surveys/471', '/surveys/471/responses', '/surveys/471/responses/5', '/surveys/471/analytics'])('rejects generic admin read path %s', async path => {
    const result = await request(app).get(path).expect(403);
    expect(result.body.data).toBeNull();
    expect(prismaMock.survey_responses.findMany).not.toHaveBeenCalled();
    expect(prismaMock.survey_answers.findMany).not.toHaveBeenCalled();
    expect(prismaMock.cohort_feedback_answers.findMany).not.toHaveBeenCalled();
  });
  it('refuses the generic admin response delete path', async () => {
    await request(app).delete('/surveys/471/responses/5').expect(403);
    expect(prismaMock.survey_responses.delete).not.toHaveBeenCalled();
  });
  it('preserves ordinary admin updates for unmapped legacy questionnaires', async () => {
    prismaMock.cohort_feedback_surveys.findUnique.mockResolvedValue(null);
    const result = await request(app).put('/surveys/471').send({ is_anonymous: false }).expect(200);
    expect(result.body.data.updated).toBe(true);
    expect(prismaMock.surveys.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ is_anonymous: false }) }));
  });
});
