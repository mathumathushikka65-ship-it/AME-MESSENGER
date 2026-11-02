
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['personal', 'group'],
        default: 'personal'
    },

    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    groupName: {
        type: String,
        default: ''
    },

    groupImage: {
        type: String,
        default: ''
    },

    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);