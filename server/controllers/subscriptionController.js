const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');
const { emitEvent } = require('../services/socketService');

// @desc    Get all subscriptions (Admin Only)
// @route   GET /api/subscriptions/admin/all
// @access  Private/Admin
const getAllSubscriptions = asyncHandler(async (req, res) => {
    const subscriptions = await Subscription.find({})
        .populate('user', 'firstName lastName email phoneNumber')
        .populate('schedule.items.product')
        .sort({ createdAt: -1 });
    res.json(subscriptions);
});

// @desc    Get subscription by ID
// @route   GET /api/subscriptions/:id
// @access  Private
const getSubscriptionById = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id).populate('schedule.items.product');
    if (subscription && (subscription.user.toString() === req.user._id.toString() || req.user.role === 'admin')) {
        res.json(subscription);
    } else {
        res.status(404);
        throw new Error('Subscription not found');
    }
});

// @desc    Create a new subscription
// @route   POST /api/subscriptions
// @access  Private
const createSubscription = asyncHandler(async (req, res) => {
    const { 
        schedule, 
        duration, 
        customerName, 
        email, 
        phone, 
        address, 
        totalPrice,
        mealsPerDay,
        deliveryDays,
        deliveryTime
    } = req.body;

    if (!schedule || schedule.length === 0) {
        res.status(400);
        throw new Error('Please provide a schedule');
    }

    // Duration mapping
    const durationDays = {
        '1 Week': 7,
        '2 Weeks': 14,
        '1 Month': 30,
        '2 Months': 60
    };

    const days = durationDays[duration] || 7;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    const subscription = new Subscription({
        user: req.user._id,
        customerName: customerName || `${req.user.firstName} ${req.user.lastName}`,
        email: email || req.user.email,
        phone: phone || req.user.phoneNumber,
        address: address || 'Profile Address',
        duration,
        mealsPerDay,
        deliveryDays,
        deliveryTime,
        schedule: schedule.map(s => ({
            ...s,
            items: s.items.map(i => ({
                product: i.product,
                name: i.name,
                qty: i.qty,
                size: i.size,
                price: i.price,
                customizations: i.customizations
            }))
        })),
        startDate,
        endDate,
        remainingDays: days,
        totalPrice,
        paymentStatus: 'PENDING',
        status: 'PENDING',
        historyLogs: [{
            action: 'CREATED',
            note: `Plan created for ${duration}. Awaiting payment.`,
            performedBy: 'Customer'
        }]
    });

    const createdSubscription = await subscription.save();
    
    // Notify client about pending plan
    emitEvent(req.user._id.toString(), 'subscription_created', createdSubscription);
    
    res.status(201).json(createdSubscription);
});

// @desc    Confirm payment and activate subscription
// @route   POST /api/subscriptions/:id/activate
// @access  Private
const activateSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);

    if (subscription && subscription.user.toString() === req.user._id.toString()) {
        if (subscription.status !== 'PENDING') {
            res.status(400);
            throw new Error('Only pending plans can be activated');
        }

        subscription.status = 'ACTIVE';
        subscription.paymentStatus = 'PAID';
        subscription.historyLogs.push({
            action: 'ACTIVATED',
            note: 'Payment confirmed. Plan is now active.',
            performedBy: 'System'
        });

        const updated = await subscription.save();
        
        // Notify Client & Admin
        emitEvent(subscription.user.toString(), 'subscription_paid', updated);
        emitEvent('admin', 'subscription_created', updated);
        emitEvent('admin', 'subscription_updated', updated);

        res.json(updated);
    } else {
        res.status(404);
        throw new Error('Plan not found');
    }
});

// @desc    Admin Update Subscription
// @route   PUT /api/subscriptions/admin/:id
// @access  Private/Admin
const adminUpdateSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);

    if (subscription) {
        const { 
            duration, 
            status, 
            mealsPerDay, 
            deliveryTime, 
            remainingDays,
            endDate
        } = req.body;

        if (duration) subscription.duration = duration;
        if (mealsPerDay) subscription.mealsPerDay = mealsPerDay;
        if (deliveryTime) subscription.deliveryTime = deliveryTime;
        if (deliveryDays) subscription.deliveryDays = deliveryDays;
        if (remainingDays !== undefined) subscription.remainingDays = remainingDays;
        if (endDate) subscription.endDate = new Date(endDate);

        if (status && status !== subscription.status) {
            subscription.status = status;
            subscription.historyLogs.push({
                action: 'STATUS_CHANGE',
                note: `Status updated to ${status}`,
                performedBy: 'Admin'
            });
        }

        const updated = await subscription.save();
        
        // Sync with Client
        emitEvent(subscription.user.toString(), 'subscription_updated', updated);
        emitEvent('admin', 'subscription_updated', updated);

        res.json(updated);
    } else {
        res.status(404);
        throw new Error('Subscription not found');
    }
});

