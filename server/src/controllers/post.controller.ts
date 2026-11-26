import { Response, NextFunction } from 'express';
import prisma from '../db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { slugify, calculateReadingTime } from '../utils/slug.utils';

export const getPosts = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const {
      search,
      category,
      tag,
      author,
      status,
      sort = 'latest',
      featured,
    } = req.query as {
      search?: string;
      category?: string;
      tag?: string;
      author?: string;
      status?: string;
      sort?: string;
      featured?: string;
    };

    // Filter conditions
    const where: any = {};

    // RBAC visibility logic:
    // If not authenticated or reader, can only see PUBLISHED posts
    // Authors/Admins can see their own drafts, or admins can see all
    if (!req.user || req.user.role === 'READER') {
      where.status = 'PUBLISHED';
    } else if (req.user.role === 'AUTHOR') {
      if (status && status !== 'PUBLISHED') {
        where.authorId = req.user.id;
        where.status = status;
      } else if (!status) {
        where.OR = [
          { status: 'PUBLISHED' },
          { authorId: req.user.id },
        ];
      }
    } else if (req.user.role === 'ADMIN') {
      if (status) {
        where.status = status;
      }
    }

    // Search query across title, excerpt, and content
    if (search && search.trim()) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search.trim() } },
            { excerpt: { contains: search.trim() } },
            { content: { contains: search.trim() } },
          ],
        },
      ];
    }

    // Category filter
    if (category) {
      where.category = {
        OR: [{ slug: category }, { id: category }],
      };
    }

    // Tag filter
    if (tag) {
      where.tags = {
        some: {
          tag: {
            OR: [{ slug: tag }, { name: tag }, { id: tag }],
          },
        },
      };
    }

    // Author filter
    if (author) {
      where.author = {
        OR: [{ username: author }, { id: author }],
      };
    }

    // Featured filter
    if (featured === 'true') {
      where.featured = true;
    }

    // Sorting
    let orderBy: any = { publishedAt: 'desc' };
    if (sort === 'oldest') {
      orderBy = { publishedAt: 'asc' };
    } else if (sort === 'popular' || sort === 'views') {
      orderBy = { views: 'desc' };
    } else if (sort === 'title') {
      orderBy = { title: 'asc' };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          ...(req.user && {
            likes: {
              where: { userId: req.user.id },
              select: { userId: true },
            },
            bookmarks: {
              where: { userId: req.user.id },
              select: { userId: true },
            },
          }),
        },
      }),
      prisma.post.count({ where }),
    ]);

    // Format post list response
    const formattedPosts = posts.map((post) => {
      const isLiked = req.user ? (post as any).likes?.length > 0 : false;
      const isBookmarked = req.user ? (post as any).bookmarks?.length > 0 : false;

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImage: post.coverImage,
        readingTime: post.readingTime,
        status: post.status,
        featured: post.featured,
        views: post.views,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: post.author,
        category: post.category,
        tags: post.tags.map((t) => t.tag),
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
        isLiked,
        isBookmarked,
      };
    });

    res.json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPostBySlug = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;

    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            role: true,
            website: true,
            github: true,
            twitter: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        ...(req.user && {
          likes: {
            where: { userId: req.user.id },
            select: { userId: true },
          },
          bookmarks: {
            where: { userId: req.user.id },
            select: { userId: true },
          },
        }),
      },
    });

    if (!post) {
      res.status(404).json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Post not found',
        },
      });
      return;
    }

    // Permission check for draft posts
    if (post.status !== 'PUBLISHED') {
      if (!req.user || (req.user.role !== 'ADMIN' && req.user.id !== post.authorId)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'This post is not published',
          },
        });
        return;
      }
    }

    // Increment view count asynchronously
    await prisma.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    const isLiked = req.user ? (post as any).likes?.length > 0 : false;
    const isBookmarked = req.user ? (post as any).bookmarks?.length > 0 : false;

    res.json({
      success: true,
      data: {
        post: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          readingTime: post.readingTime,
          status: post.status,
          featured: post.featured,
          views: post.views + 1,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          author: post.author,
          category: post.category,
          tags: post.tags.map((t) => t.tag),
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
          isLiked,
          isBookmarked,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, content, excerpt, coverImage, status, featured, categoryId, tags } = req.body;

    // Generate unique slug
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = 'post';

    let uniqueSlug = baseSlug;
    let count = 1;
    while (await prisma.post.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${count}`;
      count++;
    }

    // Compute excerpt if missing
    let finalExcerpt = excerpt;
    if (!finalExcerpt) {
      const plainText = content.replace(/<[^>]*>?/gm, '').trim();
      finalExcerpt = plainText.length > 160 ? plainText.substring(0, 157) + '...' : plainText;
    }

    const readingTime = calculateReadingTime(content);
    const postStatus = status || 'DRAFT';
    const publishedAt = postStatus === 'PUBLISHED' ? new Date() : null;

    const post = await prisma.post.create({
      data: {
        title,
        slug: uniqueSlug,
        content,
        excerpt: finalExcerpt,
        coverImage,
        readingTime,
        status: postStatus,
        featured: !!featured,
        publishedAt,
        authorId: req.user!.id,
        categoryId: categoryId || null,
        ...(tags && tags.length > 0 && {
          tags: {
            create: await Promise.all(
              tags.map(async (tagName: string) => {
                const tagSlug = slugify(tagName);
                const tag = await prisma.tag.upsert({
                  where: { slug: tagSlug },
                  create: { name: tagName.trim(), slug: tagSlug },
                  update: {},
                });
                return { tagId: tag.id };
              })
            ),
          },
        }),
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        post: {
          ...post,
          tags: post.tags.map((t) => t.tag),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, coverImage, status, featured, categoryId, tags } = req.body;

    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!existingPost) {
      res.status(404).json({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    // Authorization: owner or ADMIN
    if (req.user!.role !== 'ADMIN' && req.user!.id !== existingPost.authorId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to edit this post' },
      });
      return;
    }

    // Slug regeneration if title changed
    let updatedSlug = existingPost.slug;
    if (title && title !== existingPost.title) {
      let baseSlug = slugify(title);
      updatedSlug = baseSlug;
      let count = 1;
      while (
        await prisma.post.findFirst({
          where: { slug: updatedSlug, NOT: { id: existingPost.id } },
        })
      ) {
        updatedSlug = `${baseSlug}-${count}`;
        count++;
      }
    }

    const readingTime = content ? calculateReadingTime(content) : existingPost.readingTime;

    let publishedAt = existingPost.publishedAt;
    if (status === 'PUBLISHED' && !existingPost.publishedAt) {
      publishedAt = new Date();
    }

    // If tags are provided, replace them
    if (tags !== undefined) {
      await prisma.postTag.deleteMany({
        where: { postId: id },
      });
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined && { title, slug: updatedSlug }),
        ...(content !== undefined && { content, readingTime }),
        ...(excerpt !== undefined && { excerpt }),
        ...(coverImage !== undefined && { coverImage }),
        ...(status !== undefined && { status, publishedAt }),
        ...(featured !== undefined && { featured }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(tags && {
          tags: {
            create: await Promise.all(
              tags.map(async (tagName: string) => {
                const tagSlug = slugify(tagName);
                const tag = await prisma.tag.upsert({
                  where: { slug: tagSlug },
                  create: { name: tagName.trim(), slug: tagSlug },
                  update: {},
                });
                return { tagId: tag.id };
              })
            ),
          },
        }),
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    res.json({
      success: true,
      data: {
        post: {
          ...updated,
          tags: updated.tags.map((t) => t.tag),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) {
      res.status(404).json({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    // Authorization: owner or ADMIN
    if (req.user!.role !== 'ADMIN' && req.user!.id !== existingPost.authorId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to delete this post' },
      });
      return;
    }

    await prisma.post.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleLikePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) {
      res.status(404).json({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: { userId, postId: id },
      },
    });

    let liked = false;
    if (existingLike) {
      await prisma.postLike.delete({
        where: {
          userId_postId: { userId, postId: id },
        },
      });
      liked = false;
    } else {
      await prisma.postLike.create({
        data: { userId, postId: id },
      });
      liked = true;
    }

    const likesCount = await prisma.postLike.count({ where: { postId: id } });

    res.json({
      success: true,
      data: { liked, likesCount },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleBookmarkPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) {
      res.status(404).json({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: { userId, postId: id },
      },
    });

    let bookmarked = false;
    if (existingBookmark) {
      await prisma.bookmark.delete({
        where: {
          userId_postId: { userId, postId: id },
        },
      });
      bookmarked = false;
    } else {
      await prisma.bookmark.create({
        data: { userId, postId: id },
      });
      bookmarked = true;
    }

    res.json({
      success: true,
      data: { bookmarked },
    });
  } catch (error) {
    next(error);
  }
};

export const getBookmarkedPosts = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            author: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
            category: true,
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    });

    const posts = bookmarks.map((b) => ({
      ...b.post,
      likesCount: b.post._count.likes,
      commentsCount: b.post._count.comments,
      isBookmarked: true,
    }));

    res.json({
      success: true,
      data: { posts },
    });
  } catch (error) {
    next(error);
  }
};
