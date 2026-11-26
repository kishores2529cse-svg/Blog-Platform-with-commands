import { Router } from 'express';
import { getAnalyticsOverview } from '../controllers/analytics.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/overview', authenticate, requireRoles('AUTHOR', 'ADMIN'), getAnalyticsOverview);

export default router;
