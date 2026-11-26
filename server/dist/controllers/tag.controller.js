"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTag = exports.getTags = void 0;
const db_1 = __importDefault(require("../db"));
const slug_utils_1 = require("../utils/slug.utils");
const getTags = async (_req, res, next) => {
    try {
        const tags = await db_1.default.tag.findMany({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getTags = getTags;
const createTag = async (req, res, next) => {
    try {
        const { name } = req.body;
        const slug = (0, slug_utils_1.slugify)(name);
        const tag = await db_1.default.tag.upsert({
            where: { slug },
            create: { name: name.trim(), slug },
            update: {},
        });
        res.status(201).json({
            success: true,
            data: { tag },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTag = createTag;
