// utils/assignmentChat.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Oru assignment-a thervu senja students-oda personal chat-ku card-aa anuppum
const sendAssignmentCards = async ({ io, assignment, senderId, recipientIds, groupConversations = [] }) => {
    // Groups: group chat-la oru card mattum podum (members ellarukkum real-time)
    const groupMemberIds = new Set();
    for (const group of groupConversations) {
        try {
            const message = await Message.create({
                conversationId: group._id,
                sender: senderId,
                messageType: 'assignment',
                content: assignment.title,
                assignmentRef: assignment._id
            });
            await Conversation.findByIdAndUpdate(group._id, { lastMessage: message._id });
            await message.populate([
                { path: 'sender', select: 'username email profilePhoto' },
                { path: 'assignmentRef', select: 'title subject description dueDate totalMarks attachments' }
            ]);
            group.participants.forEach((id) => {
                groupMemberIds.add(String(id));
                if (io && String(id) !== String(senderId)) io.to(`user:${id}`).emit('new-message', message);
            });
        } catch (error) {
            console.error('Group assignment card error:', String(group._id), error.message);
        }
    }

    // Personal chat: group-la already card vandha members-ku thirumba personal card anuppa vendaam
    for (const recipientId of recipientIds.filter((id) => !groupMemberIds.has(String(id)))) {
        try {
            // 1. Teacher + student rendu perukkum ulla personal chat-a thedum
            let conversation = await Conversation.findOne({
                type: 'personal',
                participants: { $all: [senderId, recipientId], $size: 2 }
            });

            // Chat illana puthusa create pannum
            if (!conversation) {
                conversation = await Conversation.create({
                    type: 'personal',
                    participants: [senderId, recipientId]
                });
            }

            // 2. Assignment card message-a save pannum
            const message = await Message.create({
                conversationId: conversation._id,
                sender: senderId,
                messageType: 'assignment',
                content: assignment.title,
                assignmentRef: assignment._id
            });

            conversation.lastMessage = message._id;
            await conversation.save();

            // 3. Card-ku thevaiyaana kuraintha details mattum (submissions illa)
            // messages.js-la populate pannura madhiri same fields
            await message.populate([
                { path: 'sender', select: 'username email profilePhoto' },
                { path: 'assignmentRef', select: 'title subject description dueDate totalMarks attachments' }
            ]);

            // 4. Real-time-la student-ku mattum anuppum
            // (teacher-ku anuppina, avar chat-la "unread" nu thappaa kaattum)
            if (io) {
                io.to(`user:${recipientId}`).emit('new-message', message);
            }
        } catch (error) {
            // Oru student-ku fail aanaalum matha students-ku continue aagum
            console.error('Assignment card error:', recipientId, error.message);
        }
    }
};

module.exports = { sendAssignmentCards };