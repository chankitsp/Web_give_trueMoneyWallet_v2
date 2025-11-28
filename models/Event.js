const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    rewardCode: {
        type: String,
        required: true
    },
    trueMoneyUrl: {
        type: String,
        required: true
    },
    isSystemOpen: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Event', eventSchema);
