
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Contact = require('../models/contact');
const authMiddleware = require('../Middleware/authMiddleware');

// Check valid MongoDB ID
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get populated group
const getPopulatedGroup = async (groupId) => {
    return await Conversation.findById(groupId)
        .populate('participants', 'username email profilePhoto role isOnline')
        .populate('groupAdmin', 'username email profilePhoto');
};

// Check group and admin permissions
const checkGroupAdmin = async (groupId, userId) => {
    const group = await Conversation.findOne({
        _id: groupId,
        type: 'group'
    });

    if (!group) {
        return { error: 'Group not found', status: 404 };
    }

    if (String(group.groupAdmin) !== String(userId)) {
        return { error: 'Only the group creator/admin can perform this action', status: 403 };
    }

    return { group };
};


// Start or resume the signed-in user's direct chat with an active admin.
router.post('/admin', authMiddleware, async (req, res) => {
    try {
        const requester = await User.findById(req.userId).select('role');
        if (!requester || requester.role === 'admin') {
            return res.status(403).json({ message: 'This action is available to regular users only.' });
        }

        const admin = await User.findOne({ role: 'admin', status: 'Active' }).sort({ createdAt: 1 }).select('_id');
        if (!admin) {
            return res.status(503).json({ message: 'Admin support is currently unavailable.' });
        }

        let conversation = await Conversation.findOne({
            type: 'personal',
            participants: { $all: [req.userId, admin._id], $size: 2 }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                type: 'personal',
                participants: [req.userId, admin._id]
            });
        }

        return res.status(200).json(conversation);
    } catch (error) {
        console.error('Start admin chat error:', error);
        return res.status(500).json({ message: 'Unable to open Admin chat.' });
    }
});

// Create personal chat
router.post('/personal', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId || !isValidId(userId) || userId === req.userId) {
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
       const { groupName, participants, groupImage = '' } = req.body;

        if (!groupName?.trim()) {
            return res.status(400).json({
                message: 'Group name is required'
            });
        }

        const memberIds = [...new Set([
            req.userId,
            ...(Array.isArray(participants) ? participants : [])
        ].map(id => String(id)))];

        if (!memberIds.every(isValidId)) {
            return res.status(400).json({
                message: 'Invalid participant ID'
            });
        }

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
    groupImage,
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
            .populate(
                'participants',
                'username email profilePhoto role isOnline'
            )
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'sender',
                    select: 'username profilePhoto'
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


// Add members to an existing group - ADMIN ONLY
router.post('/group/:groupId/members', authMiddleware, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userIds } = req.body;

        if (!isValidId(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID' });
        }

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                message: 'Please select at least one contact'
            });
        }

        const result = await checkGroupAdmin(groupId, req.userId);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        const group = result.group;

        const newIds = [...new Set(userIds.map(id => String(id)))];

        if (!newIds.every(isValidId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Only saved contacts can be invited
        const savedContacts = await Contact.find({
            owner: req.userId,
            contactUser: { $in: newIds }
        });

        const savedContactIds = savedContacts.map(contact =>
            String(contact.contactUser)
        );

        if (savedContactIds.length !== newIds.length) {
            return res.status(403).json({
                message: 'You can invite only users from your saved contacts'
            });
        }

        const existingIds = group.participants.map(id => String(id));

        const usersToAdd = newIds.filter(id => !existingIds.includes(id));

        if (usersToAdd.length === 0) {
            return res.status(400).json({
                message: 'Selected users are already group members'
            });
        }

        const users = await User.find({
            _id: { $in: usersToAdd }
        });

        if (users.length !== usersToAdd.length) {
            return res.status(404).json({
                message: 'One or more users were not found'
            });
        }

        group.participants.push(...usersToAdd);
        await group.save();

        const updatedGroup = await getPopulatedGroup(groupId);

        res.status(200).json({
            message: 'Members added successfully',
            conversation: updatedGroup
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to add members',
            error: error.message
        });
    }
});


// Remove a member from group - ADMIN ONLY
router.delete('/group/:groupId/members/:memberId', authMiddleware, async (req, res) => {
    try {
        const { groupId, memberId } = req.params;

        if (!isValidId(groupId) || !isValidId(memberId)) {
            return res.status(400).json({ message: 'Invalid ID' });
        }

        const result = await checkGroupAdmin(groupId, req.userId);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        const group = result.group;

        if (String(group.groupAdmin) === String(memberId)) {
            return res.status(400).json({
                message: 'Admin cannot remove themselves. Use Leave Group instead.'
            });
        }

        if (!group.participants.some(id => String(id) === String(memberId))) {
            return res.status(404).json({
                message: 'This user is not a group member'
            });
        }

        group.participants = group.participants.filter(
            id => String(id) !== String(memberId)
        );

        await group.save();

        const updatedGroup = await getPopulatedGroup(groupId);

        res.status(200).json({
            message: 'Member removed successfully',
            conversation: updatedGroup
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to remove member',
            error: error.message
        });
    }
});


// Leave group - ANY MEMBER
router.post('/group/:groupId/leave', authMiddleware, async (req, res) => {
    try {
        const { groupId } = req.params;

        if (!isValidId(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID' });
        }

        const group = await Conversation.findOne({
            _id: groupId,
            type: 'group'
        });

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const isMember = group.participants.some(
            id => String(id) === String(req.userId)
        );

        if (!isMember) {
            return res.status(403).json({
                message: 'You are not a member of this group'
            });
        }

        group.participants = group.participants.filter(
            id => String(id) !== String(req.userId)
        );

        // If the group creator leaves, transfer admin to the next member
        if (String(group.groupAdmin) === String(req.userId)) {
            if (group.participants.length > 0) {
                group.groupAdmin = group.participants[0];
            } else {
                await group.deleteOne();

                return res.status(200).json({
                    message: 'You left the group. The empty group was deleted.',
                    conversation: null
                });
            }
        }

        await group.save();

        const updatedGroup = await getPopulatedGroup(groupId);

        res.status(200).json({
            message: 'You left the group successfully',
            conversation: updatedGroup
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to leave group',
            error: error.message
        });
    }
});


// Edit group name and image - ADMIN ONLY
router.put('/group/:groupId/details', authMiddleware, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { groupName, groupImage } = req.body;

        if (!isValidId(groupId)) {
            return res.status(400).json({ message: 'Invalid group ID' });
        }

        const result = await checkGroupAdmin(groupId, req.userId);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        const group = result.group;

        if (groupName !== undefined) {
            if (!groupName.trim()) {
                return res.status(400).json({
                    message: 'Group name cannot be empty'
                });
            }

            group.groupName = groupName.trim();
        }

        if (groupImage !== undefined) {
            group.groupImage = groupImage;
        }

        await group.save();

        const updatedGroup = await getPopulatedGroup(groupId);

        res.status(200).json({
            message: 'Group details updated successfully',
            conversation: updatedGroup
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update group details',
            error: error.message
        });
    }
});

module.exports = router;






