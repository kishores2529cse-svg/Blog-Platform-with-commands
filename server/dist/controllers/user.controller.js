"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.listUsers = exports.changePassword = exports.updateProfile = exports.getProfile = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../db"));
const getProfile = async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await db_1.default.user.findUnique({
            where: { username: username.toLowerCase() },
            select: {
                id: true,
                username: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                website: true,
                github: true,
                twitter: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: {
                            where: { status: 'PUBLISHED' },
                        },
                    },
                },
                posts: {
                    where: { status: 'PUBLISHED' },
                    orderBy: { publishedAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        excerpt: true,
                        coverImage: true,
                        readingTime: true,
                        publishedAt: true,
                        createdAt: true,
                        category: {
                            select: { id: true, name: true, slug: true, color: true },
                        },
                        _count: {
                            select: { likes: true, comments: true },
                        },
                    },
                },
            },
        });
        if (!user) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User profile not found',
                },
            });
            return;
        }
        res.json({
            success: true,
            data: { user },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res, next) => {
    try {
        const { displayName, bio, avatarUrl, website, github, twitter } = req.body;
        const updated = await db_1.default.user.update({
            where: { id: req.user.id },
            data: {
                ...(displayName !== undefined && { displayName }),
                ...(bio !== undefined && { bio }),
                ...(avatarUrl !== undefined && { avatarUrl }),
                ...(website !== undefined && { website }),
                ...(github !== undefined && { github }),
                ...(twitter !== undefined && { twitter }),
            },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                website: true,
                github: true,
                twitter: true,
                role: true,
                updatedAt: true,
            },
        });
        res.json({
            success: true,
            data: { user: updated },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await db_1.default.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            res.status(404).json({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'User not found' },
            });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INCORRECT_PASSWORD',
                    message: 'Current password does not match',
                },
            });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
        await db_1.default.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
// Admin only: List all registered users
const listUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            db_1.default.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    displayName: true,
                    role: true,
                    avatarUrl: true,
                    createdAt: true,
                    _count: {
                        select: { posts: true, comments: true },
                    },
                },
            }),
            db_1.default.user.count(),
        ]);
        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.listUsers = listUsers;
// Admin only: Update user role
const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['READER', 'AUTHOR', 'ADMIN'].includes(role)) {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_ROLE', message: 'Role must be READER, AUTHOR, or ADMIN' },
            });
            return;
        }
        // Prevent removing the last admin
        if (role !== 'ADMIN') {
            const targetUser = await db_1.default.user.findUnique({ where: { id } });
            if (targetUser?.role === 'ADMIN') {
                const adminCount = await db_1.default.user.count({ where: { role: 'ADMIN' } });
                if (adminCount <= 1) {
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'CANNOT_DEMOTE_LAST_ADMIN',
                            message: 'Cannot demote the last remaining administrator',
                        },
                    });
                    return;
                }
            }
        }
        const updated = await db_1.default.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                role: true,
            },
        });
        res.json({
            success: true,
            data: { user: updated },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUserRole = updateUserRole;
