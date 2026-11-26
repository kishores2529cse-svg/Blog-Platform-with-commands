"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = exports.optionalAuthenticate = exports.authenticate = void 0;
const jwt_utils_1 = require("../utils/jwt.utils");
const db_1 = __importDefault(require("../db"));
const authenticate = async (req, res, next) => {
    try {
        let token;
        // Check Authorization header (Bearer token)
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.cookies && req.cookies.token) {
            // Or from cookie
            token = req.cookies.token;
        }
        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required. No token provided.',
                },
            });
            return;
        }
        const payload = (0, jwt_utils_1.verifyToken)(token);
        // Verify user still exists in database
        const user = await db_1.default.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, username: true, displayName: true, role: true },
        });
        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'The user belonging to this token no longer exists.',
                },
            });
            return;
        }
        req.user = {
            ...payload,
            id: user.id,
            displayName: user.displayName,
            role: user.role,
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired authentication token.',
            },
        });
    }
};
exports.authenticate = authenticate;
/**
 * Optional authentication middleware: if token is present and valid, attaches user; otherwise continues without error
 */
const optionalAuthenticate = async (req, _res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        if (token) {
            const payload = (0, jwt_utils_1.verifyToken)(token);
            const user = await db_1.default.user.findUnique({
                where: { id: payload.userId },
                select: { id: true, email: true, username: true, displayName: true, role: true },
            });
            if (user) {
                req.user = {
                    ...payload,
                    id: user.id,
                    displayName: user.displayName,
                    role: user.role,
                };
            }
        }
    }
    catch {
        // Ignore invalid token in optional mode
    }
    next();
};
exports.optionalAuthenticate = optionalAuthenticate;
/**
 * Role-Based Access Control middleware
 * Checks if authenticated user has one of the required roles
 */
const requireRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required.',
                },
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `Access denied. Requires one of roles: [${roles.join(', ')}]. Your role: ${req.user.role}`,
                },
            });
            return;
        }
        next();
    };
};
exports.requireRoles = requireRoles;
