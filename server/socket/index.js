const socketIO = require('socket.io');
const logger = require('../utils/logger');

const socketHandler = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    // Join a room based on user ID for private notifications
    socket.on('join', (userId) => {
      socket.join(userId);
      logger.info(`Socket ${socket.id} joined room: ${userId}`);
    });

    // Join kitchen room for staff
    socket.on('joinKitchen', () => {
      socket.join('kitchen');
      logger.info(`Socket ${socket.id} joined kitchen room`);
    });

    // Order status update event
    socket.on('updateOrderStatus', (orderData) => {
      // orderData: { orderId, userId, status }
      io.to(orderData.userId).emit('orderUpdate', orderData);
      io.to('kitchen').emit('kitchenOrderUpdate', orderData);
      logger.info(`Order ${orderData.orderId} status updated to ${orderData.status}`);
    });

    // New order notification for kitchen
    socket.on('newOrder', (order) => {
      io.to('kitchen').emit('incomingOrder', order);
      logger.info(`New order received: ${order.orderNumber}`);
    });

    // Admin action broadcast (menu updates, reservations, etc.)
    socket.on('adminAction', (data) => {
      // data: { type: 'menuUpdate' | 'reservationUpdate' | 'paymentUpdate', ... }
      socket.broadcast.emit('adminAction', data);
      
      // Also emit specific events for legacy compatibility if needed
      if (data.type === 'menuUpdate') io.emit('menuUpdated');
      if (data.type === 'reservationUpdate') io.emit('reservationUpdated');
      
      logger.info(`Admin action broadcasted: ${data.type}`);
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected');
    });
  });

  return io;
};

module.exports = socketHandler;
