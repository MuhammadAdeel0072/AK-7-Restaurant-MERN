const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createSubscription,
    updateSubscription,
    getSubscriptionById,
    getMySubscriptions,
    toggleSubscription,
    deleteSubscription,
    topUpWallet
} = require('../controllers/subscriptionController');

router.route('/')
    .get(protect, getMySubscriptions)
    .post(protect, createSubscription);

router.route('/:id')
    .get(protect, getSubscriptionById)
    .put(protect, updateSubscription)
    .delete(protect, deleteSubscription);

router.route('/:id/toggle')
    .put(protect, toggleSubscription);

router.route('/wallet/topup')
    .post(protect, topUpWallet);

module.exports = router;
