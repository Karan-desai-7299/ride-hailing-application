const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
const connectToDb = require('./db/db');
const userRoutes = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');
const mapsRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(async (req, res, next) => {
    try {
        await connectToDb();
        next();
    } catch (err) {
        next(err);
    }
});

app.get('/', (req, res) => {
    res.send('Ride Hailing Backend Running ✅');
});

app.get('/api', (req, res) => {
    res.send('Ride Hailing Backend Running ✅');
});

app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapsRoutes);
app.use('/rides', rideRoutes);

// Support Vercel serverless /api prefix routing
app.use('/api/users', userRoutes);
app.use('/api/captains', captainRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/rides', rideRoutes);

app.use((err, req, res, next) => {
    console.error('Express error:', err.message);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error'
    });
});
module.exports = app;
