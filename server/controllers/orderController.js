const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const LoyaltyTransaction = require('../models/Loyalty');
const { generateReceipt } = require('../services/pdfService');
const { emitEvent } = require('../services/socketService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentReference
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    const orderNumber = `AK7-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // COD Logic: Mark as not paid initially
    const isPaid = paymentMethod === 'cod' ? false : req.body.isPaid;

    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentReference,
      isPaid: isPaid || false,
      paidAt: isPaid ? Date.now() : null,
      orderNumber,
      status: 'placed',
      statusHistory: [{ status: 'placed' }]
    });

    const createdOrder = await order.save();

    // --- Loyalty Logic ---
    const pointsEarned = Math.floor(totalPrice * 10);
    const user = await User.findById(req.user._id);
    if (user) {
      user.loyaltyPoints += pointsEarned;
      if (user.loyaltyPoints >= 5000) user.loyaltyTier = 'Platinum';
      else if (user.loyaltyPoints >= 2500) user.loyaltyTier = 'Gold';
      else if (user.loyaltyPoints >= 1000) user.loyaltyTier = 'Silver';
      await user.save();

      await LoyaltyTransaction.create({
        user: req.user._id,
        type: 'earned',
        points: pointsEarned,
        description: `Earned from order ${orderNumber}`,
        order: createdOrder._id
      });
    }

    // Emit real-time events to admin/kitchen
    emitEvent('kitchen', 'incomingOrder', createdOrder);
    emitEvent(null, 'adminAction', { type: 'incomingOrder', order: createdOrder });

    res.status(201).json(createdOrder);
  }
});

// @desc    Get order receipt PDF
// @route   GET /api/orders/:id/receipt
// @access  Private
const getOrderReceipt = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email').lean();

  if (order) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${order.orderNumber}.pdf`);
    generateReceipt(order, res);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email').lean();

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentReference = req.body.id || order.paymentReference;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Staff
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (order) {
    order.status = status;
    order.statusHistory.push({ status });

    if (status === 'delivered') {
      order.deliveredAt = Date.now();
      if (order.paymentMethod === 'cod') {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
    }

    const updatedOrder = await order.save();

    // Emit real-time status update to user and admin
    emitEvent(order.user.toString(), 'orderUpdate', {
      orderId: order._id,
      status: order.status,
      orderNumber: order.orderNumber
    });
    emitEvent(null, 'adminAction', { type: 'orderUpdate', orderId: order._id, status: order.status });

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'firstName lastName').sort({ createdAt: -1 }).lean();
  res.json(orders);
});

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getOrders,
  getOrderReceipt
};
