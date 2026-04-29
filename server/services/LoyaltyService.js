const User = require('../models/User');

/**
 * Add loyalty points based on order total
 * 1 point = Rs. 10 spent
 */
const awardPoints = async (userId, orderTotal) => {
    try {
        const pointsToAdd = Math.floor(orderTotal / 10);
        const user = await User.findById(userId);
        
        if (!user) return;

        user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsToAdd;

        // Update Tier Logic
        // Bronze: < 500 points
        // Silver: 500 - 1500 points
        // Gold: 1500 - 5000 points
        // Platinum: > 5000 points
        
        if (user.loyaltyPoints >= 5000) {
            user.loyaltyTier = 'Platinum';
        } else if (user.loyaltyPoints >= 1500) {
            user.loyaltyTier = 'Gold';
        } else if (user.loyaltyPoints >= 500) {
            user.loyaltyTier = 'Silver';
        } else {
            user.loyaltyTier = 'Bronze';
        }

        await user.save();
        return user.loyaltyPoints;
    } catch (error) {
        console.error('Error awarding loyalty points:', error);
    }
};

module.exports = { awardPoints };
