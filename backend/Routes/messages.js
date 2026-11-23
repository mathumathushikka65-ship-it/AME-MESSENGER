
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Contact = require('../models/contact');
const authMiddleware = require('../Middleware/authMiddleware');

router.use(authMiddleware);

// POPULATE MESSAGE DETAILS
const populateMessage = (query) => {
    return query
        .populate('sender', 'username email profilePhoto')
        .populate('assignmentRef', 'title subject description dueDate totalMarks attachments')
        .populate({
            path: 'replyTo',
            select: 'content messageType fileName sender isDeletedForEveryone',
            populate: {
                path: 'sender',
                select: 'username profilePhoto'
            }
        })
        .populate({
            path: 'forwardedFrom',
            select: 'content messageType fileName sender',
            populate: {
                path: 'sender',
                select: 'username profilePhoto'
            }
        });
};

// SEND SOCKET EVENT TO CONVERSATION MEMBERS
const emitToParticipants = (
    io,
    conversation,
    eventName,
    payload,
    excludeUserId = null
) => {
    if (!io) return;

    conversation.participants.forEach((participant) => {
        const participantId = String(
            participant?._id || participant
        );

        if (
            excludeUserId &&
            participantId === String(excludeUserId)
        ) {
            return;
        }

        io.to(`user:${participantId}`).emit(
            eventName,
            payload
        );
    });
};


// SEND A NEW MESSAGE OR REPLY
router.post('/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;

        const {
            content,
            messageType,
            fileUrl,
            fileName,
            assignmentId
        } = req.body;

        const type = messageType || 'text';

        if (!mongoose.isValidObjectId(conversationId)) {
            return res.status(400).json({
                message: 'Invalid conversation ID'
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.userId
        });

        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation not found'
            });
        }

        // Respect a block applied by either participant in personal chats.
        if (conversation.type === 'personal') {
            const otherId = conversation.participants
                .map((participant) => String(participant?._id || participant))
                .find((id) => id !== String(req.userId));
            if (otherId) {
                const blocked = await Contact.findOne({
                    isBlocked: true,
                    $or: [
                        { owner: req.userId, contactUser: otherId },
                        { owner: otherId, contactUser: req.userId }
                    ]
                }).select('_id');
                if (blocked) return res.status(403).json({ message: 'This personal chat is unavailable because one participant has blocked the other.' });
            }
        }

        if (type === 'text' && !content?.trim()) {
            return res.status(400).json({
                message: 'Message content is required'
            });
        }

        if (
            type !== 'text' &&
            !fileUrl &&
            !content?.trim()
        ) {
            return res.status(400).json({
                message: 'Message content or file is required'
            });
        }

        let assignmentRef = null;
        if (type === 'assignment') {
            const sender = await User.findById(req.userId).select('role');
            if (sender?.role !== 'teacher') {
                return res.status(403).json({ message: 'Only teachers can share assignments in chat.' });
            }
            if (!mongoose.isValidObjectId(assignmentId)) {
                return res.status(400).json({ message: 'A valid assignment ID is required.' });
            }
            assignmentRef = await Assignment.findOne({ _id: assignmentId, user: req.userId });
            if (!assignmentRef) {
                return res.status(404).json({ message: 'Assignment not found or you do not own it.' });
            }
            const participantIds = conversation.participants
                .map((participant) => String(participant?._id || participant))
                .filter((id) => id !== String(req.userId));
            const studentRecipients = await User.find({ _id: { $in: participantIds }, role: 'student' }).select('_id');
            const merged = new Set([...(assignmentRef.recipients || []).map(String), ...studentRecipients.map((student) => String(student._id))]);
            assignmentRef.recipients = [...merged];
            await assignmentRef.save();
        }

        // OPTIONAL REPLY MESSAGE
        let replyToId = req.body.replyToId || req.body.replyTo;

        if (replyToId && typeof replyToId === 'object') {
            replyToId = replyToId._id;
        }

        if (replyToId) {
            if (!mongoose.isValidObjectId(replyToId)) {
                return res.status(400).json({
                    message: 'Invalid reply message ID'
                });
            }

            const originalMessage = await Message.findOne({
                _id: replyToId,
                conversationId,
                isDeletedForEveryone: false
            });

            if (!originalMessage) {
                return res.status(404).json({
                    message: 'Original message not found'
                });
            }
        }

        const message = await Message.create({
            conversationId,
            sender: req.userId,
            content: content || '',
            messageType: type,
            fileUrl: fileUrl || '',
            fileName: fileName || '',
            assignmentRef: assignmentRef?._id || null,
            replyTo: replyToId || null
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        const populatedMessage = await populateMessage(
            Message.findById(message._id)
        );

        const io = req.app.get('io');

        emitToParticipants(
            io,
            conversation,
            'new-message',
            populatedMessage,
            req.userId
        );

        res.status(201).json({
            message: 'Message sent successfully',
            data: populatedMessage
        });

    } catch (error) {
        console.error('Send Message Error:', error);

        res.status(500).json({
            message: 'Failed to send message',
            error: error.message
        });
    }
});


