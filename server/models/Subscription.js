const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
    timezone: { type: String, default: 'Asia/Karachi' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    status: {
        type: String,
        enum: ['ACTIVE', 'PAUSED', 'CANCELLED'],
        default: 'ACTIVE'
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED'],
        default: 'PAID'
    },
    nextRunAt: { type: Date },
    lastRunAt: { type: Date }
}, {
    timestamps: true
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
