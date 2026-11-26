"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommentSchema = exports.createCommentSchema = exports.updatePostSchema = exports.createPostSchema = exports.createTagSchema = exports.updateCategorySchema = exports.createCategorySchema = exports.changePasswordSchema = exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const optionalUrl = zod_1.z
    .string()
    .trim()
    .refine((val) => !val || /^https?:\/\/.+/i.test(val) || val.startsWith('/') || val.startsWith('data:image/'), { message: 'Must be a valid URL starting with http:// or https:// (or left blank)' })
    .optional()
    .nullable()
    .or(zod_1.z.literal(''));
// Auth Schemas
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    username: zod_1.z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    displayName: zod_1.z.string().min(2, 'Display name must be at least 2 characters').max(50),
    role: zod_1.z.enum(['READER', 'AUTHOR', 'ADMIN']).optional(),
});
exports.loginSchema = zod_1.z.object({
    login: zod_1.z.string().min(1, 'Email or username is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// User Profile Schemas
exports.updateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(2, 'Display name must be at least 2 characters').max(50).optional(),
    bio: zod_1.z.string().max(500, 'Bio cannot exceed 500 characters').optional().nullable(),
    avatarUrl: optionalUrl,
    website: optionalUrl,
    github: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')),
    twitter: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
// Category Schemas
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Category name must be at least 2 characters').max(50),
    description: zod_1.z.string().max(300, 'Description cannot exceed 300 characters').optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code (e.g. #3b82f6)').optional(),
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
// Tag Schemas
exports.createTagSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Tag name must be at least 2 characters').max(30),
});
// Post Schemas
exports.createPostSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters').max(150, 'Title cannot exceed 150 characters'),
    content: zod_1.z.string().min(1, 'Story body content cannot be empty'),
    excerpt: zod_1.z.string().max(300, 'Excerpt cannot exceed 300 characters').optional(),
    coverImage: optionalUrl,
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
    featured: zod_1.z.boolean().optional().default(false),
    categoryId: zod_1.z.string().optional().nullable(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.updatePostSchema = exports.createPostSchema.partial();
// Comment Schemas
exports.createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment cannot exceed 2000 characters'),
    parentId: zod_1.z.string().optional().nullable(),
});
exports.updateCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment cannot exceed 2000 characters'),
});
