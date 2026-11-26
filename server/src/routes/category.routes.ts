import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createCategorySchema, updateCategorySchema } from '../schemas/validation.schemas';

const router = Router();

router.get('/', getCategories);

// Category administration: ADMIN only
router.post('/', authenticate, requireRoles('ADMIN'), validateRequest(createCategorySchema), createCategory);
router.put('/:id', authenticate, requireRoles('ADMIN'), validateRequest(updateCategorySchema), updateCategory);
router.delete('/:id', authenticate, requireRoles('ADMIN'), deleteCategory);

export default router;
