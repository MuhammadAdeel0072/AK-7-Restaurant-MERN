const asyncHandler = require('express-async-handler');
const PaymentConfig = require('../models/PaymentConfig');

// @desc    Get payment configuration
// @route   GET /api/payments/config
// @access  Public
const getPaymentConfig = asyncHandler(async (req, res) => {
    let config = await PaymentConfig.findOne();
    
    // If no config exists, create a default one (Simulation convenience)
    if (!config) {
        config = await PaymentConfig.create({});
    }
    
    res.json(config);
});

module.exports = {
    getPaymentConfig
};
