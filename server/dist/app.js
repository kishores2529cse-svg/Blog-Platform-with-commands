"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const post_routes_1 = __importDefault(require("./routes/post.routes"));
const comment_routes_1 = __importStar(require("./routes/comment.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const tag_routes_1 = __importDefault(require("./routes/tag.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
// Middleware
const error_middleware_1 = require("./middleware/error.middleware");
const rateLimiter_middleware_1 = require("./middleware/rateLimiter.middleware");
const createApp = () => {
    const app = (0, express_1.default)();
    // Basic security and parsing middlewares
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // Allows flexible rich-text images and development assets
        crossOriginResourcePolicy: false,
    }));
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    app.use((0, cors_1.default)({
        origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.use((0, cookie_parser_1.default)());
    if (process.env.NODE_ENV !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    // Health check endpoint
    app.get('/api/health', (_req, res) => {
        res.json({
            status: 'ok',
            service: 'blog-platform-api',
            timestamp: new Date().toISOString(),
        });
    });
    // Apply rate limiting to all standard API routes
    app.use('/api', rateLimiter_middleware_1.apiLimiter);
    // Mount API Routers
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/users', user_routes_1.default);
    app.use('/api/posts', post_routes_1.default);
    app.use('/api/posts/:postId/comments', comment_routes_1.default);
    app.use('/api/comments', comment_routes_1.commentActionsRouter);
    app.use('/api/categories', category_routes_1.default);
    app.use('/api/tags', tag_routes_1.default);
    app.use('/api/analytics', analytics_routes_1.default);
    // Serve static files from client/dist in production if available
    const clientDistPath = path_1.default.resolve(__dirname, '../../client/dist');
    if (fs_1.default.existsSync(clientDistPath)) {
        app.use(express_1.default.static(clientDistPath));
        app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api')) {
                return next();
            }
            res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
        });
    }
    // 404 handler for API routes
    app.use('/api/*', (req, res) => {
        res.status(404).json({
            success: false,
            error: {
                code: 'ROUTE_NOT_FOUND',
                message: `Endpoint ${req.method} ${req.originalUrl} not found`,
            },
        });
    });
    // Centralized Error Handling Middleware
    app.use(error_middleware_1.errorHandler);
    return app;
};
exports.createApp = createApp;
exports.default = exports.createApp;
