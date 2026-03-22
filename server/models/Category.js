const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    image: {
        type: String,
        required: true,
        default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop'
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
