require('dotenv').config();
const mongoose = require('mongoose');
const Queue = require('./models/Queue');
const Claim = require('./models/Claim');

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected');
        await Queue.deleteMany({});
        await Claim.deleteMany({});
        console.log('Queue and Claims cleared');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
