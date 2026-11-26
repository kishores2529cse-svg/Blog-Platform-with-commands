import { Router } from 'express';
import {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  toggleLikePost,
  toggleBookmarkPost,
  getBookmarkedPosts,
} from '../controllers/post.controller';
import { authenticate, optionalAuthenticate, requireRoles } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createPostSchema, updatePostSchema } from '../schemas/validation.schemas';

const router = Router();

// Public post queries (with optional auth to indicate if user liked/bookmarked)
router.get('/', optionalAuthenticate, getPosts);
router.get('/bookmarks/all', authenticate, getBookmarkedPosts);
router.get('/:slug', optionalAuthenticate, getPostBySlug);

// Post creation & modification: AUTHOR or ADMIN
router.post('/', authenticate, requireRoles('AUTHOR', 'ADMIN'), validateRequest(createPostSchema), createPost);
router.put('/:id', authenticate, requireRoles('AUTHOR', 'ADMIN'), validateRequest(updatePostSchema), updatePost);
router.delete('/:id', authenticate, requireRoles('AUTHOR', 'ADMIN'), deletePost);

// Interaction endpoints: Any authenticated user (READER, AUTHOR, ADMIN)
router.post('/:id/like', authenticate, toggleLikePost);
router.post('/:id/bookmark', authenticate, toggleBookmarkPost);

export default router;
