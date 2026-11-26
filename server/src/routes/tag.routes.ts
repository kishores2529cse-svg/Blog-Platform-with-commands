import { Router } from 'express';
import { getTags, createTag } from '../controllers/tag.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createTagSchema } from '../schemas/validation.schemas';

const router = Router();

router.get('/', getTags);
router.post('/', authenticate, requireRoles('AUTHOR', 'ADMIN'), validateRequest(createTagSchema), createTag);

export default router;
