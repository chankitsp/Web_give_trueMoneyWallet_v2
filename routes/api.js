const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Claim = require('../models/Claim');
const Queue = require('../models/Queue');
const Counter = require('../models/Counter');
const checkIp = require('../middleware/checkIp');


// --- Admin Routes ---

// Create New Event
router.post('/createtw/create-event', checkIp, async (req, res) => {
    const { startTime, endTime, rewardCode, trueMoneyUrl } = req.body;
    try {
        // Generate random 8-char code
        const code = Math.random().toString(36).substring(2, 10);

        const newEvent = new Event({
            code,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            rewardCode,
            trueMoneyUrl
        });

        await newEvent.save();
        res.json({ success: true, eventCode: code, link: `/event/${code}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Public Event Routes ---

// Get Event Config
router.get('/event-config/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const event = await Event.findOne({ code });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Check Reward Code
router.post('/check-code', async (req, res) => {
    const { code, eventCode } = req.body;
    try {
        const event = await Event.findOne({ code: eventCode });
        if (event && event.rewardCode === code) {
            res.json({ valid: true });
        } else {
            res.json({ valid: false });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Check Duplicate Phone (Per Event)
router.post('/check-phone', async (req, res) => {
    const { phoneNumber, eventCode } = req.body;
    try {
        const existingClaim = await Claim.findOne({ phoneNumber, eventCode });
        if (existingClaim) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Join Queue
router.post('/join-queue', async (req, res) => {
    const { phoneNumber, eventCode } = req.body;
    try {
        // Validate Phone Number
        const phoneRegex = /^0[689]\d{8}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number format' });
        }

        // Validate Event
        const event = await Event.findOne({ code: eventCode });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // 1. Check if already claimed for this event
        const existingClaim = await Claim.findOne({ phoneNumber, eventCode });
        if (existingClaim) {
            return res.status(400).json({ success: false, message: 'คุณเคยรับซองนี้แล้ว' });
        }

        // 2. Check if already in queue for this event
        let queueEntry = await Queue.findOne({ phoneNumber, eventCode });

        if (queueEntry) {
            if (queueEntry.status === 'failed') {
                // Previous attempt failed, allow retry by deleting old entry
                await Queue.deleteOne({ _id: queueEntry._id });
                queueEntry = null; // Reset to create new one
            } else if (queueEntry.status === 'completed') {
                return res.status(400).json({ success: false, message: 'Phone number already claimed' });
            }
        }

        if (!queueEntry) {
            // Atomic Increment (Global sequence is fine, or per event? Global is simpler for now)
            // Actually, for multi-event, queueNumber should probably be per-event if we want "Queue #1" for each event.
            // But to keep it simple and robust, we can use a global counter or a composite ID.
            // Let's stick to global counter for simplicity of implementation, 
            // OR better: count documents in this event to get the next number? No, race conditions.
            // Let's use the Counter model but with eventCode as ID?

            const counter = await Counter.findOneAndUpdate(
                { _id: `queue_${eventCode}` },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            queueEntry = new Queue({
                phoneNumber,
                eventCode,
                queueNumber: counter.seq,
                status: 'waiting'
            });
            await queueEntry.save();
        }

        // Calculate wait time
        // Count people ahead IN THIS EVENT
        const peopleAhead = await Queue.countDocuments({
            eventCode,
            queueNumber: { $lt: queueEntry.queueNumber },
            status: { $in: ['waiting', 'processing'] }
        });

        const estimatedWaitTime = peopleAhead * 5; // 5 seconds per person

        res.json({
            success: true,
            queueNumber: queueEntry.queueNumber,
            peopleAhead,
            estimatedWaitTime
        });

    } catch (err) {
        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Already in queue' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Get Queue Status
router.get('/queue-status/:eventCode/:phoneNumber', async (req, res) => {
    const { eventCode, phoneNumber } = req.params;
    try {
        // Check for completed/failed status first
        let queueEntry = await Queue.findOne({ phoneNumber, eventCode });

        if (!queueEntry) {
            return res.json({ status: 'not_found' });
        }

        // If completed or failed, return immediately
        if (queueEntry.status === 'completed' || queueEntry.status === 'failed') {
            return res.json({
                status: queueEntry.status,
                queueNumber: queueEntry.queueNumber,
                peopleAhead: 0,
                estimatedWaitTime: 0,
                canClaim: false,
                failureReason: queueEntry.failureReason // Return failure reason
            });
        }

        const peopleAhead = await Queue.countDocuments({
            eventCode,
            queueNumber: { $lt: queueEntry.queueNumber },
            status: { $in: ['waiting', 'processing'] }
        });

        const estimatedWaitTime = peopleAhead * 5;

        res.json({
            status: queueEntry.status,
            queueNumber: queueEntry.queueNumber,
            peopleAhead,
            estimatedWaitTime,
            canClaim: false
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Queue History
router.get('/queue-history/:eventCode', async (req, res) => {
    const { eventCode } = req.params;
    try {
        const history = await Queue.find({ eventCode })
            .sort({ queueNumber: -1 })
            .limit(10)
            .select('queueNumber phoneNumber status');

        // Mask phone numbers
        const maskedHistory = history.map(item => ({
            queueNumber: item.queueNumber,
            phoneNumber: item.phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1-xxxx-$2'),
            status: item.status
        }));

        res.json(maskedHistory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
