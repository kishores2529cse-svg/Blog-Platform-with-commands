"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../db"));
const jwt_utils_1 = require("../utils/jwt.utils");
const register = async (req, res, next) => {
    try {
        const { email, username, password, displayName, role } = req.body;
        // Check if user already exists
        const existingUser = await db_1.default.user.findFirst({
            where: {
                OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
            },
        });
        if (existingUser) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'USER_ALREADY_EXISTS',
                    message: existingUser.email === email.toLowerCase()
                        ? 'An account with this email already exists'
                        : 'This username is already taken',
                },
            });
            return;
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // If first user in database, grant ADMIN role automatically; otherwise READER or AUTHOR
        const totalUsers = await db_1.default.user.count();
        let assignedRole = totalUsers === 0 ? 'ADMIN' : (role === 'AUTHOR' ? 'AUTHOR' : 'READER');
        const user = await db_1.default.user.create({
            data: {
                email: email.toLowerCase(),
                username: username.toLowerCase(),
                password: hashedPassword,
                displayName,
                role: assignedRole,
            },
            select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                role: true,
                createdAt: true,
            },
        });
        const token = (0, jwt_utils_1.signToken)({
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        });
        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.status(201).json({
            success: true,
            data: {
                user,
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { login, password } = req.body;
        const user = await db_1.default.user.findFirst({
            where: {
                OR: [
                    { email: login.toLowerCase() },
                    { username: login.toLowerCase() },
                ],
            },
        });
        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email/username or password',
                },
            });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email/username or password',
                },
            });
            return;
        }
        const token = (0, jwt_utils_1.signToken)({
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    displayName: user.displayName,
                    bio: user.bio,
                    avatarUrl: user.avatarUrl,
                    role: user.role,
                    createdAt: user.createdAt,
                },
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const logout = async (_req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
};
exports.logout = logout;
const getMe = async (req, res, next) => {
    try {
        const user = await db_1.default.user.findUnique({
            where: { id: req.user.id },
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
                createdAt: true,
                _count: {
                    select: {
                        posts: true,
                        comments: true,
                        bookmarks: true,
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
exports.getMe = getMe;
