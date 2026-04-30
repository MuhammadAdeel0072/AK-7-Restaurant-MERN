const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const Order = require('../models/Order');
const User = require('../models/User');
const { calculateETA } = require('./ETAService');
const { emitEvent } = require('./socketService');

/**
 * Initialize the subscription scheduler with dual-job logic
 */
const initSubscriptionScheduler = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        
        // Job A: Create SCHEDULED orders for the future
        await handleOrderCreation(now);
        
        // Job B: Trigger Chef 40 minutes before delivery
        await handleChefTriggers(now);
    });

    console.log('✅ Production Subscription Scheduler initialized');
};

/**
 * Job A: Create scheduled orders for active subscriptions
 * We look for schedules matching current day/time
 */
const handleOrderCreation = async (now) => {
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Karachi' });
    const currentTime = now.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false, 
        timeZone: 'Asia/Karachi' 
    });

    try {
        const subscriptions = await Subscription.find({
            isActive: true,
            status: 'ACTIVE',
            'schedule.day': currentDay,
            'schedule.time': currentTime,
            $or: [
                { lastRunAt: { $lt: new Date(now.setSeconds(0, 0)) } },
                { lastRunAt: { $exists: false } }
            ]
        }).populate('schedule.items.product');

        for (const sub of subscriptions) {
            const scheduledTask = sub.schedule.find(s => s.day === currentDay && s.time === currentTime);
            if (scheduledTask) {
                await createScheduledOrder(sub, scheduledTask, now);
            }
        }
    } catch (error) {
        console.error('Job A Error (Order Creation):', error);
    }
};

/**
 * Create a SCHEDULED order from a subscription
 */
const createScheduledOrder = async (subscription, scheduleItem, now) => {
    try {
        const user = await User.findById(subscription.user);
        if (!user) return;

        const orderItems = scheduleItem.items.map(item => ({
            name: item.name || item.product.name,
            qty: item.qty,
            image: item.product.image,
            price: item.price || item.product.price,
            product: item.product._id,
            selectedSize: {
                name: item.size,
                price: item.price
            },
            customizations: item.customizations
        }));

        const totalPrice = orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

        // Wallet deduction (Prepaid model)
        if (user.walletBalance < totalPrice) {
            console.warn(`Insufficient balance for subscription ${subscription._id}. Skipping.`);
            return;
        }

        user.walletBalance -= totalPrice;
        await user.save();

        // Calculate delivery time (scheduledFor)
        const scheduledFor = new Date(now);
        scheduledFor.setSeconds(0, 0);
        
        // prepStartAt is 40 minutes before delivery
        const prepStartAt = new Date(scheduledFor.getTime() - 40 * 60000);

        const order = new Order({
            user: subscription.user,
            orderItems,
            totalPrice,
            paymentMethod: 'Wallet',
            isPaid: true,
            status: 'SCHEDULED',
            isSubscriptionOrder: true,
            scheduledFor,
            prepStartAt,
            shippingAddress: user.shippingAddress || { phoneNumber: user.phoneNumber, address: 'Profile Address' },
            orderNumber: `SUB-${Date.now()}-${subscription._id.toString().slice(-4)}`
        });

        await order.save();

        // Update subscription tracking
        subscription.lastRunAt = now;
        // Compute next run: this is simplified; in production use a more robust logic for next occurrence
        subscription.nextRunAt = new Date(now.getTime() + 7 * 24 * 60 * 60000); 
        await subscription.save();

        emitEvent(subscription.user.toString(), 'subscriptionUpdated', { message: 'Upcoming order scheduled', orderId: order._id });
        console.log(`✅ Order SCHEDULED: ${order.orderNumber} for ${scheduledFor}`);
    } catch (error) {
        console.error('Error creating scheduled order:', error);
    }
};

/**
 * Job B: Promote SCHEDULED orders to RECEIVED 40m before delivery
 */
const handleChefTriggers = async (now) => {
    try {
        const ordersToTrigger = await Order.find({
            status: 'SCHEDULED',
            prepStartAt: { $lte: now }
        });

        for (const order of ordersToTrigger) {
            order.status = 'RECEIVED';
            order.statusHistory.push({ status: 'RECEIVED', timestamp: now });
            await order.save();

            // Emit to Chef
            emitEvent('kitchen', 'newOrderForChef', order);
            console.log(`🔥 Chef Triggered for Order ${order.orderNumber}`);
        }
    } catch (error) {
        console.error('Job B Error (Chef Trigger):', error);
    }
};

module.exports = { initSubscriptionScheduler };
