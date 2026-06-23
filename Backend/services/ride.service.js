const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function getFare(pickup, destination) {

    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);

    const baseFare = {
        auto: 30,
        car: 50,
        moto: 20
    };

    const perKmRate = {
        auto: 10,
        car: 15,
        moto: 8
    };

    const perMinuteRate = {
        auto: 2,
        car: 3,
        moto: 1.5
    };



    const fare = {
        auto: Math.round(baseFare.auto + ((distanceTime.distance.value / 1000) * perKmRate.auto) + ((distanceTime.duration.value / 60) * perMinuteRate.auto)),
        car: Math.round(baseFare.car + ((distanceTime.distance.value / 1000) * perKmRate.car) + ((distanceTime.duration.value / 60) * perMinuteRate.car)),
        moto: Math.round(baseFare.moto + ((distanceTime.distance.value / 1000) * perKmRate.moto) + ((distanceTime.duration.value / 60) * perMinuteRate.moto))
    };

    return fare;


}

module.exports.getFare = getFare;


function getOtp(num) {
    function generateOtp(num) {
        const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}


module.exports.createRide = async ({
    user, pickup, destination, vehicleType
}) => {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error('All fields are required');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);
    const fare = await getFare(pickup, destination);

    const ride = await rideModel.create({
        user,
        pickup,
        destination,
        otp: getOtp(6),
        fare: fare[ vehicleType ],
        vehicleType,
        distance: distanceTime.distance.value,
        duration: distanceTime.duration.value
    });

    return ride;
}

module.exports.confirmRide = async ({
    rideId, captain
}) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'accepted',
        captain: captain._id
    })

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    return ride;

}

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    const updatedRide = await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'ongoing'
    }, { new: true }).populate('user').populate('captain');

    return updatedRide;
}

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    const updatedRide = await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'completed'
    }, { new: true }).populate('user').populate('captain');

    return updatedRide;
}


module.exports.cancelRide = async ({ rideId, userId }) => {
    if (!rideId) throw new Error('Ride id is required');
    const ride = await rideModel.findOne({ _id: rideId, user: userId });
    if (!ride) throw new Error('Ride not found');
    if (ride.status !== 'pending') throw new Error('Cannot cancel a ride that is already accepted or ongoing');
    await rideModel.findOneAndUpdate({ _id: rideId }, { status: 'cancelled' });
    return ride;
}

module.exports.getActiveRide = async ({ userId }) => {
    if (!userId) throw new Error('User id is required');
    const ride = await rideModel.findOne({
        user: userId,
        status: { $in: [ 'pending', 'accepted', 'ongoing' ] }
    }).populate('user').populate('captain');
    return ride; // null if none
}

module.exports.getActiveRideCaptain = async ({ captainId }) => {
    if (!captainId) throw new Error('Captain id is required');
    const ride = await rideModel.findOne({
        captain: captainId,
        status: { $in: [ 'accepted', 'ongoing' ] }
    }).populate('user').populate('captain');
    return ride; // null if none
}
