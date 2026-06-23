const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');
const chatMessageModel = require('../models/chatMessage.model');


module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, pickup, destination, vehicleType } = req.body;

    try {
        const ride = await rideService.createRide({ user: req.user._id, pickup, destination, vehicleType });
        res.status(201).json(ride);

        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);

        let captainsInRadius = await mapService.getCaptainsInTheRadius(pickupCoordinates.ltd, pickupCoordinates.lng, 2, vehicleType);

        // Fallback for testing: if no captains are found within 2km, expand search to 5000km
        if (captainsInRadius.length === 0) {
            captainsInRadius = await mapService.getCaptainsInTheRadius(pickupCoordinates.ltd, pickupCoordinates.lng, 5000, vehicleType);
        }

        ride.otp = ""

        const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('user');

        captainsInRadius.map(captain => {

            sendMessageToSocketId(captain.socketId, {
                event: 'new-ride',
                data: rideWithUser
            })

        })

    } catch (err) {

        console.log(err);
        return res.status(500).json({ message: err.message });
    }

};

module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;

    try {
        const fare = await rideService.getFare(pickup, destination);
        return res.status(200).json(fare);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.confirmRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {

        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;

    try {
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

        console.log(ride);

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-started',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-ended',
            data: ride
        })



        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.getUserHistory = async (req, res) => {
    try {
        const rides = await rideModel.find({ user: req.user._id }).populate('captain').sort({ _id: -1 });
        return res.status(200).json(rides);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.getCaptainHistory = async (req, res) => {
    try {
        const rides = await rideModel.find({ captain: req.captain._id }).populate('user').sort({ _id: -1 });
        return res.status(200).json(rides);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.getPendingRideRequests = async (req, res) => {
    try {
        const vehicleType = req.captain?.vehicle?.vehicleType;
        const rides = await rideModel.find({
            status: 'pending',
            vehicleType
        }).populate('user').sort({ _id: -1 });

        return res.status(200).json(rides);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.cancelRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { rideId } = req.body;
    try {
        const ride = await rideService.cancelRide({ rideId, userId: req.user._id });
        // Notify captain if one was already assigned
        if (ride.captain) {
            const captain = await rideModel.findOne({ _id: rideId }).populate('captain');
            if (captain?.captain?.socketId) {
                sendMessageToSocketId(captain.captain.socketId, {
                    event: 'ride-cancelled',
                    data: { rideId }
                });
            }
        }
        return res.status(200).json({ message: 'Ride cancelled successfully' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.getActiveRide = async (req, res) => {
    try {
        const ride = await rideService.getActiveRide({ userId: req.user._id });
        if (!ride) {
            return res.status(404).json({ message: 'No active ride found' });
        }
        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.getActiveRideCaptain = async (req, res) => {
    try {
        const ride = await rideService.getActiveRideCaptain({ captainId: req.captain._id });
        if (!ride) {
            return res.status(404).json({ message: 'No active ride found' });
        }
        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.getRideMessages = async (req, res) => {
    try {
        const { rideId } = req.query;
        if (!rideId) {
            return res.status(400).json({ message: 'Ride id is required' });
        }

        const ride = await rideModel.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        const isUser = req.authType === 'user' && String(ride.user) === String(req.user._id);
        const isCaptain = req.authType === 'captain' && ride.captain && String(ride.captain) === String(req.captain._id);
        if (!isUser && !isCaptain) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const messages = await chatMessageModel.find({ ride: rideId }).sort({ createdAt: 1 });
        return res.status(200).json(messages);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.sendRideMessage = async (req, res) => {
    try {
        const { rideId, text } = req.body;
        if (!rideId || !text?.trim()) {
            return res.status(400).json({ message: 'Ride id and text are required' });
        }

        const ride = await rideModel.findById(rideId).populate('user').populate('captain');
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        const senderType = req.authType;
        const isUser = senderType === 'user' && String(ride.user._id) === String(req.user._id);
        const isCaptain = senderType === 'captain' && ride.captain && String(ride.captain._id) === String(req.captain._id);
        if (!isUser && !isCaptain) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const message = await chatMessageModel.create({
            ride: rideId,
            senderType,
            text: text.trim()
        });

        const payload = {
            _id: message._id,
            ride: message.ride,
            senderType: message.senderType,
            text: message.text,
            createdAt: message.createdAt
        };

        const recipientSocketId = senderType === 'user'
            ? ride.captain?.socketId
            : ride.user?.socketId;

        if (recipientSocketId) {
            sendMessageToSocketId(recipientSocketId, {
                event: 'receive-message',
                data: payload
            });
        }

        return res.status(201).json(payload);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}
