const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    loginAt: {
        type: Date,
        default: Date.now
    },

    logoutAt: {
        type: Date,
        default: null
    },

    lastActiveAt: {
        type: Date,
        default: Date.now
    },

    sessionStatus: {
        type: String,
        enum: ['Online', 'Offline'],
        default: 'Online'
    },

    ip: {
        type: String,
        default: ''
    },

    userAgent: {
        type: String,
        default: ''
    }

}, { timestamps: true });

module.exports = mongoose.model('LoginLog', loginLogSchema);
