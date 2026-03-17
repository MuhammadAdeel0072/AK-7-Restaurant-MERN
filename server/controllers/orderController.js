const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const { generateReceipt } = require('../services/pdfService');
const { addLoyaltyPoints } = require('./loyaltyController');
const { createPaymentIntent } = require('../services/paymentService');
const { assignDriver } = require('../services/deliveryService');

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
    paymentReference,
    isPaid
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    const orderNumber = `AK7-${Math.floor(10000 + Math.random() * 90000)}`;

    // Calculate loyalty points (10 points per $1 spent)
    const pointsEarned = Math.floor(totalPrice * 10);

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
      loyaltyPointsEarned: pointsEarned,
      statusHistory: [{ status: 'placed' }]
    });

    const createdOrder = await order.save();

    // Add points to user profile
    await addLoyaltyPoints(req.user._id, pointsEarned, `Earned from order ${orderNumber}`, createdOrder._id);

    // Emit real-time events
    req.io.to('kitchen').emit('incomingOrder', createdOrder);

    res.status(201).json(createdOrder);
  }
});

// @desc    Get order receipt PDF
// @route   GET /api/orders/:id/receipt
// @access  Private
const getOrderReceipt = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');

  if (order) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${order.orderNumber}.pdf`);
    generateReceipt(order, res);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Create payment intent for Stripe
// @route   POST /api/orders/payment-intent
// @access  Private
const getPaymentIntent = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const paymentIntent = await createPaymentIntent(amount);
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');

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
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

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

    if (status === 'preparing') {
      order.preparationStartTime = Date.now();
    } else if (status === 'ready') {
      order.preparationEndTime = Date.now();
      // Auto-assign driver if it's a delivery order
      if (!order.driverId) {
        order.driverId = await assignDriver(order._id);
      }
    } else if (status === 'out-for-delivery') {
      if (!order.driverId) {
        order.driverId = await assignDriver(order._id);
      }
    } else if (status === 'delivered') {
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    // Emit real-time status update to user
    req.io.to(order.user.toString()).emit('orderUpdate', {
      orderId: order._id,
      status: order.status,
      orderNumber: order.orderNumber
    });

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
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id firstName lastName');
  res.json(orders);
});

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getOrders,
  getOrderReceipt,
  getPaymentIntent,
};
