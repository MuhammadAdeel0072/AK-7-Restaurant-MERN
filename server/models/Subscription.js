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
                    qty: { type: Number, required: true },
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
    isActive: { type: Boolean, default: true },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    lastOrderedAt: { type: Date }
}, {
    timestamps: true
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
