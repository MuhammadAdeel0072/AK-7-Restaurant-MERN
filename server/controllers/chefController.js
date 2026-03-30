const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const { emitEvent } = require('../services/socketService');

// @desc    Get all active orders for the kitchen (confirmed or preparing)
// @route   GET /api/chef/orders
// @access  Private/Chef
const getActiveOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    status: { $in: ['confirmed', 'preparing'] }
  })
  .populate('user', 'firstName lastName email')
  .sort({ priority: 1, createdAt: 1 }); // Urgent and VIP first, then FIFO

  res.json(orders);
});

// @desc    Get orders ready for pickup/delivery
// @route   GET /api/chef/ready-orders
// @access  Private/Chef
const getReadyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    status: 'ready'
  })
  .populate('user', 'firstName lastName email')
  .sort({ updatedAt: -1 });

  res.json(orders);
});

// @desc    Update order status in the kitchen workflow
// @route   PATCH /api/chef/order/status
// @access  Private/Chef
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id, status } = req.body;
  const order = await Order.findById(id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Define allowed transitions for Chef
  const allowedStatuses = ['preparing', 'ready', 'delivered', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status transition for Chef');
  }

  // Update order status
  order.status = status;
  
  if (status === 'preparing' && !order.preparationStartTime) {
    order.preparationStartTime = Date.now();
  }
  
  if (status === 'ready') {
    order.preparationEndTime = Date.now();
    order.readyAt = Date.now();
    // Mark all items as ready if order is ready
    order.orderItems.forEach(item => {
      item.status = 'ready';
    });
  }

  // Record history
  order.statusHistory.push({
    status,
    timestamp: Date.now()
  });

  const updatedOrder = await order.save();

  // Notify all relevant parties
  emitEvent('kitchen', 'orderUpdate', updatedOrder);
  emitEvent('admin', 'orderUpdate', updatedOrder);
  emitEvent(order.user.toString(), 'orderUpdate', updatedOrder);

  res.json(updatedOrder);
});

// @desc    Update individual item status
// @route   PATCH /api/chef/order/item-status
// @access  Private/Chef
const updateItemStatus = asyncHandler(async (req, res) => {
  const { orderId, itemId, status } = req.body;
  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const item = order.orderItems.id(itemId);
  if (!item) {
    res.status(404);
    throw new Error('Item not found in order');
  }

  item.status = status;

  // Auto-update order status if first item starts being prepared
  if (status === 'preparing' && order.status === 'confirmed') {
    order.status = 'preparing';
    order.preparationStartTime = Date.now();
    order.statusHistory.push({ status: 'preparing', timestamp: Date.now() });
  }

  // Auto-update order to 'ready' if all items are 'ready'
  const allReady = order.orderItems.every(i => i.status === 'ready');
  if (allReady && order.status !== 'ready') {
    order.status = 'ready';
    order.preparationEndTime = Date.now();
    order.readyAt = Date.now();
    order.statusHistory.push({ status: 'ready', timestamp: Date.now() });
  }

  const updatedOrder = await order.save();

  // Notify
  emitEvent('kitchen', 'orderUpdate', updatedOrder);
  emitEvent(order.user.toString(), 'orderUpdate', updatedOrder);

  res.json(updatedOrder);
});

// @desc    Get kitchen analytics/stats
// @route   GET /api/chef/stats
// @access  Private/Chef
const getKitchenStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ordersToday = await Order.find({
    createdAt: { $gte: today }
  });

  const stats = {
    totalToday: ordersToday.length,
    pending: ordersToday.filter(o => o.status === 'confirmed' || o.status === 'placed').length,
    preparing: ordersToday.filter(o => o.status === 'preparing').length,
    ready: ordersToday.filter(o => o.status === 'ready').length,
    delayed: 0,
    avgPrepTime: 0
  };

  // Calculate delayed orders (e.g., > 30 mins and not ready)
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  stats.delayed = ordersToday.filter(o => 
    (o.status === 'confirmed' || o.status === 'preparing') && 
    o.createdAt < thirtyMinsAgo
  ).length;

  // Calculate average prep time for completed orders today
  const readyOrders = ordersToday.filter(o => o.readyAt && o.preparationStartTime);
  if (readyOrders.length > 0) {
    const totalTime = readyOrders.reduce((acc, o) => {
      return acc + (new Date(o.readyAt) - new Date(o.preparationStartTime));
    }, 0);
    stats.avgPrepTime = Math.round((totalTime / readyOrders.length) / 60000); // in minutes
  }

  res.json(stats);
});

module.exports = {
  getActiveOrders,
  getReadyOrders,
  updateOrderStatus,
  updateItemStatus,
  getKitchenStats
};
