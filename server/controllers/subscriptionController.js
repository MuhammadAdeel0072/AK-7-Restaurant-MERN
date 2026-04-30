const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');

// @desc    Get subscription by ID
// @route   GET /api/subscriptions/:id
// @access  Private
const getSubscriptionById = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id).populate('schedule.items.product');
    if (subscription && subscription.user.toString() === req.user._id.toString()) {
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
    const { schedule, endDate } = req.body;

    if (!schedule || schedule.length === 0) {
        res.status(400);
        throw new Error('Please provide a schedule');
    }

    // Overlap Check
    const existing = await Subscription.find({ user: req.user._id, status: 'ACTIVE' });
    for (const sub of existing) {
        for (const s of sub.schedule) {
            if (schedule.some(ns => ns.day === s.day && ns.time === s.time)) {
                res.status(400);
                throw new Error(`Schedule conflict: You already have a plan on ${s.day} at ${s.time}`);
            }
        }
    }

    const subscription = new Subscription({
        user: req.user._id,
        schedule: schedule.map(s => ({
            ...s,
            items: s.items.map(i => ({
                product: i.product,
                name: i.name,
                qty: i.qty,
                size: i.size,
                price: i.price
            }))
        })),
        endDate,
        isActive: true,
        status: 'ACTIVE'
    });

    const createdSubscription = await subscription.save();
    res.status(201).json(createdSubscription);
});

// @desc    Update subscription
// @route   PUT /api/subscriptions/:id
// @access  Private
const updateSubscription = asyncHandler(async (req, res) => {
    const { schedule, endDate } = req.body;
    const subscription = await Subscription.findById(req.params.id);

    if (subscription && subscription.user.toString() === req.user._id.toString()) {
        // Overlap Check (excluding current)
        const others = await Subscription.find({ 
            user: req.user._id, 
            status: 'ACTIVE',
            _id: { $ne: req.params.id }
        });

        for (const sub of others) {
            for (const s of sub.schedule) {
                if (schedule.some(ns => ns.day === s.day && ns.time === s.time)) {
                    res.status(400);
                    throw new Error(`Schedule conflict: You already have a plan on ${s.day} at ${s.time}`);
                }
            }
        }

        subscription.schedule = schedule;
        subscription.endDate = endDate;
        const updated = await subscription.save();
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

// @desc    Toggle subscription status
// @route   PUT /api/subscriptions/:id/toggle
// @access  Private
const toggleSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);

    if (subscription && subscription.user.toString() === req.user._id.toString()) {
        subscription.isActive = !subscription.isActive;
        await subscription.save();
        res.json(subscription);
    } else {
        res.status(404);
        throw new Error('Subscription not found');
    }
});

// @desc    Delete subscription
// @route   DELETE /api/subscriptions/:id
// @access  Private
const deleteSubscription = asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);

    if (subscription && subscription.user.toString() === req.user._id.toString()) {
        await subscription.deleteOne();
        res.json({ message: 'Subscription cancelled' });
    } else {
        res.status(404);
        throw new Error('Subscription not found');
    }
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

module.exports = {
    createSubscription,
    updateSubscription,
    getSubscriptionById,
    getMySubscriptions,
    toggleSubscription,
    deleteSubscription,
    topUpWallet
};
