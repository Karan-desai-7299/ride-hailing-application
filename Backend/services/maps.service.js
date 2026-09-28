const axios = require('axios');
const captainModel = require('../models/captain.model');

const getMapboxToken = () => {
    return process.env.MAPBOX_TOKEN || process.env.GOOGLE_MAPS_API || '';
};

module.exports.getAddressCoordinate = async (address) => {
    if (!address) {
        throw new Error('Address is required');
    }

    const token = getMapboxToken();

    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}`;
        const response = await axios.get(url);

        if (response.data && response.data.features && response.data.features.length > 0) {
            const [ lng, lat ] = response.data.features[0].center;
            return {
                ltd: lat,
                lng: lng
            };
        } else {
            throw new Error('Unable to fetch coordinates');
        }
    } catch (error) {
        console.error('Mapbox Geocode Error:', error?.response?.data || error.message);
        throw error;
    }
};

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const token = getMapboxToken();

    try {
        // Geocode origin and destination first
        const originCoords = await module.exports.getAddressCoordinate(origin);
        const destCoords = await module.exports.getAddressCoordinate(destination);

        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.lng},${originCoords.ltd};${destCoords.lng},${destCoords.ltd}?overview=full&geometries=geojson&access_token=${token}`;
        const response = await axios.get(url);

        if (response.data && response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            return {
                distance: {
                    value: Math.round(route.distance), // in meters
                    text: `${(route.distance / 1000).toFixed(1)} km`
                },
                duration: {
                    value: Math.round(route.duration), // in seconds
                    text: `${Math.round(route.duration / 60)} mins`
                }
            };
        } else {
            throw new Error('No routes found');
        }
    } catch (err) {
        console.error('Mapbox DistanceTime Error:', err?.response?.data || err.message);
        throw err;
    }
};

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('Query is required');
    }

    const token = getMapboxToken();

    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?autocomplete=true&access_token=${token}`;
        const response = await axios.get(url);

        if (response.data && response.data.features) {
            return response.data.features.map(feature => feature.place_name).filter(Boolean);
        } else {
            return [];
        }
    } catch (err) {
        console.error('Mapbox Autocomplete Error:', err?.response?.data || err.message);
        throw err;
    }
};

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius, vehicleType) => {
    // radius in km
    const query = {
        status: 'active',
        'location.ltd': { $exists: true },
        'location.lng': { $exists: true }
    };

    if (vehicleType) {
        query['vehicle.vehicleType'] = vehicleType;
    }

    const captains = await captainModel.find(query);

    return captains.filter(captain => {
        const distance = getDistance(ltd, lng, captain.location.ltd, captain.location.lng);
        return distance <= radius;
    });
};