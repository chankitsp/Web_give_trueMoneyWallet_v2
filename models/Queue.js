const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    queueNumber: {
        type: Number,
        required: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['waiting', 'processing', 'completed', 'failed'],
        default: 'waiting'
    },
    eventCode: {
        type: String,
        required: true,
        index: true
    }
});

// Compound index to ensure unique phone number per event
queueSchema.index({ phoneNumber: 1, eventCode: 1 }, { unique: true });

module.exports = mongoose.model('Queue', queueSchema);
