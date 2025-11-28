require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to db');
});

mongoose.connection.on('error', (err) => {
    console.log('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

const checkIp = require('./middleware/checkIp');

// Serve Admin Page
app.get('/admin', checkIp, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve Event Page
app.get('/event/:code', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Routes
app.use('/api', apiRoutes);

// --- Background Queue Processor ---
const Queue = require('./models/Queue');
const Claim = require('./models/Claim');
const Event = require('./models/Event');

// Mock TrueMoney API (Same as in api.js)
const claimTrueMoney = async (phoneNumber) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (Math.random() > 0) return { success: true };
    throw new Error('TrueMoney API Error');
};

let isProcessing = false;

const processQueue = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
        // 1. Find next in line (Global FIFO, but respecting event boundaries)
        // We can just pick the oldest 'waiting' item regardless of event
        const nextInQueue = await Queue.findOne({ status: 'waiting' }).sort({ joinedAt: 1 });

        if (nextInQueue) {
            console.log(`Processing queue: ${nextInQueue.phoneNumber} for event ${nextInQueue.eventCode}`);

            // Update to processing
            nextInQueue.status = 'processing';
            await nextInQueue.save();

            try {
                // Call TrueMoney API
                // In real world, we might need event-specific config here
                // const event = await Event.findOne({ code: nextInQueue.eventCode });

                await claimTrueMoney(nextInQueue.phoneNumber);

                // Success
                nextInQueue.status = 'completed';
                await nextInQueue.save();

                // Create Claim Record
                const newClaim = new Claim({
                    phoneNumber: nextInQueue.phoneNumber,
                    eventCode: nextInQueue.eventCode,
                    amount: 10, // Mock amount
                    status: 'success'
                });
                await newClaim.save();
                console.log(`Claim SUCCESS: ${nextInQueue.phoneNumber}`);

            } catch (err) {
                console.error(`Claim FAILED: ${nextInQueue.phoneNumber}`, err.message);
                nextInQueue.status = 'failed';
                await nextInQueue.save();
            }
        }
    } catch (err) {
        console.error('Queue Processor Error:', err);
    } finally {
        isProcessing = false;
    }
};

// Run queue processor every 1 second
setInterval(processQueue, 1000);
// ----------------------------------

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