// GET CONVERSATION MESSAGES
router.get('/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;

        if (!mongoose.isValidObjectId(conversationId)) {
            return res.status(400).json({
                message: 'Invalid conversation ID'
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.userId
        });

        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation not found'
            });
        }

        // Messages deleted only for this user will be hidden.
        const messages = await Message.find({
            conversationId,
            deletedFor: { $ne: req.userId }
        })
            .populate('sender', 'username email profilePhoto')
            .populate('assignmentRef', 'title subject description dueDate totalMarks attachments')
            .populate({
                path: 'replyTo',
                select: 'content messageType fileName sender isDeletedForEveryone',
                populate: {
                    path: 'sender',
                    select: 'username profilePhoto'
                }
            })
            .populate({
                path: 'forwardedFrom',
                select: 'content messageType fileName sender',
                populate: {
                    path: 'sender',
                    select: 'username profilePhoto'
                }
            })
            .sort({ createdAt: 1 });

        res.status(200).json(messages);

    } catch (error) {
        console.error('Get Messages Error:', error);

        res.status(500).json({
            message: 'Failed to get messages',
            error: error.message
        });
    }
});


// EDIT OWN TEXT MESSAGE
router.put('/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const content = String(req.body.content || '').trim();

        if (!mongoose.isValidObjectId(messageId)) {
            return res.status(400).json({
                message: 'Invalid message ID'
            });
        }

        if (!content) {
            return res.status(400).json({
                message: 'Message content cannot be empty'
            });
        }

    // FIND MESSAGE
const message = await Message.findById(messageId);

if (!message) {
    return res.status(404).json({
        message: 'Message not found'
    });
}

// ONLY MESSAGE OWNER CAN EDIT
if (String(message.sender) !== String(req.userId)) {
    return res.status(403).json({
        message: 'You can edit only your own messages'
    });
}

// ONLY TEXT MESSAGES CAN BE EDITED
// Old messages without messageType are also supported.
if (message.messageType && message.messageType !== 'text') {
    return res.status(400).json({
        message: 'Only text messages can be edited'
    });
}

// DELETED MESSAGES CANNOT BE EDITED
if (message.isDeletedForEveryone === true) {
    return res.status(400).json({
        message: 'Deleted messages cannot be edited'
    });
}

        const conversation = await Conversation.findOne({
            _id: message.conversationId,
            participants: req.userId
        });

        if (!conversation) {
            return res.status(403).json({
                message: 'You are not allowed to edit this message'
            });
        }

        message.content = content;
        message.editedAt = new Date();

        await message.save();

        const updatedMessage = await populateMessage(
            Message.findById(message._id)
        );

        const io = req.app.get('io');

        emitToParticipants(
            io,
            conversation,
            'message-updated',
            updatedMessage
        );

        res.status(200).json({
            message: 'Message updated successfully',
            data: updatedMessage
        });

    } catch (error) {
        console.error('Edit Message Error:', error);

        res.status(500).json({
            message: 'Failed to edit message',
            error: error.message
        });
    }
});


