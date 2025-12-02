require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const twApi = require('@opecgame/twapi');
const checkIp = require('./middleware/checkIp');

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



// Serve Admin Page
app.get('/createtw', checkIp, (req, res) => {
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



const processingEvents = new Set();

const processEvent = async (eventCode) => {
    if (processingEvents.has(eventCode)) return;
    processingEvents.add(eventCode);

    try {
        // Find next in line for THIS event
        const nextInQueue = await Queue.findOne({ eventCode, status: 'waiting' }).sort({ queueNumber: 1 });

        if (nextInQueue) {
            console.log(`Processing queue: ${nextInQueue.phoneNumber} for event ${nextInQueue.eventCode}`);

            // Update to processing
            nextInQueue.status = 'processing';
            await nextInQueue.save();

            try {
                // Call TrueMoney API
                const event = await Event.findOne({ code: nextInQueue.eventCode });
                if (!event || !event.trueMoneyUrl) {
                    throw new Error('Event or TrueMoney Link not found');
                }

                // Extract code from URL if needed
                let giftCode = event.trueMoneyUrl;
                if (giftCode.includes('v=')) {
                    giftCode = giftCode.split('v=')[1].split('&')[0];
                }

                console.log(`Attempting to claim for ${nextInQueue.phoneNumber} with code ${giftCode}`);

                const tw = await twApi(giftCode, nextInQueue.phoneNumber);

                if (tw.status.code === 'SUCCESS') {
                    // Success
                    nextInQueue.status = 'completed';
                    await nextInQueue.save();

                    // Create Claim Record
                    try {
                        const newClaim = new Claim({
                            phoneNumber: nextInQueue.phoneNumber,
                            eventCode: nextInQueue.eventCode,
                            amount: tw.data.my_ticket.amount_baht || 0, // Use actual amount if available
                            status: 'success'
                        });
                        await newClaim.save();
                    } catch (saveErr) {
                        if (saveErr.code === 11000) {
                            console.log(`Claim record already exists for ${nextInQueue.phoneNumber} (treated as success)`);
                        } else {
                            console.error('Error saving claim record:', saveErr);
                        }
                    }
                    console.log(`Claim SUCCESS: ${nextInQueue.phoneNumber}`);
                } else {
                    // Handle failure
                    console.log(`Claim Failed: ${nextInQueue.phoneNumber}, Status: ${tw.status.code}`);
                    nextInQueue.status = 'failed';
                    nextInQueue.failureReason = tw.status.code; // Save the error code
                    await nextInQueue.save();
                }

            } catch (err) {
                console.error(`Claim FAILED: ${nextInQueue.phoneNumber}`, err.message);
                nextInQueue.status = 'failed';
                nextInQueue.failureReason = err.message;
                await nextInQueue.save();
            }
        }
    } catch (err) {
        console.error(`Queue Processor Error for ${eventCode}:`, err);
    } finally {
        processingEvents.delete(eventCode);
    }
};

const processQueues = async () => {
    try {
        // Find all events that have waiting items
        const activeEvents = await Queue.distinct('eventCode', { status: 'waiting' });

        for (const eventCode of activeEvents) {
            processEvent(eventCode);
        }
    } catch (err) {
        console.error('Error finding active queues:', err);
    }
};

// Run queue processor every 1 second
setInterval(processQueues, 1000);
// ----------------------------------

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
