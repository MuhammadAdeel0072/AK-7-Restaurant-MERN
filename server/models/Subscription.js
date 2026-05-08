const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerName: String,
    email: String,
    phone: String,
    address: String,
    
    mealPlan: {
        type: String,
        default: 'Gourmet Meal Plan'
    },
    duration: {
        type: String,
        enum: ['1 Week', '2 Weeks', '1 Month', '2 Months'],
        required: true
    },
    mealsPerDay: {
        type: Number,
        default: 1
    },
    deliveryDays: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    deliveryTime: {
        type: String,
        default: '20:00'
    },
    
    schedule: [
        {
            day: {
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                required: true
            },
            time: {
                type: String, // format "HH:mm"
                required: true
            },
            items: [
                {
                    product: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Product',
                        required: true
                    },
                    name: String,
                    qty: { type: Number, required: true },
                    size: {
                        type: String,
                        enum: ['Small', 'Regular', 'Large'],
                        required: true
                    },
                    price: { type: Number, required: true },
                    customizations: [
                        {
                            name: String,
                            selection: String,
                            extraPrice: Number
                        }
                    ]
                }
            ]
        }
    ],
    
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    remainingDays: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED'],
        default: 'PAID'
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'EXPIRED', 'CANCELLED'],
        default: 'PENDING'
    },
    
    pausedAt: { type: Date },
    resumedAt: { type: Date },
    cancellationReason: String,
    
    historyLogs: [
        {
            action: String,
            date: { type: Date, default: Date.now },
            note: String,
            performedBy: String
        }
    ],
    
    timezone: { type: String, default: 'Asia/Karachi' },
    nextRunAt: { type: Date },
    lastRunAt: { type: Date }
}, {
    timestamps: true
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
