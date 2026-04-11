// server/services/socketService.js
const socketIO = require('socket.io');

let io;

/**
 * Initialize Socket.io with server instance
 * @param {http.Server} server
 * @returns {SocketIO.Server} io
 */
const init = (server) => {
  io = socketIO(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL, // deployed client
        process.env.ADMIN_URL,    // deployed admin
        'http://localhost:5173',  // client
        'http://localhost:5174',  // admin
        'http://localhost:5175',  // chef
        'http://localhost:5176',  // rider
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
        'http://127.0.0.1:5176',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    // Join individual user room (for personal notifications)
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined personal room`);
    });

    // Join kitchen room (staff/chef)
    socket.on('joinKitchen', () => {
      socket.join('kitchen');
      console.log('Staff joined kitchen room');
    });

    // Join admin room
    socket.on('joinAdmin', () => {
      socket.join('admin');
      console.log('Admin joined administrative room');
    });

    // Join rider room
    socket.on('joinRider', () => {
      socket.join('rider');
      console.log('Rider joined delivery room');
    });

    // Listen for admin actions and broadcast to all clients
    socket.on('adminAction', (data) => {
      console.log('Admin action received:', data);
      // Broadcast to all connected clients
      io.emit('adminAction', data);
    });

    socket.on('disconnect', () => {
      console.log('Socket Disconnected:', socket.id);
    });
  });

  return io;
};

/**
 * Get initialized Socket.io instance
 * @returns {SocketIO.Server}
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

/**
 * Emit event to a specific room or all sockets
 * @param {string|null} room - room name or null to emit globally
 * @param {string} event - event name
 * @param {any} data - payload
 */
const emitEvent = (room, event, data) => {
  if (io) {
    if (room) {
      io.to(room).emit(event, data);
    } else {
      io.emit(event, data);
    }
  }
};

module.exports = { init, getIO, emitEvent };