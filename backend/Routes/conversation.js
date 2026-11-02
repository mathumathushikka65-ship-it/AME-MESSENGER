
const express = require('express');
const router = express.Router();

const Conversation = require('../models/Conversation');
const User = require('../models/User');
const authMiddleware = require('../Middleware/authMiddleware');

// Create personal chat
router.post('/personal', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId || userId === req.userId) {
            return res.status(400).json({
                message: 'Please select another user'
            });
        }

        const selectedUser = await User.findById(userId);

        if (!selectedUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        let conversation = await Conversation.findOne({
            type: 'personal',
            participants: { $all: [req.userId, userId], $size: 2 }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                type: 'personal',
                participants: [req.userId, userId]
            });
        }

        res.status(200).json(conversation);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to create personal chat',
            error: error.message
        });
    }
});

// Create group chat
router.post('/group', authMiddleware, async (req, res) => {
    try {
        const { groupName, participants } = req.body;

        if (!groupName?.trim()) {
            return res.status(400).json({
                message: 'Group name is required'
            });
        }

        const memberIds = [...new Set([
            req.userId,
            ...(Array.isArray(participants) ? participants : [])
        ].map(id => String(id)))];

        const users = await User.find({
            _id: { $in: memberIds }
        });

        if (users.length !== memberIds.length) {
            return res.status(400).json({
                message: 'One or more users were not found'
            });
        }

        const conversation = await Conversation.create({
            type: 'group',
            groupName: groupName.trim(),
            participants: memberIds,
            groupAdmin: req.userId
        });

        res.status(201).json({
            message: 'Group created successfully',
            conversation
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to create group',
            error: error.message
        });
    }
});

// Get all conversations of logged-in user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.userId
        })
            .populate('participants', 'username email')
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'sender',
                    select: 'username'
                }
            })
            .sort({ updatedAt: -1 });

        res.status(200).json(conversations);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to get conversations',
            error: error.message
        });
    }
});

module.exports = router;

