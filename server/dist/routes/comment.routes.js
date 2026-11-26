"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentActionsRouter = void 0;
const express_1 = require("express");
const comment_controller_1 = require("../controllers/comment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const validation_schemas_1 = require("../schemas/validation.schemas");
const router = (0, express_1.Router)({ mergeParams: true });
// Post comments routes: /api/posts/:postId/comments
router.get('/', auth_middleware_1.optionalAuthenticate, comment_controller_1.getPostComments);
router.post('/', auth_middleware_1.authenticate, (0, validate_middleware_1.validateRequest)(validation_schemas_1.createCommentSchema), comment_controller_1.createComment);
// Direct comment actions
exports.commentActionsRouter = (0, express_1.Router)();
exports.commentActionsRouter.put('/:id', auth_middleware_1.authenticate, (0, validate_middleware_1.validateRequest)(validation_schemas_1.updateCommentSchema), comment_controller_1.updateComment);
exports.commentActionsRouter.delete('/:id', auth_middleware_1.authenticate, comment_controller_1.deleteComment);
exports.commentActionsRouter.post('/:id/like', auth_middleware_1.authenticate, comment_controller_1.toggleLikeComment);
exports.default = router;
