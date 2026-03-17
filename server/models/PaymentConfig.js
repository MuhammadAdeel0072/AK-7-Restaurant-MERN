const mongoose = require('mongoose');

const paymentConfigSchema = new mongoose.Schema({
    easypaisaNumber: { type: String, default: '03001234567' },
    jazzcashNumber: { type: String, default: '03007654321' },
    bankAccount: { type: String, default: '1234567890123456' },
    accountTitle: { type: String, default: 'AK-7 RESTAURANT' },
    bankName: { type: String, default: 'Habib Bank Limited (HBL)' }
}, {
    timestamps: true
});

module.exports = mongoose.model('PaymentConfig', paymentConfigSchema);
