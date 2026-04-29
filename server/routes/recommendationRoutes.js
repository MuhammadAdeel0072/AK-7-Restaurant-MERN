const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../services/RecommendationService');
const asyncHandler = require('express-async-handler');

// @desc    Get recommendations based on cart items
// @route   GET /api/recommendations
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
    const { cartItems } = req.query;
    const itemIds = cartItems ? cartItems.split(',') : [];
    
    const recommendations = await getRecommendations(itemIds);
    res.json(recommendations);
}));

module.exports = router;
