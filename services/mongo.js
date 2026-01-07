const mongoose = require('mongoose');
require('dotenv').config();
const MONGO_URL = process.env.MONGO_URL;

mongoose.connection.once('open', () => {
    console.log('MongoDB connection ready!');
});

mongoose.connection.on('error', (err) => {
    console.error(err);
});

async function mongoConnect(retries = 5) {
    try {
        await mongoose.connect(MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (error) {
        if (retries > 0) {
            console.log(`MongoDB connection failed. Retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
            return mongoConnect(retries - 1);
        }
        console.error('❌ Could not connect to MongoDB:', error.message);
        console.warn('⚠️ Server will continue without MongoDB. Some features may be unavailable.');
        // 不終止進程，讓服務器繼續運行
    }
}

async function mongoDisconnect() {
    await mongoose.disconnect();
};

// 將 mongoose.connection 當作 mongoClient 匯出
const mongoClient = mongoose.connection;

module.exports = {
    mongoConnect,
    mongoDisconnect,
    mongoClient
}