const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * Get product recommendations based on cart items
 * Logic: Frequently bought together or popular in same category
 */
const getRecommendations = async (cartItemIds = []) => {
    try {
        // 1. Get categories of items in cart
        const cartProducts = await Product.find({ _id: { $in: cartItemIds } });
        const categories = cartProducts.map(p => p.category);

        // 2. Find popular items in those categories not in cart
        let recommendations = await Product.find({
            category: { $in: categories },
            _id: { $nin: cartItemIds },
            isAvailable: true
        })
        .limit(5)
        .sort({ isBestSeller: -1 });

        // 3. If not enough, get overall best sellers
        if (recommendations.length < 3) {
            const moreRecs = await Product.find({
                _id: { $nin: [...cartItemIds, ...recommendations.map(r => r._id)] },
                isAvailable: true
            })
            .limit(5 - recommendations.length)
            .sort({ isBestSeller: -1 });
            
            recommendations = [...recommendations, ...moreRecs];
        }

        return recommendations;
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
    }
};

module.exports = { getRecommendations };
