const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    reservationDate: {
        type: Date,
        required: true
    },
    reservationTime: {
        type: String, // e.g., "19:00"
        required: true
    },
    numberOfGuests: {
        type: Number,
        required: true,
        min: 1
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    tableNumber: {
        type: Number
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['EasyPaisa', 'JazzCash', 'Bank Transfer'],
        default: 'EasyPaisa'
    },
    paymentReference: { type: String },
    paymentScreenshot: { type: String },
    advanceAmount: {
        type: Number,
        default: 1000
    },
    specialRequests: {
        type: String
    },
    occasion: {
        type: String // e.g., "Birthday", "Anniversary"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Reservation', reservationSchema);
