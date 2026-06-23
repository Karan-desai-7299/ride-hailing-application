const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./socket');
const port = process.env.PORT || 3000;

const server = http.createServer(app);

initializeSocket(server);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// ─── Global error handlers — prevent ANY crash ─────────────────────────────

// Catch unhandled Promise rejections (e.g. DB errors, failed API calls)
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason?.message || reason);
    // Do NOT crash — just log it
});

// Catch any completely uncaught exception
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    // Only crash for truly fatal errors, not network errors
    if (err.code !== 'ECONNRESET' && err.code !== 'ETIMEDOUT' && err.code !== 'ECONNREFUSED') {
        console.error('Fatal error, restarting...');
        process.exit(1); // nodemon will restart automatically
    }
});