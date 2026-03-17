const express = require('express');
const router = express.Router();
const { getPaymentConfig } = require('../controllers/paymentController');

router.get('/config', getPaymentConfig);

module.exports = router;
