import { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { slugify } from '../utils/slug.utils';

export const getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            posts: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
    });

    const formatted = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      color: c.color,
      postsCount: c._count.posts,
    }));

    res.json({
      success: true,
      data: { categories: formatted },
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, color } = req.body;
    const slug = slugify(name);

    const existing = await prisma.category.findFirst({
      where: { OR: [{ slug }, { name }] },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'CATEGORY_EXISTS', message: 'Category with this name or slug already exists' },
      });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        color: color || '#3b82f6',
      },
    });

    res.status(201).json({
      success: true,
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'CATEGORY_NOT_FOUND', message: 'Category not found' },
      });
      return;
    }

    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = slugify(name);
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name, slug }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
      },
    });

    res.json({
      success: true,
      data: { category: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'CATEGORY_NOT_FOUND', message: 'Category not found' },
      });
      return;
    }

    await prisma.category.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
