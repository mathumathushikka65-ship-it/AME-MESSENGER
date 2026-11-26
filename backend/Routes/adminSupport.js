const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const SupportTicket = require('../models/supportTicket');
const authMiddleware = require('../Middleware/authMiddleware');
const adminMiddleware = require('../Middleware/adminMiddleware');
const nodemailer = require('nodemailer');

router.use(authMiddleware, adminMiddleware);

const STATUSES = ['Open', 'In Progress', 'Resolved'];
const populateTicket = (query) => query
  .populate('user', 'username email role')
  .populate('messages.sender', 'username role');

// List support tickets for the admin inbox.
router.get('/', async (req, res) => {
  try {
    const filter = {};
    const status = String(req.query.status || 'All');
    if (STATUSES.includes(status)) filter.status = status;

    const tickets = await populateTicket(
      SupportTicket.find(filter).sort({ updatedAt: -1 }).limit(200)
    );
    return res.json({ tickets });
  } catch (error) {
    console.error('Admin support list error:', error);
    return res.status(500).json({ message: 'Unable to load support inbox.' });
  }
});

// Load one support conversation.
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid support request ID.' });
    }

    const ticket = await populateTicket(SupportTicket.findById(req.params.id));
    if (!ticket) return res.status(404).json({ message: 'Support request not found.' });

    return res.json({ ticket });
  } catch (error) {
    console.error('Admin get support ticket error:', error);
    return res.status(500).json({ message: 'Unable to load support conversation.' });
  }
});

// Admin reply to a user.
router.post('/:id/reply', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid support request ID.' });
    }

    const message = String(req.body.message || '').trim();
    if (!message || message.length > 5000) {
      return res.status(400).json({ message: 'Reply is required (maximum 5000 characters).' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Support request not found.' });

    ticket.messages.push({ sender: req.userId, senderRole: 'admin', message });
    if (ticket.status === 'Open') ticket.status = 'In Progress';
    await ticket.save();

    const populated = await populateTicket(SupportTicket.findById(ticket._id));

    // Email visitors who submitted a request before logging in (when SMTP is configured).
    let guestEmailSent = null;
    if (ticket.guestEmail) guestEmailSent = false;
    if (ticket.guestEmail && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: String(process.env.SMTP_SECURE || 'false') === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: ticket.guestEmail,
          subject: `AME Support reply: ${ticket.subject}`,
          text: `Hello ${ticket.guestName || 'there'},\n\n${message}\n\nReference: ${ticket._id}`,
        });
        guestEmailSent = true;
      } catch (mailError) {
        console.error('Guest support reply email failed:', mailError.message);
      }
    }

    return res.status(201).json({ message: 'Reply sent successfully.', ticket: populated, guestEmailSent });
  } catch (error) {
    console.error('Admin support reply error:', error);
    return res.status(500).json({ message: 'Unable to send reply.' });
  }
});

// Update support status.
router.patch('/:id/status', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid support request ID.' });
    }

    const status = String(req.body.status || '');
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid support status.' });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Support request not found.' });

    const populated = await populateTicket(SupportTicket.findById(ticket._id));
    return res.json({ message: 'Support status updated.', ticket: populated });
  } catch (error) {
    console.error('Admin support status error:', error);
    return res.status(500).json({ message: 'Unable to update support status.' });
  }
});

module.exports = router;