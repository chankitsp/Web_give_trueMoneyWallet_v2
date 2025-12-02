const mongoose = require('mongoose');

const eventUrlSchema = new mongoose.Schema({
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
    rewardUrl: {
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

module.exports = mongoose.model('EventUrl', eventUrlSchema);
