const express = require('express');
const router = express.Router();
const {
  getActiveOrders,
  getReadyOrders,
  updateOrderStatus,
  updateItemStatus,
  getKitchenStats
} = require('../controllers/chefController.js');
const { protect, ClerkExpressRequireAuth } = require('../middleware/authMiddleware.js');
const { isChef } = require('../middleware/chefMiddleware.js');

// Get active orders and kitchen stats
router.get('/orders', getActiveOrders);
router.get('/ready-orders', getReadyOrders);
router.get('/stats', getKitchenStats);

// Update order and item status
router.patch('/order/status', updateOrderStatus);
router.patch('/order/item-status', updateItemStatus);

module.exports = router;
