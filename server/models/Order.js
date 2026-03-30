const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    orderItems: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product'
            },
            status: {
                type: String,
                enum: ['pending', 'preparing', 'cooking', 'ready'],
                default: 'pending'
            },
            customizations: [
                {
                    name: String,
                    selection: String,
                    extraPrice: Number
                }
            ]
        }
    ],
    orderType: {
        type: String,
        enum: ['dine-in', 'delivery', 'pickup'],
        default: 'dine-in'
    },
    priority: {
        type: String,
        enum: ['normal', 'urgent', 'vip'],
        default: 'normal'
    },
    specialInstructions: { type: String },
    estimatedPrepTime: { type: Number, default: 20 }, // in minutes
    shippingAddress: {
        address: { type: String },
        city: { type: String },
        postalCode: { type: String },
        country: { type: String },
    },
    paymentMethod: { type: String, required: true },
    paymentReference: { type: String },
    paymentScreenshot: { type: String }, // URL to screenshot
    paymentResult: {
        id: String,
        status: String,
        update_time: String,
        email_address: String,
    },
    taxPrice: { type: Number, default: 0.0 },
    shippingPrice: { type: Number, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    status: {
        type: String,
        enum: ['placed', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'],
        default: 'placed'
    },
    statusHistory: [
        {
            status: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
    preparationStartTime: { type: Date },
    preparationEndTime: { type: Date },
    readyAt: { type: Date },
    deliveredAt: { type: Date },
    orderNumber: { type: String, unique: true },
    loyaltyPointsEarned: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Indexes for performance
orderSchema.index({ status: 1 });
orderSchema.index({ user: 1 });

module.exports = mongoose.model('Order', orderSchema);
