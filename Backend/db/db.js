const mongoose = require('mongoose');

function connectToDb() {
    mongoose.connect(process.env.DB_CONNECT, {
        serverSelectionTimeoutMS: 10000,   // 10s to find a server
        socketTimeoutMS: 45000,            // 45s socket idle timeout
        heartbeatFrequencyMS: 10000,       // ping Atlas every 10s to keep alive
        retryWrites: true,
        w: 'majority'
    }).then(() => {
        console.log('Connected to DB');
    }).catch(err => {
        console.error('DB Connection Error:', err.message);
        // Retry after 5 seconds
        setTimeout(connectToDb, 5000);
    });

    // Handle connection events
    mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
        setTimeout(connectToDb, 5000);
    });

    mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected successfully.');
    });
}

module.exports = connectToDb;