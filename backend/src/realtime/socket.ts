import type { Server } from 'socket.io';

export function attachSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    socket.emit('connected', { socketId: socket.id });

    socket.on('typing:start', (payload) => {
      socket.to(payload.conversationId).emit('typing:start', payload);
    });

    socket.on('typing:stop', (payload) => {
      socket.to(payload.conversationId).emit('typing:stop', payload);
    });

    socket.on('conversation:join', (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on('notification:join', (organizationId: string) => {
      socket.join(`organization:${organizationId}`);
    });
  });
}
