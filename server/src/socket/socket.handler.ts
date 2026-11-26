import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer, clientUrl: string): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    // Join a room for a specific post to receive real-time comments
    socket.on('join:post', (postId: string) => {
      if (postId) {
        socket.join(`post:${postId}`);
      }
    });

    // Leave post room
    socket.on('leave:post', (postId: string) => {
      if (postId) {
        socket.leave(`post:${postId}`);
      }
    });

    // Live typing indicator
    socket.on('typing:start', ({ postId, user }: { postId: string; user: string }) => {
      socket.to(`post:${postId}`).emit('user:typing', { user });
    });

    socket.on('typing:stop', ({ postId, user }: { postId: string; user: string }) => {
      socket.to(`post:${postId}`).emit('user:stopped_typing', { user });
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet');
  }
  return io;
};
