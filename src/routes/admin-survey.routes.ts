import { Router, RequestHandler } from 'express';
import { adminSurveyController } from '../controllers/admin-survey.controller';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticate as RequestHandler, authorizeRoles(['admin']) as unknown as RequestHandler);

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
