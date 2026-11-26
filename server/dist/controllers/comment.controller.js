"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleLikeComment = exports.deleteComment = exports.updateComment = exports.createComment = exports.getPostComments = void 0;
const db_1 = __importDefault(require("../db"));
const socket_handler_1 = require("../socket/socket.handler");
const getPostComments = async (req, res, next) => {
    try {
        const { postId } = req.params;
        // Fetch all comments for this post
        const comments = await db_1.default.comment.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                        role: true,
                    },
                },
                _count: {
                    select: { likes: true, replies: true },
                },
                ...(req.user && {
                    likes: {
                        where: { userId: req.user.id },
                        select: { userId: true },
                    },
                }),
            },
        });
        // Build hierarchical tree: parent comments with nested replies
        const commentMap = new Map();
        const rootComments = [];
        comments.forEach((c) => {
            const isLiked = req.user ? c.likes?.length > 0 : false;
            const formatted = {
                id: c.id,
                content: c.content,
                postId: c.postId,
                parentId: c.parentId,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
                author: c.author,
                likesCount: c._count.likes,
                isLiked,
                replies: [],
            };
            commentMap.set(c.id, formatted);
        });
        comments.forEach((c) => {
            const formatted = commentMap.get(c.id);
            if (c.parentId && commentMap.has(c.parentId)) {
                commentMap.get(c.parentId).replies.push(formatted);
            }
            else {
                rootComments.push(formatted);
            }
        });
        res.json({
            success: true,
            data: {
                comments: rootComments,
                total: comments.length,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPostComments = getPostComments;
const createComment = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const { content, parentId } = req.body;
        const userId = req.user.id;
        // Verify post exists
        const post = await db_1.default.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            res.status(404).json({
                success: false,
                error: { code: 'POST_NOT_FOUND', message: 'Post not found' },
            });
            return;
        }
        // If replying to a parent comment, verify it belongs to the same post
        if (parentId) {
            const parentComment = await db_1.default.comment.findUnique({
                where: { id: parentId },
            });
            if (!parentComment || parentComment.postId !== postId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PARENT_COMMENT',
                        message: 'Parent comment does not exist for this post',
                    },
                });
                return;
            }
        }
        const comment = await db_1.default.comment.create({
            data: {
                content,
                postId,
                authorId: userId,
                parentId: parentId || null,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                        role: true,
                    },
                },
            },
        });
        const responseData = {
            id: comment.id,
            content: comment.content,
            postId: comment.postId,
            parentId: comment.parentId,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            author: comment.author,
            likesCount: 0,
            isLiked: false,
            replies: [],
        };
        // Emit real-time Socket.IO event to all clients viewing this post
        try {
            const io = (0, socket_handler_1.getIO)();
            if (io) {
                io.to(`post:${postId}`).emit('comment:created', responseData);
            }
        }
        catch {
            // In tests or if socket not yet initialized, gracefully ignore
        }
        res.status(201).json({
            success: true,
            data: { comment: responseData },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createComment = createComment;
const updateComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        const existingComment = await db_1.default.comment.findUnique({
            where: { id },
            include: {
                author: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
                },
            },
        });
        if (!existingComment) {
            res.status(404).json({
                success: false,
                error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' },
            });
            return;
        }
        // Only author or admin can edit comment
        if (req.user.role !== 'ADMIN' && existingComment.authorId !== userId) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'You are not authorized to edit this comment' },
            });
            return;
        }
        const updated = await db_1.default.comment.update({
            where: { id },
            data: { content },
            include: {
                author: {
                    select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
                },
                _count: { select: { likes: true } },
            },
        });
        const responseData = {
            id: updated.id,
            content: updated.content,
            postId: updated.postId,
            parentId: updated.parentId,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
            author: updated.author,
            likesCount: updated._count.likes,
        };
        // Emit real-time Socket.IO event
        try {
            const io = (0, socket_handler_1.getIO)();
            if (io) {
                io.to(`post:${updated.postId}`).emit('comment:updated', responseData);
            }
        }
        catch {
            // ignore
        }
        res.json({
            success: true,
            data: { comment: responseData },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateComment = updateComment;
const deleteComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const existingComment = await db_1.default.comment.findUnique({
            where: { id },
            include: { post: true },
        });
        if (!existingComment) {
            res.status(404).json({
                success: false,
                error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' },
            });
            return;
        }
        // Allowed if:
        // 1. User is the author of the comment
        // 2. User is the author of the post (post owner moderation)
        // 3. User is an ADMIN
        const isCommentAuthor = existingComment.authorId === userId;
        const isPostAuthor = existingComment.post.authorId === userId;
        const isAdmin = req.user.role === 'ADMIN';
        if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'You are not authorized to delete this comment',
                },
            });
            return;
        }
        await db_1.default.comment.delete({ where: { id } });
        // Emit real-time Socket.IO event
        try {
            const io = (0, socket_handler_1.getIO)();
            if (io) {
                io.to(`post:${existingComment.postId}`).emit('comment:deleted', {
                    commentId: id,
                    postId: existingComment.postId,
                });
            }
        }
        catch {
            // ignore
        }
        res.json({
            success: true,
            message: 'Comment deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteComment = deleteComment;
const toggleLikeComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const comment = await db_1.default.comment.findUnique({ where: { id } });
        if (!comment) {
            res.status(404).json({
                success: false,
                error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' },
            });
            return;
        }
        const existingLike = await db_1.default.commentLike.findUnique({
            where: {
                userId_commentId: { userId, commentId: id },
            },
        });
        let liked = false;
        if (existingLike) {
            await db_1.default.commentLike.delete({
                where: {
                    userId_commentId: { userId, commentId: id },
                },
            });
            liked = false;
        }
        else {
            await db_1.default.commentLike.create({
                data: { userId, commentId: id },
            });
            liked = true;
        }
        const likesCount = await db_1.default.commentLike.count({ where: { commentId: id } });
        // Emit real-time like update
        try {
            const io = (0, socket_handler_1.getIO)();
            if (io) {
                io.to(`post:${comment.postId}`).emit('comment:like_updated', {
                    commentId: id,
                    likesCount,
                });
            }
        }
        catch {
            // ignore
        }
        res.json({
            success: true,
            data: { liked, likesCount },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleLikeComment = toggleLikeComment;
