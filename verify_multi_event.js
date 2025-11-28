const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    try {
        // 1. Create Event
        console.log('Creating Event...');
        const createRes = await axios.post(`${BASE_URL}/api/admin/create-event`, {
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString(), // +1 hour
            rewardCode: 'TEST1234',
            trueMoneyUrl: 'https://gift.truemoney.com/campaign/?v=xxx'
        });

        if (!createRes.data.success) {
            throw new Error('Failed to create event');
        }

        const eventCode = createRes.data.eventCode;
        console.log(`Event Created: ${eventCode} (${createRes.data.link})`);

        // 2. Join Queue (User 1)
        console.log('[User1] Joining queue...');
        const joinRes1 = await axios.post(`${BASE_URL}/api/join-queue`, {
            phoneNumber: '0811111111',
            eventCode: eventCode
        });
        console.log('[User1] Joined:', joinRes1.data);

        // 3. Join Queue (User 2)
        console.log('[User2] Joining queue...');
        const joinRes2 = await axios.post(`${BASE_URL}/api/join-queue`, {
            phoneNumber: '0822222222',
            eventCode: eventCode
        });
        console.log('[User2] Joined:', joinRes2.data);

        // 4. Poll Status
        let user1Done = false;
        let user2Done = false;

        while (!user1Done || !user2Done) {
            await sleep(2000);

            if (!user1Done) {
                const status1 = await axios.get(`${BASE_URL}/api/queue-status/${eventCode}/0811111111`);
                console.log(`[User1] Status: ${status1.data.status}`);
                if (status1.data.status === 'completed' || status1.data.status === 'failed') user1Done = true;
            }

            if (!user2Done) {
                const status2 = await axios.get(`${BASE_URL}/api/queue-status/${eventCode}/0822222222`);
                console.log(`[User2] Status: ${status2.data.status}`);
                if (status2.data.status === 'completed' || status2.data.status === 'failed') user2Done = true;
            }
        }

        console.log('Test Completed!');

    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

run();
