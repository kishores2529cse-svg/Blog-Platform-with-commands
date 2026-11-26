import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { initSocket } from './socket/socket.handler';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.io with the HTTP server
initSocket(server, CLIENT_URL);

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
