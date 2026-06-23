const mongoose = require('mongoose');

const globalForMongoose = global;
if (!globalForMongoose.__uberMongo) {
    globalForMongoose.__uberMongo = {
        conn: null,
        promise: null,
        listenersAttached: false
    };
}

function connectToDb() {
    const cache = globalForMongoose.__uberMongo;

    if (cache.conn || mongoose.connection.readyState === 1) {
        cache.conn = mongoose.connection;
        return Promise.resolve(mongoose.connection);
    }

    if (!cache.promise) {
        cache.promise = mongoose.connect(process.env.DB_CONNECT, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            w: 'majority'
        }).then((conn) => {
            cache.conn = conn;
            console.log('Connected to DB');
            return conn;
        }).catch((err) => {
            cache.promise = null;
            console.error('DB Connection Error:', err.message);
            throw err;
        });
    }

    if (!cache.listenersAttached) {
        mongoose.connection.on('error', (err) => {
            console.error('Mongoose connection error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected.');
            cache.conn = null;
            cache.promise = null;
        });

        cache.listenersAttached = true;
    }

    return cache.promise;
}

module.exports = connectToDb;
