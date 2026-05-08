const mongoose = require('mongoose');

const dayScheduleSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true,
        unique: true
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    openTime: {
        type: String, // "HH:mm"
        default: "17:00"
    },
    closeTime: {
        type: String, // "HH:mm"
        default: "02:00"
    }
}, { timestamps: true });

module.exports = mongoose.model('RestaurantSchedule', dayScheduleSchema);
