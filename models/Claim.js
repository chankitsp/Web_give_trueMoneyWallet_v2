const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true
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

module.exports = mongoose.model('Claim', claimSchema);
