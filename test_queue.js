const mongoose = require('mongoose');
const Counter = require('./models/Counter');
const Queue = require('./models/Queue');
const Event = require('./models/Event');
require('dotenv').config();

async function test() {
    await mongoose.connect(process.env.MONGO_URI);

    // Clear previous test data
    await Event.deleteMany({ rewardCode: 'TEST' });
    await Queue.deleteMany({ eventCode: /TEST/ });
    await Counter.deleteMany({ _id: /queue_TEST/ });

    // Create Event A
    const eventA = new Event({
        code: 'TEST_A',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        rewardCode: 'TEST',
        trueMoneyUrl: 'http://test.com/v=123'
    });
    await eventA.save();

    // Create Event B
    const eventB = new Event({
        code: 'TEST_B',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        rewardCode: 'TEST',
        trueMoneyUrl: 'http://test.com/v=456'
    });
    await eventB.save();

    // Mock API call logic (copying from api.js essentially)
    async function joinQueue(phoneNumber, eventCode) {
        const counter = await Counter.findOneAndUpdate(
            { _id: `queue_${eventCode}` },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        return counter.seq;
    }

    const qA1 = await joinQueue('0811111111', 'TEST_A');
    console.log(`Event A, User 1: Queue ${qA1}`);

    const qA2 = await joinQueue('0811111112', 'TEST_A');
    console.log(`Event A, User 2: Queue ${qA2}`);

    const qB1 = await joinQueue('0811111113', 'TEST_B');
    console.log(`Event B, User 1: Queue ${qB1}`);

    if (qA1 === 1 && qA2 === 2 && qB1 === 1) {
        console.log('SUCCESS: Queues are separate and start from 1.');
    } else {
        console.log('FAILED: Queue numbering is incorrect.');
    }

    await mongoose.disconnect();
}

test();
