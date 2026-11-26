const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const SupportTicket = require('../models/supportTicket');
const authMiddleware = require('../Middleware/authMiddleware');

const CATEGORIES = [
  'Account & Login',
  'Messenger',
  'Contacts & Groups',
  'Assignments',
  'Documents',
  'Payments',
  'Other',
];


// Public support form for visitors who cannot log in or sign up.
router.post('/public', async (req, res) => {
  try {
    const guestName = String(req.body.name || '').trim();
    const guestEmail = String(req.body.email || '').trim().toLowerCase();
    const category = String(req.body.category || 'Other').trim();
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();

    if (!guestName || guestName.length > 80) {
      return res.status(400).json({ message: 'Please enter your name (maximum 80 characters).' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail) || guestEmail.length > 254) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Please choose a valid support category.' });
    }
    if (!subject || subject.length > 120 || !message || message.length > 5000) {
      return res.status(400).json({ message: 'Subject and message are required.' });
    }

    const ticket = await SupportTicket.create({
      guestName,
      guestEmail,
      category,
      subject,
      messages: [{ senderRole: 'guest', message }],
    });

    return res.status(201).json({
      message: 'Your request has been sent. Keep this reference number for follow-up.',
      reference: String(ticket._id),
    });
  } catch (error) {
    console.error('Create public support ticket error:', error);
    return res.status(500).json({ message: 'Unable to send support request.' });
  }
});

router.use(authMiddleware);

const populateTicket = (query) => query
  .populate('user', 'username email role')
  .populate('messages.sender', 'username role');

// Create a new support request.
router.post('/', async (req, res) => {
  try {
    const category = String(req.body.category || 'Other').trim();
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Please choose a valid support category.' });
    }
    if (!subject || subject.length > 120) {
      return res.status(400).json({ message: 'Subject is required (maximum 120 characters).' });
    }
    if (!message || message.length > 5000) {
      return res.status(400).json({ message: 'Message is required (maximum 5000 characters).' });
    }

    const ticket = await SupportTicket.create({
      user: req.userId,
      category,
      subject,
      messages: [{ sender: req.userId, senderRole: 'user', message }],
    });

    const populated = await populateTicket(SupportTicket.findById(ticket._id));
    return res.status(201).json({ message: 'Support request sent successfully.', ticket: populated });
  } catch (error) {
    console.error('Create support ticket error:', error);
    return res.status(500).json({ message: 'Unable to send support request.' });
  }
});

// List only the signed-in user's support requests.
router.get('/mine', async (req, res) => {
  try {
    const tickets = await populateTicket(
      SupportTicket.find({ user: req.userId }).sort({ updatedAt: -1 }).limit(100)
    );
    return res.json({ tickets });
  } catch (error) {
    console.error('Load user support tickets error:', error);
    return res.status(500).json({ message: 'Unable to load support requests.' });
  }
});

// View one ticket owned by the signed-in user.
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid support request ID.' });
    }

    const ticket = await populateTicket(
      SupportTicket.findOne({ _id: req.params.id, user: req.userId })
    );
    if (!ticket) return res.status(404).json({ message: 'Support request not found.' });

    return res.json({ ticket });
  } catch (error) {
    console.error('Get user support ticket error:', error);
    return res.status(500).json({ message: 'Unable to load support request.' });
  }
});

// User can add a follow-up message to their own ticket.
router.post('/:id/messages', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid support request ID.' });
    }

    const message = String(req.body.message || '').trim();
    if (!message || message.length > 5000) {
      return res.status(400).json({ message: 'Message is required (maximum 5000 characters).' });
    }

    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.userId });
    if (!ticket) return res.status(404).json({ message: 'Support request not found.' });

    ticket.messages.push({ sender: req.userId, senderRole: 'user', message });
    if (ticket.status === 'Resolved') ticket.status = 'Open';
    await ticket.save();

    const populated = await populateTicket(SupportTicket.findById(ticket._id));
    return res.status(201).json({ message: 'Message sent successfully.', ticket: populated });
  } catch (error) {
    console.error('Add user support message error:', error);
    return res.status(500).json({ message: 'Unable to send message.' });
  }
});

module.exports = router;