// @desc    Pause subscription
// @route   PUT /api/subscriptions/:id/pause
// @access  Private
const pauseSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);

    if (subscription && (subscription.user.toString() === req.user._id.toString() || req.user.role === 'admin')) {
        if (subscription.status !== 'ACTIVE') {
            res.status(400);
            throw new Error('Only active subscriptions can be paused');
        }

        subscription.status = 'PAUSED';
        subscription.pausedAt = new Date();
        subscription.historyLogs.push({
            action: 'PAUSED',
            note: 'Subscription paused temporarily',
            performedBy: req.user.role === 'admin' ? 'Admin' : 'Customer'
        });

        const updated = await subscription.save();
        
        emitEvent(subscription.user.toString(), 'subscription_paused', updated);
        emitEvent('admin', 'subscription_updated', updated);

        res.json(updated);
    } else {
        res.status(404);
        throw new Error('Subscription not found');
    }
});

// @desc    Resume subscription
// @route   PUT /api/subscriptions/:id/resume
// @access  Private
const resumeSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);

    if (subscription && (subscription.user.toString() === req.user._id.toString() || req.user.role === 'admin')) {
        if (subscription.status !== 'PAUSED') {
            res.status(400);
            throw new Error('Only paused subscriptions can be resumed');
        }

        // Recalculate end date based on remaining days
        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + subscription.remainingDays);
        
        subscription.status = 'ACTIVE';
        subscription.endDate = newEndDate;
        subscription.resumedAt = new Date();
        subscription.historyLogs.push({
            action: 'RESUMED',
            note: `Subscription resumed. New end date: ${newEndDate.toLocaleDateString()}`,
            performedBy: req.user.role === 'admin' ? 'Admin' : 'Customer'
        });

        const updated = await subscription.save();

        emitEvent(subscription.user.toString(), 'subscription_resumed', updated);
        emitEvent('admin', 'subscription_updated', updated);

        res.json(updated);
    } else {
        res.status(404);
        throw new Error('Subscription not found');
    }
});

// @desc    Cancel subscription
// @route   PUT /api/subscriptions/:id/cancel
// @access  Private
const cancelSubscription = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const subscription = await Subscription.findById(req.params.id);

    if (subscription && (subscription.user.toString() === req.user._id.toString() || req.user.role === 'admin')) {
        subscription.status = 'CANCELLED';
        subscription.cancellationReason = reason || 'No reason provided';
        subscription.historyLogs.push({
            action: 'CANCELLED',
            note: `Cancelled: ${reason || 'No reason'}`,
            performedBy: req.user.role === 'admin' ? 'Admin' : 'Customer'
        });

        const updated = await subscription.save();

        emitEvent(subscription.user.toString(), 'subscription_cancelled', updated);
        emitEvent('admin', 'subscription_updated', updated);

        res.json(updated);
    } else {
        res.status(404);
        throw new Error('Subscription not found');
    }
});

// @desc    Get user subscriptions
// @route   GET /api/subscriptions
// @access  Private
const getMySubscriptions = asyncHandler(async (req, res) => {
    const subscriptions = await Subscription.find({ user: req.user._id })
        .populate('schedule.items.product');
    res.json(subscriptions);
});

// @desc    Top up wallet
// @route   POST /api/subscriptions/wallet/topup
// @access  Private
const topUpWallet = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Invalid amount');
    }

    const user = await User.findById(req.user._id);
    if (user) {
        user.walletBalance += Number(amount);
        await user.save();
        res.json({ walletBalance: user.walletBalance });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update subscription (Client)
// @route   PUT /api/subscriptions/:id
// @access  Private
const updateSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);

    if (subscription && subscription.user.toString() === req.user._id.toString()) {
        const { schedule, deliveryTime, deliveryDays, duration, mealsPerDay, totalPrice } = req.body;

        if (schedule) subscription.schedule = schedule;
        if (deliveryTime) subscription.deliveryTime = deliveryTime;
        if (deliveryDays) subscription.deliveryDays = deliveryDays;
        if (duration) subscription.duration = duration;
        if (mealsPerDay) subscription.mealsPerDay = mealsPerDay;
        if (totalPrice) subscription.totalPrice = totalPrice;

        subscription.historyLogs.push({
            action: 'UPDATED',
            note: 'Plan schedule updated by customer',
            performedBy: 'Customer'
        });

        const updated = await subscription.save();
        
        emitEvent(subscription.user.toString(), 'subscription_updated', updated);
        emitEvent('admin', 'subscription_updated', updated);

        res.json(updated);
    } else {
        res.status(404);
        throw new Error('Subscription not found');
    }
});

module.exports = {
    createSubscription,
    getSubscriptionById,
    getMySubscriptions,
    topUpWallet,
    getAllSubscriptions,
    adminUpdateSubscription,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    updateSubscription,
    activateSubscription
};
