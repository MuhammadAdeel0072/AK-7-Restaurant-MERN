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
        enum: ['normal', 'urgent', 'vip', 'NORMAL', 'URGENT'],
        default: 'normal'
    },
    specialInstructions: { type: String },
    chefFeedback: { type: String },
    estimatedPrepTime: { type: Number, default: 20 }, // in minutes
    shippingAddress: {
        fullName: { type: String },
        phoneNumber: { type: String, required: true },
        address: { type: String, required: true },
        streetAddress: { type: String },
        city: { type: String },
        area: { type: String },
        postalCode: { type: String },
        landmark: { type: String },
        country: { type: String, default: 'Pakistan' },
        lat: { type: Number },
        lng: { type: Number },
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
        enum: [
            'PENDING', 
            'PLACED',
            'PREPARING', 
            'READY_FOR_DELIVERY', 
            'DISPATCHED',
            'ASSIGNED', 
            'ACCEPTED', 
            'PICKED_UP', 
            'ARRIVED', 
            'DELIVERED', 
            'CANCELLED'
        ],
        default: 'PENDING'
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
    assignedAt: { type: Date },
    acceptedAt: { type: Date },
    pickedUpAt: { type: Date },
    arrivedAt: { type: Date },
    deliveredAt: { type: Date },
    orderNumber: { type: String, unique: true },
    loyaltyPointsEarned: { type: Number, default: 0 },
    // --- Smart Batching Fields ---
    routeGroupId: { type: String },
    sequenceNumber: { type: Number, default: 0 },
    deliveryClusterId: { type: String },
    estimatedDistance: { type: Number }, // in km
    estimatedTime: { type: Number }, // in minutes
    // ----------------------------
    rider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    chef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    riderLocation: {
        lat: { type: Number },
        lng: { type: Number },
        updatedAt: { type: Date }
    },
}, {
    timestamps: true
});

// Indexes for performance
orderSchema.index({ status: 1 });
orderSchema.index({ user: 1 });

module.exports = mongoose.model('Order', orderSchema);
