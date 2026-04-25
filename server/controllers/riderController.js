const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const { emitEvent } = require('../services/socketService');
const { 
    calculateDistance, 
    isPointNearRoute, 
    optimizeRouteSequence 
} = require('../services/routeService');

// @desc    Get all available orders for riders
// @route   GET /api/rider/available
// @access  Private/Rider
const getAvailableOrders = asyncHandler(async (req, res) => {
    // Only show orders ready for delivery that aren't assigned to anyone yet
    const orders = await Order.find({
        status: { $in: ['READY_FOR_DELIVERY', 'DISPATCHED'] },
        rider: { $exists: false }
    })
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: 1 });

    res.json(orders);
});

// @desc    Get smart nearby orders based on route
// @route   GET /api/rider/nearby-orders
// @access  Private/Rider
const getNearbyOrders = asyncHandler(async (req, res) => {
    const { lat, lng } = req.query; // Current rider location
    
    // 1. Get all ready orders
    const readyOrders = await Order.find({
        status: { $in: ['READY_FOR_DELIVERY', 'DISPATCHED'] },
        rider: { $exists: false }
    }).populate('user', 'firstName lastName email');

    // 2. Get rider's current active mission to check route
    const activeMission = await Order.findOne({
        rider: req.user._id,
        status: { $in: ['ACCEPTED', 'PICKED_UP'] }
    });

    const suggestions = readyOrders.map(order => {
        const orderLoc = { 
            lat: order.shippingAddress.lat || 33.6844, // Fallback to ISB
            lng: order.shippingAddress.lng || 73.0479 
        };
        
        let onRoute = false;
        let dist = calculateDistance(lat, lng, orderLoc.lat, orderLoc.lng);
        
        if (activeMission && activeMission.shippingAddress.lat) {
            const start = { lat: parseFloat(lat), lng: parseFloat(lng) };
            const end = { 
                lat: activeMission.shippingAddress.lat, 
                lng: activeMission.shippingAddress.lng 
            };
            onRoute = isPointNearRoute(start, end, orderLoc, 5); // 5km threshold
        }

        return {
            ...order.toObject(),
            distance: dist.toFixed(2),
            onRoute
        };
    });

    // Sort: onRoute first, then distance
    suggestions.sort((a, b) => {
        if (a.onRoute && !b.onRoute) return -1;
        if (!a.onRoute && b.onRoute) return 1;
        return a.distance - b.distance;
    });

    res.json(suggestions);
});

// @desc    Get current active jobs for the rider
// @route   GET /api/rider/my-orders
// @access  Private/Rider
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({
        rider: req.user._id,
        status: { $in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'ARRIVED'] }
    })
    .populate('user', 'firstName lastName email')
    .sort({ sequenceNumber: 1, updatedAt: -1 });

    res.json(orders);
});

// @desc    Add order to current route (Batching)
// @route   POST /api/rider/add-to-route/:orderId
// @access  Private/Rider
const addToRoute = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);

    if (!order || order.rider) {
        res.status(400);
        throw new Error('Order unavailable for batching');
    }

    const activeMissions = await Order.find({
        rider: req.user._id,
        status: { $in: ['ACCEPTED', 'PICKED_UP'] }
    });

    if (activeMissions.length >= 4) {
        res.status(400);
        throw new Error('Mission Capacity Reached (Max 4 orders)');
    }

    // Assign to current route group
    const routeGroupId = activeMissions[0]?.routeGroupId || `ROUTE-${Date.now()}`;
    
    order.rider = req.user._id;
    order.status = 'ACCEPTED';
    order.routeGroupId = routeGroupId;
    order.acceptedAt = Date.now();
    order.statusHistory.push({ status: 'ACCEPTED', timestamp: Date.now() });

    await order.save();

    // Re-optimize sequence for all orders in this route
    const allRouteOrders = await Order.find({
        rider: req.user._id,
        status: { $in: ['ACCEPTED', 'PICKED_UP'] }
    });

    // We'd need rider's current location here for true optimization
    // For now, simple greedy sort by distance from first order's origin or current loc
    // ... logic for sequenceNumber ...

    emitEvent(null, 'orderUpdate', order);
    res.json(order);
});

// @desc    Initial claim of an order (Moves status to ASSIGNED)
// @route   POST /api/rider/claim/:orderId
// @access  Private/Rider
const claimOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);

    if (!order || order.rider || !['READY_FOR_DELIVERY', 'DISPATCHED'].includes(order.status)) {
        res.status(400);
        throw new Error('Mission already assigned or not ready');
    }

    order.rider = req.user._id;
    order.status = 'ASSIGNED';
    order.assignedAt = Date.now();
    order.statusHistory.push({ status: 'ASSIGNED', timestamp: Date.now() });

    const updatedOrder = await order.save();
    emitEvent(null, 'orderUpdate', updatedOrder);

    res.json(updatedOrder);
});

// @desc    Rider accepts the assignment
const acceptOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);

    if (!order || order.rider?.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Unauthorized');
    }

    order.status = 'ACCEPTED';
    order.acceptedAt = Date.now();
    order.statusHistory.push({ status: 'ACCEPTED', timestamp: Date.now() });

    const updatedOrder = await order.save();
    emitEvent(null, 'orderUpdate', updatedOrder);
    res.json(updatedOrder);
});

// @desc    Rider picks up order from restaurant
const pickupOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);

    if (!order || order.rider?.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Unauthorized');
    }

    order.status = 'PICKED_UP';
    order.pickedUpAt = Date.now();
    order.statusHistory.push({ status: 'PICKED_UP', timestamp: Date.now() });

    const updatedOrder = await order.save();
    emitEvent(null, 'orderUpdate', updatedOrder);
    res.json(updatedOrder);
});

// @desc    Rider reaches customer location
const arrivedAtDestination = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) throw new Error('Order not found');

    order.status = 'ARRIVED';
    order.arrivedAt = Date.now();
    order.statusHistory.push({ status: 'ARRIVED', timestamp: Date.now() });

    const updatedOrder = await order.save();
    emitEvent(null, 'orderUpdate', updatedOrder);
    res.json(updatedOrder);
});

// @desc    Rider confirms delivery
const confirmDelivery = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) throw new Error('Order not found');

    order.status = 'DELIVERED';
    order.deliveredAt = Date.now();
    order.statusHistory.push({ status: 'DELIVERED', timestamp: Date.now() });

    if (order.paymentMethod === 'cod') {
        order.isPaid = true;
        order.paidAt = Date.now();
    }

    const updatedOrder = await order.save();
    emitEvent(null, 'orderUpdate', updatedOrder);
    res.json(updatedOrder);
});

// @desc    Get rider performance stats
const getRiderStats = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = await Order.countDocuments({
        rider: req.user._id,
        status: 'DELIVERED',
        deliveredAt: { $gte: today }
    });

    const activeOrdersCount = await Order.countDocuments({
        rider: req.user._id,
        status: { $in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'ARRIVED'] }
    });

    const totalDeliveries = await Order.countDocuments({
        rider: req.user._id,
        status: 'DELIVERED'
    });

    res.json({
        completedToday,
        activeOrders: activeOrdersCount,
        totalDeliveries
    });
});

module.exports = {
    getAvailableOrders,
    getNearbyOrders,
    getMyOrders,
    addToRoute,
    claimOrder,
    acceptOrder,
    pickupOrder,
    arrivedAtDestination,
    confirmDelivery,
    getRiderStats
};
