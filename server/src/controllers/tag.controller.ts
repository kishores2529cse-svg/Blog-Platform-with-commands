import { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import { slugify } from '../utils/slug.utils';

export const getTags = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                post: { status: 'PUBLISHED' },
              },
            },
          },
        },
      },
    });

    const formatted = tags.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      postsCount: t._count.posts,
    }));

    res.json({
      success: true,
      data: { tags: formatted },
    });
  } catch (error) {
    next(error);
  }
};

export const createTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.body;
    const slug = slugify(name);

    const tag = await prisma.tag.upsert({
      where: { slug },
      create: { name: name.trim(), slug },
      update: {},
    });

    res.status(201).json({
      success: true,
      data: { tag },
    });
  } catch (error) {
    next(error);
  }
};
