const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const {
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
} = require('../controllers/subscriptionController');

// User routes
router.route('/')
    .get(protect, getMySubscriptions)
    .post(protect, createSubscription);

router.route('/wallet/topup')
    .post(protect, topUpWallet);

router.route('/:id')
    .get(protect, getSubscriptionById)
    .put(protect, updateSubscription);

router.route('/:id/pause')
    .put(protect, pauseSubscription);

router.route('/:id/resume')
    .put(protect, resumeSubscription);

router.route('/:id/cancel')
    .put(protect, cancelSubscription);

router.route('/:id/activate')
    .post(protect, activateSubscription);

// Admin routes
router.route('/admin/all')
    .get(protect, admin, getAllSubscriptions);

router.route('/admin/:id')
    .put(protect, admin, adminUpdateSubscription);

module.exports = router;
