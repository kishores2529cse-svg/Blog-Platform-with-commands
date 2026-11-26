import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  listUsers,
  updateUserRole,
} from '../controllers/user.controller';
import { authenticate, optionalAuthenticate, requireRoles } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { updateProfileSchema, changePasswordSchema } from '../schemas/validation.schemas';

const router = Router();

// Public / Authenticated read profile by username
router.get('/profile/:username', optionalAuthenticate, getProfile);

// Authenticated current user actions
router.put('/profile', authenticate, validateRequest(updateProfileSchema), updateProfile);
router.put('/change-password', authenticate, validateRequest(changePasswordSchema), changePassword);

// Admin-only user management
router.get('/', authenticate, requireRoles('ADMIN'), listUsers);
router.put('/:id/role', authenticate, requireRoles('ADMIN'), updateUserRole);

export default router;
