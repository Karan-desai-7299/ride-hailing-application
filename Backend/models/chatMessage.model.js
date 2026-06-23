const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ride',
        required: true
    },
    senderType: {
        type: String,
        enum: [ 'user', 'captain' ],
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('chatMessage', chatMessageSchema);
