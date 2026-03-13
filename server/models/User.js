const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String },
    isAdmin: { type: Boolean, default: false, required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
