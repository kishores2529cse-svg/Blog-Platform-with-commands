"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = require("./app");
const socket_handler_1 = require("./socket/socket.handler");
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const app = (0, app_1.createApp)();
const server = http_1.default.createServer(app);
// Initialize Socket.io with the HTTP server
(0, socket_handler_1.initSocket)(server, CLIENT_URL);
server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Blog Platform Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api`);
    console.log(`🌐 Real-time Socket.IO initialized`);
    console.log(`===============================================`);
});
// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated.');
    });
});
