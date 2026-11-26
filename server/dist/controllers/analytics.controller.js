"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalyticsOverview = void 0;
const db_1 = __importDefault(require("../db"));
const getAnalyticsOverview = async (req, res, next) => {
    try {
        const user = req.user;
        const isAdmin = user.role === 'ADMIN';
        // If admin, system-wide metrics; if author, their own metrics
        const postFilter = isAdmin ? {} : { authorId: user.id };
        const [totalPublished, totalDrafts, totalViewsAggregate, totalComments, topPosts, totalUsers,] = await Promise.all([
            db_1.default.post.count({
                where: { ...postFilter, status: 'PUBLISHED' },
            }),
            db_1.default.post.count({
                where: { ...postFilter, status: 'DRAFT' },
            }),
            db_1.default.post.aggregate({
                where: postFilter,
                _sum: { views: true },
            }),
            isAdmin
                ? db_1.default.comment.count()
                : db_1.default.comment.count({
                    where: { post: { authorId: user.id } },
                }),
            db_1.default.post.findMany({
                where: { ...postFilter, status: 'PUBLISHED' },
                orderBy: { views: 'desc' },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    views: true,
                    publishedAt: true,
                    _count: {
                        select: { likes: true, comments: true },
                    },
                },
            }),
            isAdmin ? db_1.default.user.count() : Promise.resolve(0),
        ]);
        res.json({
            success: true,
            data: {
                stats: {
                    totalPublished,
                    totalDrafts,
                    totalViews: totalViewsAggregate._sum.views || 0,
                    totalComments,
                    ...(isAdmin && { totalUsers }),
                },
                topPosts: topPosts.map((p) => ({
                    id: p.id,
                    title: p.title,
                    slug: p.slug,
                    views: p.views,
                    likesCount: p._count.likes,
                    commentsCount: p._count.comments,
                    publishedAt: p.publishedAt,
                })),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAnalyticsOverview = getAnalyticsOverview;
