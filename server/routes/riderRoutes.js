const express = require('express');
const router = express.Router();
const {
    getAvailableOrders,
    getNearbyOrders,
    getMyOrders,
    addToRoute,
    claimOrder,
    acceptOrder,
    pickupOrder,
    arrivedAtDestination,
    confirmDelivery,
    collectCash,
    getRiderStats,
    updateRiderLocation
} = require('../controllers/riderController');
const { protect } = require('../middleware/authMiddleware');
const { riderMiddleware } = require('../middleware/riderMiddleware');

router.use(protect);
router.use(riderMiddleware);

router.get('/available', getAvailableOrders);
router.get('/nearby-orders', getNearbyOrders);
router.get('/my-orders', getMyOrders);
router.get('/stats', getRiderStats);

// Workflow Step-by-Step
router.post('/claim/:orderId', claimOrder);
router.post('/accept/:orderId', acceptOrder);
router.post('/pickup/:orderId', pickupOrder);
router.post('/arrived/:orderId', arrivedAtDestination);
router.post('/collect-cash/:orderId', collectCash);
router.post('/delivered/:orderId', confirmDelivery);
router.post('/location', updateRiderLocation);

// Smart Batching
router.post('/add-to-route/:orderId', addToRoute);

module.exports = router;
