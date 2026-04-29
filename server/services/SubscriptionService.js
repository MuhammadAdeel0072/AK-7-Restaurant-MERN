const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const Order = require('../models/Order');
const { calculateETA } = require('./ETAService');

/**
 * Initialize the subscription scheduler
 * Runs every minute to check for scheduled orders
 */
const initSubscriptionScheduler = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        try {
            // Find active subscriptions scheduled for this day and time
            const subscriptions = await Subscription.find({
                isActive: true,
                'schedule.day': currentDay,
                'schedule.time': currentTime,
                $or: [
                    { lastOrderedAt: { $lt: new Date(now.setSeconds(0, 0)) } },
                    { lastOrderedAt: { $exists: false } }
                ]
            }).populate('schedule.items.product');

            for (const sub of subscriptions) {
                // Filter the specific schedule item for today and this time
                const scheduledTask = sub.schedule.find(s => s.day === currentDay && s.time === currentTime);
                
                if (scheduledTask) {
                    await createOrderFromSubscription(sub, scheduledTask);
                }
            }
        } catch (error) {
            console.error('Subscription Scheduler Error:', error);
        }
    });

    console.log('✅ Subscription Scheduler initialized');
};

/**
 * Create a real order from a subscription schedule
 */
const createOrderFromSubscription = async (subscription, scheduleItem) => {
    try {
        const orderItems = scheduleItem.items.map(item => ({
            name: item.product.name,
            qty: item.qty,
            image: item.product.image,
            price: item.product.price,
            product: item.product._id,
            customizations: item.customizations
        }));

        const totalPrice = orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

        const order = new Order({
            user: subscription.user,
            orderItems,
            totalPrice,
            paymentMethod: 'Subscription', // Or use a wallet system
            isPaid: true, // Assuming prepaid
            status: 'RECEIVED',
            orderType: 'delivery',
            orderNumber: `SUB-${Date.now()}-${subscription._id.toString().slice(-4)}`
        });

        await order.save();

        // Update subscription
        subscription.lastOrderedAt = new Date();
        await subscription.save();

        // Trigger ETA calculation
        await calculateETA(order._id);

        console.log(`✅ Automated Order Created: ${order.orderNumber} for User: ${subscription.user}`);
    } catch (error) {
        console.error('Error creating order from subscription:', error);
    }
};

module.exports = { initSubscriptionScheduler };
