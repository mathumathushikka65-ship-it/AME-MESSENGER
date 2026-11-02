
const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({

    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },

    caller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    callType: {
        type: String,
        enum: ['audio', 'video'],
        required: true
    },

    status: {
        type: String,
        enum: ['ringing', 'accepted', 'rejected', 'missed', 'ended'],
        default: 'ringing'
    },

    startedAt: {
        type: Date,
        default: Date.now
    },

    endedAt: {
        type: Date,
        default: null
    },

    duration: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

module.exports = mongoose.model('Call', callSchema);
