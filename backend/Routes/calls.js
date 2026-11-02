
const express = require('express');
const router = express.Router();

const Call = require('../models/Call');
const Conversation = require('../models/Conversation');
const authMiddleware = require('../Middleware/authMiddleware');

// Start a new call
router.post('/start', authMiddleware, async (req, res) => {
    try {
        const { conversationId, receiverId, callType } = req.body;

        if (!conversationId || !receiverId ||
            !['audio', 'video'].includes(callType)) {
            return res.status(400).json({
                message: 'Invalid call details'
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: { $all: [req.userId, receiverId] }
        });

        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation not found'
            });
        }

        const call = await Call.create({
            conversationId,
            caller: req.userId,
            receiver: receiverId,
            callType,
            status: 'ringing'
        });

        res.status(201).json({
            message: 'Call started',
            call
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to start call',
            error: error.message
        });
    }
});

// Update call status
router.put('/:callId/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            'accepted', 'rejected', 'missed', 'ended'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Invalid call status'
            });
        }

        const call = await Call.findOne({
            _id: req.params.callId,
            $or: [
                { caller: req.userId },
                { receiver: req.userId }
            ]
        });

        if (!call) {
            return res.status(404).json({
                message: 'Call not found'
            });
        }

        call.status = status;

        if (status === 'accepted' && !call.startedAt) {
            call.startedAt = new Date();
        }

        if (status === 'ended') {
            call.endedAt = new Date();

            if (call.startedAt) {
                call.duration = Math.floor(
                    (call.endedAt - call.startedAt) / 1000
                );
            }
        }

        await call.save();

        res.status(200).json({
            message: 'Call status updated',
            call
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update call',
            error: error.message
        });
    }
});

// Get call history
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const calls = await Call.find({
            $or: [
                { caller: req.userId },
                { receiver: req.userId }
            ]
        })
            .populate('caller', 'username')
            .populate('receiver', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json(calls);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to get call history',
            error: error.message
        });
    }
});

module.exports = router;
