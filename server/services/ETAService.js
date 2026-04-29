const Order = require('../models/Order');
const { emitEvent } = require('./socketService');

/**
 * Calculate dynamic ETA for an order
 * Formula: ETA = prep_time + queue_delay + rider_travel_time
 */
const calculateETA = async (orderId) => {
    try {
        const order = await Order.findById(orderId).populate('orderItems.product');
        if (!order) return null;

        // 1. Preparation Time (average from products or specific estimate)
        let totalPrepTime = order.estimatedPrepTime || 20;
        
        // 2. Queue Delay (based on active PREPARING orders)
        const activeOrdersCount = await Order.countDocuments({
            status: { $in: ['RECEIVED', 'PREPARING'] },
            _id: { $ne: orderId }
        });
        const queueDelay = activeOrdersCount * 2; // Assume 2 mins delay per active order

        // 3. Rider Travel Time (default or based on distance if available)
        let travelTime = 15; // default 15 mins
        if (order.estimatedDistance) {
            // Assume 3 mins per km + 5 mins buffer
            travelTime = Math.ceil(order.estimatedDistance * 3) + 5;
        }

        const totalETAInMinutes = totalPrepTime + queueDelay + travelTime;
        
        const estimatedDeliveryTime = new Date();
        estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + totalETAInMinutes);

        // Update order
        order.estimatedDeliveryTime = estimatedDeliveryTime;
        await order.save();

        // Emit update via socket
        emitEvent(order.user.toString(), 'etaUpdated', {
            orderId: order._id,
            estimatedDeliveryTime,
            remainingMinutes: totalETAInMinutes
        });

        return totalETAInMinutes;
    } catch (error) {
        console.error('Error calculating ETA:', error);
        return null;
    }
};

module.exports = { calculateETA };
