
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },

    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'voice','video'],
        default: 'text'
    },

    content: {
        type: String,
        default: ''
    },

    fileUrl: {
        type: String,
        default: ''
    },

    fileName: {
        type: String,
        default: ''
    },

    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }]

}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);