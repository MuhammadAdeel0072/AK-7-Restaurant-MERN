const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const LoyaltyTransaction = require('../models/Loyalty');
const Cart = require('../models/Cart');
const { generateReceipt } = require('../services/pdfService');
const { emitEvent } = require('../services/socketService');
const { deductStock } = require('../services/inventoryService');
const { calculateETA } = require('../services/ETAService');
const { awardPoints } = require('../services/LoyaltyService');
const Transaction = require('../models/Transaction');
const asyncHandler = require('express-async-handler');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  // 📝 Structured Diagnostic Log
  console.log('--- Incoming Order Protocol ---');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Payload:', JSON.stringify(req.body, null, 2));

  // 🛡️ Pre-emptive Destructuring with Defaults
  const {
    orderItems = [],
    shippingAddress = {},
    paymentMethod = 'cod',
    itemsPrice = 0,
    taxPrice = 0,
    shippingPrice = 0,
    totalPrice = 0,
    paymentReference = ''
  } = req.body;

  // 🧹 Data Normalization (Mongoose Numeric Cast Protection)
  const normalizedTotalPrice = Number(totalPrice);
  const normalizedItemsPrice = Number(itemsPrice);
  const normalizedTaxPrice = Number(taxPrice);
  const normalizedShippingPrice = Number(shippingPrice);

  // 🛡️ Data Integrity Check (Phase 2 - Ultra Defensive)
  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    res.status(400);
    throw new Error('Mission Aborted: No order items detected in payload');
  }

  // Validate each item for required product ID and name
  const isItemsValid = orderItems.every(item => item.product && item.name && item.qty > 0);
  if (!isItemsValid) {
    res.status(400);
    throw new Error('Data Corruption: One or more order items are missing critical identifiers (Product ID/Name)');
  }

  // 🛡️ Guard: Ensure all product IDs are valid MongoDB ObjectIDs
  for (const item of orderItems) {
    if (!mongoose.Types.ObjectId.isValid(item.product)) {
      res.status(400);
      throw new Error(`Protocol Violation: Invalid Product Identity detected (${item.product}). Only MongoDB ObjectIDs are permitted.`);
    }
  }

  if (!shippingAddress.phoneNumber || !shippingAddress.address) {
    res.status(400);
    throw new Error('Identity Verification Failed: Phone and Address are required protocol');
  }

  if (!req.user) {
    res.status(401);
    throw new Error('Security Breach: Authentication required for order placement');
  }

  try {
    const orderNumber = `DX-${Math.floor(100000 + Math.random() * 899999)}`;

    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress: {
        fullName: shippingAddress.fullName || (req.user.firstName + ' ' + (req.user.lastName || '')).trim(),
        phoneNumber: shippingAddress.phoneNumber,
        address: shippingAddress.address,
        streetAddress: shippingAddress.streetAddress || shippingAddress.address,
        city: shippingAddress.city || 'isb',
        area: shippingAddress.area || 'isb',
        postalCode: shippingAddress.postalCode || '44000',
        landmark: shippingAddress.landmark || '',
      },
      paymentMethod,
      itemsPrice: normalizedItemsPrice,
      taxPrice: normalizedTaxPrice,
      shippingPrice: normalizedShippingPrice,
      totalPrice: normalizedTotalPrice,
      paymentReference,
      isPaid: req.body.isPaid || false,
      paidAt: (req.body.isPaid || paymentMethod !== 'cod' && req.body.isPaid) ? Date.now() : null,
      orderNumber,
      status: 'PENDING',
      statusHistory: [{ status: 'PENDING', timestamp: Date.now() }]
    });

    const createdOrder = await order.save();

    // 📡 Trigger Smart ETA calculation
    calculateETA(createdOrder._id).catch(err => console.error('ETA Calculation Failure:', err));

    // 📡 Immediate Response
    res.status(201).json(createdOrder);

    // --- Loyalty Sync & Real-time Sockets (Background Phase) ---
    // This allows the client to receive confirmation instantly while we finish bookkeeping
    try {
      // Award points on order placement (initial deposit)
      await awardPoints(req.user._id, normalizedTotalPrice);

      // 📡 Real-time Synchronization
      // 📡 Real-time Synchronization (Staff Alert)
      emitEvent('kitchen', 'NEW_ORDER', createdOrder);
      // 🔥 Adding new wildcard event globally as requested
      emitEvent(null, 'newOrder', createdOrder);

      // 🧹 Post-Mission Cleanup (Clear Backend Cart)
      await Cart.findOneAndDelete({ user: req.user._id });
      console.log('Cart Synchronization: Purged for user', req.user._id);

    } catch (loyaltyError) {
      console.warn('Loyalty Sync Protocol Jammed (Non-critical):', loyaltyError.message);
    }
  } catch (error) {
    console.error('System Exception [Order Save]:', error);
    res.status(500).json({
      message: error.name === 'ValidationError' ? 'Database Validation Breach' : 'Internal System Exception',
      details: error.name === 'ValidationError' ? Object.values(error.errors).map(e => e.message) : error.message
    });
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
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('rider', 'firstName lastName phoneNumber')
    .lean();

  if (order) {
    // Return a clean structure for the tracking system
    res.json({
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      rider: order.rider ? {
        name: `${order.rider.firstName} ${order.rider.lastName}`,
        phone: order.rider.phoneNumber
      } : null,
      shippingAddress: order.shippingAddress,
      orderItems: order.orderItems,
      totalPrice: order.totalPrice,
      isPaid: order.isPaid,
      createdAt: order.createdAt
    });
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

    if (status === 'delivered' || status === 'DELIVERED') {
      order.deliveredAt = Date.now();
      if (order.paymentMethod === 'cod') {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
      
      // Award additional loyalty points on successful delivery completion
      awardPoints(order.user, order.totalPrice).catch(err => console.error('Loyalty Award Failure:', err));
    }

    const updatedOrder = await order.save();

    // 🏆 ENTERPRISE LOGIC: Stock & Finance Orchestration
    if (status === 'confirmed' || status === 'preparing') {
        // Trigger background stock deduction
        deductStock(order.orderItems).catch(err => console.error('Stock Deduction Failure:', err));
    }

    if (status === 'delivered') {
        // Create Income Transaction Ledger Entry
        Transaction.create({
            type: 'income',
            amount: order.totalPrice,
            category: 'order',
            description: `Revenue from Order #${order.orderNumber}`,
            order: order._id,
            paymentMethod: order.paymentMethod
        }).catch(err => console.error('Financial Ledger Error:', err));
    }

    // Emit real-time status update to user and admin
    emitEvent(order.user.toString(), 'orderStatusUpdated', {
      orderId: order._id,
      status: order.status,
      orderNumber: order.orderNumber,
      estimatedDeliveryTime: order.estimatedDeliveryTime
    });
    emitEvent(null, 'adminAction', { type: 'orderStatusUpdated', orderId: order._id, status: order.status });

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
  console.log('Order Route Hit (MyOrders)');
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ orders });
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin or Chef
const getOrders = asyncHandler(async (req, res) => {
  console.log('Order Route Hit (Admin/Chef Orders)');
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  const orders = await Order.find(filter).populate('user', 'firstName lastName').sort({ createdAt: -1 }).lean();
  res.json(orders);
});

// @desc    Start cooking (Chef)
// @route   PUT /api/orders/:id/start
// @access  Private
const startCooking = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.status = 'PREPARING';
    order.statusHistory.push({ status: 'PREPARING', timestamp: Date.now() });
    order.preparationStartTime = Date.now();
    const updatedOrder = await order.save();
    emitEvent(null, 'orderUpdated', updatedOrder);
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Mark ready (Chef)
// @route   PUT /api/orders/:id/ready
// @access  Private
const markReady = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.status = 'READY_FOR_DELIVERY';
    order.statusHistory.push({ status: 'READY_FOR_DELIVERY', timestamp: Date.now() });
    order.readyAt = Date.now();
    order.preparationEndTime = Date.now();
    const updatedOrder = await order.save();
    emitEvent(null, 'orderUpdated', updatedOrder);
    emitEvent('rider', 'order:ready', updatedOrder);
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Dispatch order (Chef)
// @route   PUT /api/orders/:id/dispatch
// @access  Private
const dispatchOrder = asyncHandler(async (req, res) => {
  const { chefFeedback } = req.body;
  const order = await Order.findById(req.params.id);
  if (order) {
    order.status = 'DISPATCHED';
    order.statusHistory.push({ status: 'DISPATCHED', timestamp: Date.now() });
    order.pickedUpAt = Date.now();
    if (chefFeedback) {
      order.chefFeedback = chefFeedback;
    }
    const updatedOrder = await order.save();
    emitEvent(null, 'orderUpdated', updatedOrder);
    emitEvent('rider', 'order:ready', updatedOrder);
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// ============================
// 🔁 REORDER FEATURE
// ============================

// @desc    Get user order history (last 5 delivered orders)
// @route   GET /api/orders/user-history
// @access  Private
const getUserOrderHistory = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
    status: 'DELIVERED'
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Enrich with current product availability and pricing
  for (const order of orders) {
    for (const item of order.orderItems) {
      if (item.product) {
        const currentProduct = await Product.findById(item.product)
          .select('name price isAvailable countInStock image')
          .lean();

        if (currentProduct) {
          item.currentPrice = currentProduct.price;
          item.isAvailable = currentProduct.isAvailable && currentProduct.countInStock > 0;
          item.priceChanged = currentProduct.price !== item.price;
          item.currentImage = currentProduct.image;
        } else {
          item.isAvailable = false;
          item.priceChanged = false;
          item.currentPrice = item.price;
        }
      }
    }
  }

  res.json({ orders });
});

// @desc    Reorder items from a previous order
// @route   POST /api/orders/reorder
// @access  Private
const reorderItems = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    res.status(400);
    throw new Error('Order ID is required');
  }

  // Find the original order
  const originalOrder = await Order.findOne({
    _id: orderId,
    user: req.user._id
  }).lean();

  if (!originalOrder) {
    res.status(404);
    throw new Error('Order not found');
  }

  const cartItems = [];
  const warnings = [];

  for (const item of originalOrder.orderItems) {
    if (!item.product) {
      warnings.push({ name: item.name, reason: 'Product reference missing' });
      continue;
    }

    const currentProduct = await Product.findById(item.product)
      .select('name price isAvailable countInStock image description category customizations')
      .lean();

    if (!currentProduct) {
      warnings.push({ name: item.name, reason: 'Item no longer exists in menu' });
      continue;
    }

    if (!currentProduct.isAvailable || currentProduct.countInStock <= 0) {
      warnings.push({ name: item.name, reason: 'Item is currently unavailable' });
      continue;
    }

    // Check price change
    if (currentProduct.price !== item.price) {
      warnings.push({
        name: item.name,
        reason: 'Price updated',
        oldPrice: item.price,
        newPrice: currentProduct.price
      });
    }

    // Build cart item with current product data
    cartItems.push({
      product: currentProduct._id.toString(),
      name: currentProduct.name,
      image: currentProduct.image,
      price: currentProduct.price,
      qty: item.qty,
      selectedSize: item.selectedSize,
      customizations: item.customizations || []
    });
  }

  res.json({
    success: true,
    cartItems,
    warnings,
    originalOrderNumber: originalOrder.orderNumber
  });
});

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getOrders,
  getOrderReceipt,
  startCooking,
  markReady,
  dispatchOrder,
  getUserOrderHistory,
  reorderItems
};
