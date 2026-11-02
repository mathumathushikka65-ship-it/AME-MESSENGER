
const express = require('express');
const router = express.Router();

const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const authMiddleware = require('../Middleware/authMiddleware');

// Send a new message
router.post('/:conversationId', authMiddleware, async (req, res) => {
    try {
        const { content, messageType, fileUrl, fileName } = req.body;
        const { conversationId } = req.params;

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.userId
        });

        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation not found'
            });
        }

        if (messageType === 'text' && !content?.trim()) {
            return res.status(400).json({
                message: 'Message content is required'
            });
        }

        const message = await Message.create({
            conversationId,
            sender: req.userId,
            content: content || '',
            messageType: messageType || 'text',
            fileUrl: fileUrl || '',
            fileName: fileName || ''
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'username email');

        // Send real-time message to other participants
        const io = req.app.get('io');

        if (io) {
            conversation.participants.forEach((participant) => {
                const participantId = participant.toString();

                if (participantId !== req.userId.toString()) {
                    io.to(`user:${participantId}`).emit(
                        'new-message',
                        populatedMessage
                    );
                }
            });
        }

        res.status(201).json({
            message: 'Message sent successfully',
            data: populatedMessage
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to send message',
            error: error.message
        });
    }
});

// Get conversation messages
router.get('/:conversationId', authMiddleware, async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.conversationId,
            participants: req.userId
        });

        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation not found'
            });
        }

        const messages = await Message.find({
            conversationId: req.params.conversationId
        })
            .populate('sender', 'username email')
            .sort({ createdAt: 1 });

        res.status(200).json(messages);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to get messages',
            error: error.message
        });
    }
});

module.exports = router;


