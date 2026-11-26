import { Response, NextFunction } from 'express';
import prisma from '../db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getAnalyticsOverview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN';

    // If admin, system-wide metrics; if author, their own metrics
    const postFilter = isAdmin ? {} : { authorId: user.id };

    const [
      totalPublished,
      totalDrafts,
      totalViewsAggregate,
      totalComments,
      topPosts,
      totalUsers,
    ] = await Promise.all([
      prisma.post.count({
        where: { ...postFilter, status: 'PUBLISHED' },
      }),
      prisma.post.count({
        where: { ...postFilter, status: 'DRAFT' },
      }),
      prisma.post.aggregate({
        where: postFilter,
        _sum: { views: true },
      }),
      isAdmin
        ? prisma.comment.count()
        : prisma.comment.count({
            where: { post: { authorId: user.id } },
          }),
      prisma.post.findMany({
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
      isAdmin ? prisma.user.count() : Promise.resolve(0),
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
  } catch (error) {
    next(error);
  }
};
