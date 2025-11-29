const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('claims');

        // List indexes
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        // Drop the index on phoneNumber if it exists
        const indexName = 'phoneNumber_1'; // Standard name, but checking list is safer
        const indexExists = indexes.some(idx => idx.name === indexName);

        if (indexExists) {
            await collection.dropIndex(indexName);
            console.log(`Dropped index: ${indexName}`);
        } else {
            console.log(`Index ${indexName} not found.`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

dropIndex();
