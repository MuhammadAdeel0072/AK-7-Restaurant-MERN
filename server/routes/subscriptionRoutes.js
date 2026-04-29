const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Subscription = require('../models/Subscription');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');

const subscriptionSchema = Joi.object({
    schedule: Joi.array().items(
        Joi.object({
            day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
            time: Joi.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
            items: Joi.array().items(
                Joi.object({
                    product: Joi.string().required(),
                    qty: Joi.number().min(1).required(),
                    customizations: Joi.array().items(
                        Joi.object({
                            name: Joi.string(),
                            selection: Joi.string(),
                            extraPrice: Joi.number()
                        })
                    )
                })
            ).min(1).required()
        })
    ).min(1).required(),
    endDate: Joi.date().greater('now')
});

// @desc    Create a new subscription
// @route   POST /api/subscriptions
// @access  Private
router.post('/', protect, asyncHandler(async (req, res) => {
    const { error } = subscriptionSchema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const { schedule, endDate } = req.body;

    const subscription = new Subscription({
        user: req.user._id,
        schedule,
        endDate,
        isActive: true
    });

    const createdSubscription = await subscription.save();
    res.status(201).json(createdSubscription);
}));

// @desc    Get user subscriptions
// @route   GET /api/subscriptions
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
    const subscriptions = await Subscription.find({ user: req.user._id })
        .populate('schedule.items.product');
    res.json(subscriptions);
}));

// @desc    Toggle subscription status
// @route   PUT /api/subscriptions/:id/toggle
// @access  Private
router.put('/:id/toggle', protect, asyncHandler(async (req, res) => {
    const subscription = await Subscription.findById(req.params.id);

    if (subscription && subscription.user.toString() === req.user._id.toString()) {
        subscription.isActive = !subscription.isActive;
        await subscription.save();
        res.json(subscription);
    } else {
        res.status(404);
        throw new Error('Subscription not found');
    }
}));

module.exports = router;
