import { Router } from 'express';
import {
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLikeComment,
} from '../controllers/comment.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createCommentSchema, updateCommentSchema } from '../schemas/validation.schemas';

const router = Router({ mergeParams: true });

// Post comments routes: /api/posts/:postId/comments
router.get('/', optionalAuthenticate, getPostComments);
router.post('/', authenticate, validateRequest(createCommentSchema), createComment);

// Direct comment actions
export const commentActionsRouter = Router();
commentActionsRouter.put('/:id', authenticate, validateRequest(updateCommentSchema), updateComment);
commentActionsRouter.delete('/:id', authenticate, deleteComment);
commentActionsRouter.post('/:id/like', authenticate, toggleLikeComment);

export default router;