// DELETE MESSAGE
router.delete('/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const deleteFor = req.body.deleteFor;

        if (!mongoose.isValidObjectId(messageId)) {
            return res.status(400).json({
                message: 'Invalid message ID'
            });
        }

        if (!['me', 'everyone'].includes(deleteFor)) {
            return res.status(400).json({
                message: 'Choose deleteFor as me or everyone'
            });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                message: 'Message not found'
            });
        }

        const conversation = await Conversation.findOne({
            _id: message.conversationId,
            participants: req.userId
        });

        if (!conversation) {
            return res.status(403).json({
                message: 'You are not allowed to delete this message'
            });
        }

        const io = req.app.get('io');

        // DELETE ONLY FOR CURRENT USER
        if (deleteFor === 'me') {
            await Message.updateOne(
                {
                    _id: messageId,
                    deletedFor: { $ne: req.userId }
                },
                {
                    $addToSet: {
                        deletedFor: req.userId
                    }
                }
            );

            if (io) {
                io.to(`user:${req.userId}`).emit(
                    'message-deleted',
                    {
                        messageId,
                        conversationId: String(message.conversationId),
                        deleteFor: 'me',
                        deletedBy: String(req.userId)
                    }
                );
            }

            return res.status(200).json({
                message: 'Message deleted for you',
                messageId,
                deleteFor: 'me'
            });
        }

        // DELETE FOR EVERYONE: ONLY MESSAGE SENDER
        if (String(message.sender) !== String(req.userId)) {
            return res.status(403).json({
                message: 'You can delete only your own message for everyone'
            });
        }

        if (message.isDeletedForEveryone) {
            return res.status(400).json({
                message: 'Message has already been deleted'
            });
        }

        message.isDeletedForEveryone = true;
        message.content = '';
        message.fileUrl = '';
        message.fileName = '';

        await message.save();

        const payload = {
            messageId,
            conversationId: String(message.conversationId),
            deleteFor: 'everyone',
            deletedBy: String(req.userId)
        };

        emitToParticipants(
            io,
            conversation,
            'message-deleted',
            payload
        );

        res.status(200).json({
            message: 'Message deleted for everyone',
            messageId,
            deleteFor: 'everyone'
        });

    } catch (error) {
        console.error('Delete Message Error:', error);

        res.status(500).json({
            message: 'Failed to delete message',
            error: error.message
        });
    }
});


// FORWARD MESSAGE TO ANOTHER CONVERSATION
router.post('/:messageId/forward', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { targetConversationId } = req.body;

        if (
            !mongoose.isValidObjectId(messageId) ||
            !mongoose.isValidObjectId(targetConversationId)
        ) {
            return res.status(400).json({
                message: 'Invalid message or conversation ID'
            });
        }

        const originalMessage = await Message.findOne({
            _id: messageId,
            isDeletedForEveryone: false,
            deletedFor: { $ne: req.userId }
        });

        if (!originalMessage) {
            return res.status(404).json({
                message: 'Original message not found'
            });
        }

        // User must be a member of source conversation
        const sourceConversation = await Conversation.findOne({
            _id: originalMessage.conversationId,
            participants: req.userId
        });

        if (!sourceConversation) {
            return res.status(403).json({
                message: 'You cannot access the original message'
            });
        }

        // User must also be a member of target conversation
        const targetConversation = await Conversation.findOne({
            _id: targetConversationId,
            participants: req.userId
        });

        if (!targetConversation) {
            return res.status(404).json({
                message: 'Target conversation not found'
            });
        }

        const forwardedMessage = await Message.create({
            conversationId: targetConversationId,
            sender: req.userId,
            content: originalMessage.content,
            messageType: originalMessage.messageType,
            fileUrl: originalMessage.fileUrl,
            fileName: originalMessage.fileName,
            forwardedFrom: originalMessage._id
        });

        targetConversation.lastMessage = forwardedMessage._id;
        await targetConversation.save();

        const populatedForward = await populateMessage(
            Message.findById(forwardedMessage._id)
        );

        const io = req.app.get('io');

        emitToParticipants(
            io,
            targetConversation,
            'new-message',
            populatedForward,
            req.userId
        );

        res.status(201).json({
            message: 'Message forwarded successfully',
            data: populatedForward
        });

    } catch (error) {
        console.error('Forward Message Error:', error);

        res.status(500).json({
            message: 'Failed to forward message',
            error: error.message
        });
    }
});


// MARK MESSAGES AS READ
router.put('/:conversationId/read', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.userId;

        if (!mongoose.isValidObjectId(conversationId)) {
            return res.status(400).json({
                message: 'Invalid conversation ID'
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId
        });

        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation not found'
            });
        }

        const messages = await Message.find({
            conversationId,
            sender: { $ne: userId },
            'readBy.user': { $ne: userId },
            isDeletedForEveryone: false
        });

        if (messages.length === 0) {
            return res.status(200).json({
                message: 'No unread messages',
                updatedCount: 0
            });
        }

        const messageIds = messages.map((message) => message._id);
        const readAt = new Date();

        await Message.updateMany(
            { _id: { $in: messageIds } },
            {
                $push: {
                    readBy: {
                        user: userId,
                        readAt
                    }
                }
            }
        );

        const io = req.app.get('io');

        if (io) {
            messages.forEach((message) => {
                io.to(`user:${message.sender.toString()}`).emit(
                    'message-read',
                    {
                        messageId: message._id,
                        conversationId,
                        readBy: userId,
                        readAt
                    }
                );
            });
        }

        res.status(200).json({
            message: 'Messages marked as read',
            updatedCount: messages.length
        });

    } catch (error) {
        console.error('Read Messages Error:', error);

        res.status(500).json({
            message: 'Failed to mark messages as read',
            error: error.message
        });
    }
});

module.exports = router;





