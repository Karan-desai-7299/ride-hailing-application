const socketIo = require('socket.io');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');
const rideModel = require('./models/ride.model');

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: [ 'GET', 'POST' ]
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);


        socket.on('join', async (data) => {
            const { userId, userType } = data;

            if (userType === 'user') {
                await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
            } else if (userType === 'captain') {
                await captainModel.findByIdAndUpdate(userId, {
                    socketId: socket.id,
                    status: 'active'
                });
            }
        });


        socket.on('update-location-captain', async (data) => {
            const { userId, location } = data;

            if (!location || !location.ltd || !location.lng) {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            await captainModel.findByIdAndUpdate(userId, {
                location: {
                    ltd: location.ltd,
                    lng: location.lng
                }
            });

            // Forward captain's live location to the passenger if an active ride exists
            try {
                const activeRide = await rideModel.findOne({
                    captain: userId,
                    status: { $in: [ 'accepted', 'ongoing' ] }
                }).populate('user');

                if (activeRide && activeRide.user && activeRide.user.socketId) {
                    io.to(activeRide.user.socketId).emit('captain-location-updated', {
                        ltd: location.ltd,
                        lng: location.lng
                    });
                }
            } catch (err) {
                console.error('Error forwarding captain location:', err);
            }
        });


        // ── Real-time chat bridge ──────────────────────────────────────────────
        socket.on('send-message', async (data) => {
            const { rideId, text, senderType } = data;

            if (!rideId || !text || !senderType) return;

            try {
                const ride = await rideModel.findById(rideId).populate('user').populate('captain');
                if (!ride) return;

                const message = {
                    text,
                    senderType,
                    timestamp: new Date().toISOString()
                };

                if (senderType === 'user' && ride.captain && ride.captain.socketId) {
                    io.to(ride.captain.socketId).emit('receive-message', message);
                } else if (senderType === 'captain' && ride.user && ride.user.socketId) {
                    io.to(ride.user.socketId).emit('receive-message', message);
                }
            } catch (err) {
                console.error('Error relaying chat message:', err);
            }
        });


        socket.on('disconnect', async () => {
            console.log(`Client disconnected: ${socket.id}`);
            await captainModel.findOneAndUpdate({ socketId: socket.id }, { status: 'inactive' });
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {

console.log(messageObject);

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}

module.exports = { initializeSocket, sendMessageToSocketId };