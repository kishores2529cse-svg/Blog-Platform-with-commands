"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const db_1 = __importDefault(require("../db"));
const slug_utils_1 = require("../utils/slug.utils");
const getCategories = async (_req, res, next) => {
    try {
        const categories = await db_1.default.category.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, res, next) => {
    try {
        const { name, description, color } = req.body;
        const slug = (0, slug_utils_1.slugify)(name);
        const existing = await db_1.default.category.findFirst({
            where: { OR: [{ slug }, { name }] },
        });
        if (existing) {
            res.status(409).json({
                success: false,
                error: { code: 'CATEGORY_EXISTS', message: 'Category with this name or slug already exists' },
            });
            return;
        }
        const category = await db_1.default.category.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, color } = req.body;
        const existing = await db_1.default.category.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({
                success: false,
                error: { code: 'CATEGORY_NOT_FOUND', message: 'Category not found' },
            });
            return;
        }
        let slug = existing.slug;
        if (name && name !== existing.name) {
            slug = (0, slug_utils_1.slugify)(name);
        }
        const updated = await db_1.default.category.update({
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existing = await db_1.default.category.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({
                success: false,
                error: { code: 'CATEGORY_NOT_FOUND', message: 'Category not found' },
            });
            return;
        }
        await db_1.default.category.delete({ where: { id } });
        res.json({
            success: true,
            message: 'Category deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCategory = deleteCategory;
