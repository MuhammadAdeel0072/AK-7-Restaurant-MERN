const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        required: true
    },
    price: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    isAvailable: { type: Boolean, default: true },
    isSpecial: { type: Boolean, default: false },
    spicyLevel: { type: Number, default: 0 },
    isVegetarian: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    preparationTime: { type: Number, default: 20 },
    dietaryInfo: [String],
    customizations: [
        {
            name: String,
            type: {
                type: String,
                enum: ['select', 'multi-select', 'slider', 'checkbox'],
                default: 'select'
            },
            isRequired: { type: Boolean, default: false },
            options: [
                {
                    name: String,
                    extraPrice: { type: Number, default: 0 }
                }
            ]
        }
    ],
}, {
    timestamps: true
});

// Index for category filtering
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);
