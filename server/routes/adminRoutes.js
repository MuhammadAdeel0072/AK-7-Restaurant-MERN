const express = require('express');
const router = express.Router();
const { 
    getAdminStats, 
    getAllUsers, 
    updateUserRole,
    getAllSubscriptions,
    updateSubscriptionStatus
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { onlyAdmin } = require('../middleware/adminMiddleware');

router.use(protect, onlyAdmin);

router.get('/stats', getAdminStats);
router.get('/analytics/dashboard', getAdminStats); // Alias for admin dashboard
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/subscriptions', getAllSubscriptions);
router.put('/subscriptions/:id/status', updateSubscriptionStatus);

module.exports = router;
