import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true
});

export const joinKitchen = () => {
  if (socket.connected) {
    socket.emit('joinKitchen');
    console.log('Kitchen Sync: JOIN signal emitted');
  } else {
    socket.once('connect', () => {
      socket.emit('joinKitchen');
      console.log('Kitchen Sync: JOIN signal emitted after connect');
    });
  }
};

export default socket;
