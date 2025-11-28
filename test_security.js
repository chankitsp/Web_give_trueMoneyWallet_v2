const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSecurity() {
    console.log('--- Testing Admin Security ---');

    // Test 1: Allowed IP (Localhost)
    try {
        const res = await axios.get(`${BASE_URL}/admin`);
        console.log(`[Test 1] Localhost Access: ${res.status === 200 ? 'PASSED (Allowed)' : 'FAILED'}`);
    } catch (err) {
        console.log(`[Test 1] Localhost Access: FAILED (${err.response ? err.response.status : err.message})`);
    }

    // Test 2: Blocked IP (Spoofed)
    try {
        const res = await axios.get(`${BASE_URL}/admin`, {
            headers: { 'X-Forwarded-For': '1.2.3.4' }
        });
        console.log(`[Test 2] External IP Access: FAILED (Should be blocked but got ${res.status})`);
    } catch (err) {
        if (err.response && err.response.status === 403) {
            console.log(`[Test 2] External IP Access: PASSED (Blocked 403)`);
        } else {
            console.log(`[Test 2] External IP Access: FAILED (${err.message})`);
        }
    }
}

testSecurity();
