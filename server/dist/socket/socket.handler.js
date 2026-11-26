"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initSocket = (httpServer, clientUrl) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: clientUrl || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        // Join a room for a specific post to receive real-time comments
        socket.on('join:post', (postId) => {
            if (postId) {
                socket.join(`post:${postId}`);
            }
        });
        // Leave post room
        socket.on('leave:post', (postId) => {
            if (postId) {
                socket.leave(`post:${postId}`);
            }
        });
        // Live typing indicator
        socket.on('typing:start', ({ postId, user }) => {
            socket.to(`post:${postId}`).emit('user:typing', { user });
        });
        socket.on('typing:stop', ({ postId, user }) => {
            socket.to(`post:${postId}`).emit('user:stopped_typing', { user });
        });
        socket.on('disconnect', () => {
            // Clean disconnect
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized yet');
    }
    return io;
};
exports.getIO = getIO;
