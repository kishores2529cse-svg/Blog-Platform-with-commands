import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (val) => !val || /^https?:\/\/.+/i.test(val) || val.startsWith('/') || val.startsWith('data:image/'),
    { message: 'Must be a valid URL starting with http:// or https:// (or left blank)' }
  )
  .optional()
  .nullable()
  .or(z.literal(''));

// Auth Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
  role: z.enum(['READER', 'AUTHOR', 'ADMIN']).optional(),
});

export const loginSchema = z.object({
  login: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

// User Profile Schemas
export const updateProfileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50).optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().nullable(),
  avatarUrl: optionalUrl,
  website: optionalUrl,
  github: z.string().optional().nullable().or(z.literal('')),
  twitter: z.string().optional().nullable().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Category Schemas
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(50),
  description: z.string().max(300, 'Description cannot exceed 300 characters').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code (e.g. #3b82f6)').optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Tag Schemas
export const createTagSchema = z.object({
  name: z.string().min(2, 'Tag name must be at least 2 characters').max(30),
});

// Post Schemas
export const createPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150, 'Title cannot exceed 150 characters'),
  content: z.string().min(1, 'Story body content cannot be empty'),
  excerpt: z.string().max(300, 'Excerpt cannot exceed 300 characters').optional(),
  coverImage: optionalUrl,
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().optional().default(false),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export const updatePostSchema = createPostSchema.partial();

// Comment Schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment cannot exceed 2000 characters'),
  parentId: z.string().optional().nullable(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment cannot exceed 2000 characters'),
});
