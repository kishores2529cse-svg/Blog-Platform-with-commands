"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_controller_1 = require("../controllers/post.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const validation_schemas_1 = require("../schemas/validation.schemas");
const router = (0, express_1.Router)();
// Public post queries (with optional auth to indicate if user liked/bookmarked)
router.get('/', auth_middleware_1.optionalAuthenticate, post_controller_1.getPosts);
router.get('/bookmarks/all', auth_middleware_1.authenticate, post_controller_1.getBookmarkedPosts);
router.get('/:slug', auth_middleware_1.optionalAuthenticate, post_controller_1.getPostBySlug);
// Post creation & modification: AUTHOR or ADMIN
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRoles)('AUTHOR', 'ADMIN'), (0, validate_middleware_1.validateRequest)(validation_schemas_1.createPostSchema), post_controller_1.createPost);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRoles)('AUTHOR', 'ADMIN'), (0, validate_middleware_1.validateRequest)(validation_schemas_1.updatePostSchema), post_controller_1.updatePost);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRoles)('AUTHOR', 'ADMIN'), post_controller_1.deletePost);
// Interaction endpoints: Any authenticated user (READER, AUTHOR, ADMIN)
router.post('/:id/like', auth_middleware_1.authenticate, post_controller_1.toggleLikePost);
router.post('/:id/bookmark', auth_middleware_1.authenticate, post_controller_1.toggleBookmarkPost);
exports.default = router;
