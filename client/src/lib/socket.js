/**
 * Socket.io client instance
 */
import { io } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('🔌 WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('🔌 WebSocket disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('🔌 WebSocket error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export default { connectSocket, disconnectSocket, getSocket };
