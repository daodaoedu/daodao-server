import { Router, RequestHandler } from 'express';
import { adminSurveyController } from '../controllers/admin-survey.controller';
import { authenticateAny } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission.middleware';

const router = Router();

router.use(authenticateAny as RequestHandler, requireAdmin as RequestHandler);

router.get('/surveys', adminSurveyController.listAll as RequestHandler);
router.get('/surveys/:id', adminSurveyController.getById as RequestHandler);
router.patch('/surveys/:id/status', adminSurveyController.updateStatus as RequestHandler);
router.delete('/surveys/:id', adminSurveyController.deleteSurvey as RequestHandler);
router.get('/surveys/:id/responses', adminSurveyController.listResponses as RequestHandler);
router.delete('/surveys/:id/responses/:responseId', adminSurveyController.deleteResponse as RequestHandler);
router.post('/surveys', adminSurveyController.createSurvey as RequestHandler);
router.put('/surveys/:id', adminSurveyController.updateSurvey as RequestHandler);
router.get('/surveys/:id/responses/:responseId', adminSurveyController.getResponseDetail as RequestHandler);

export default router;
