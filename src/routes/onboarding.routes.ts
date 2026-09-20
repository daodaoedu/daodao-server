import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { getActiveFlow, submitFlowResponse } from '@/controllers/onboarding.controller';

const router = Router();

// ── Public routes (no auth required) ─────────────────────────────────────────

router.get('/flows/active', getActiveFlow);

// ── Authenticated routes ──────────────────────────────────────────────────────

router.use(authenticate);

router.post('/flows/:id/responses', submitFlowResponse);

export default router;
