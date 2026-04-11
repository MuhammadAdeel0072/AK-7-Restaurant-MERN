const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    role: {
        type: String,
        enum: ['customer', 'admin', 'chef', 'rider'],
        default: 'customer'
    },
    addresses: [
        {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            isDefault: { type: Boolean, default: false }
        }
    ],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    loyaltyPoints: { type: Number, default: 0 },
    loyaltyTier: {
        type: String,
        enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
        default: 'Bronze'
    },
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    
    // Validate password exists and is a string
    if (!this.password || typeof this.password !== 'string' || this.password.length === 0) {
        const error = new Error('Password must be a non-empty string');
        console.error(`❌ Invalid password format for ${this.email}:`, error.message);
        throw error;
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log(`🔐 Password hashed successfully for user: ${this.email}`);
    } catch (error) {
        console.error(`❌ Error hashing password for ${this.email}:`, error.message);
        throw error;
    }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    try {
        // Validate entered password
        if (!enteredPassword || typeof enteredPassword !== 'string' || enteredPassword.length === 0) {
            console.error('❌ Password comparison error: Entered password is invalid');
            return false;
        }
        
        // Validate stored password
        if (!this.password || typeof this.password !== 'string') {
            console.error(`❌ Password comparison error: Stored password is invalid for user ${this.email}`);
            throw new Error('Server error: User password data is corrupted');
        }
        
        // Compare passwords using bcrypt
        const isMatch = await bcrypt.compare(enteredPassword, this.password);
        return isMatch;
    } catch (error) {
        console.error(`❌ Bcrypt comparison error:`, error.message);
        throw error;
    }
};

module.exports = mongoose.model('User', userSchema);

