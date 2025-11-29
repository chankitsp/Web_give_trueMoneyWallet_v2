const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true
    },
    claimedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String
    },
    status: {
        type: String,
        enum: ['success', 'failed'],
        default: 'success'
    },
    eventCode: {
        type: String,
        required: true
    }
});

// Compound index to ensure unique phone number per event
claimSchema.index({ phoneNumber: 1, eventCode: 1 }, { unique: true });

module.exports = mongoose.model('Claim', claimSchema);
