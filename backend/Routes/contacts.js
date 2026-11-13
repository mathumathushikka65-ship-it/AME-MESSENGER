const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Contact = require('../models/contact');
const User = require('../models/User');
const authMiddleware = require('../Middleware/authMiddleware');

// Ellaa contact routes-kum login venum
router.use(authMiddleware);

// Contact-oda user-oda edhu data-va anuppalam (password illa)
const USER_FIELDS = 'username email role about isOnline lastSeen profilePhoto';

// GET MY CONTACTS
router.get('/', async (req, res) => {
    try {
        const contacts = await Contact.find({
            owner: req.userId,
            isHidden: { $ne: true }
        })
            .populate('contactUser', USER_FIELDS)
            .sort({ createdAt: -1 });

        // Account delete aana users-a remove pannum
        res.status(200).json(contacts.filter((contact) => contact.contactUser));

    } catch (error) {
        res.status(500).json({
            message: 'Failed to get contacts',
            error: error.message
        });
    }
});

// ADD CONTACT BY EMAIL
router.post('/', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const nickname = String(req.body.nickname || '').trim().slice(0, 60);

        if (!email) {
            return res.status(400).json({
                message: 'Email address is required'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: 'No registered user found with this email'
            });
        }

        if (String(user._id) === String(req.userId)) {
            return res.status(400).json({
                message: 'You cannot add yourself as a contact'
            });
        }

        const existing = await Contact.findOne({
            owner: req.userId,
            contactUser: user._id
        });

        if (existing) {
            return res.status(409).json({
                message: 'This person is already in your contacts'
            });
        }

        const contact = await Contact.create({
            owner: req.userId,
            contactUser: user._id,
            nickname
        });

        await contact.populate('contactUser', USER_FIELDS);

        res.status(201).json(contact);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'This person is already in your contacts'
            });
        }

        res.status(500).json({
            message: 'Failed to add contact',
            error: error.message
        });
    }
});

// UPDATE CONTACT (nickname mattum)
router.put('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid contact id'
            });
        }

        const nickname = String(req.body.nickname || '').trim().slice(0, 60);

        const contact = await Contact.findOneAndUpdate(
            { _id: req.params.id, owner: req.userId },
            { $set: { nickname } },
            { new: true }
        ).populate('contactUser', USER_FIELDS);

        if (!contact) {
            return res.status(404).json({
                message: 'Contact not found'
            });
        }

        res.status(200).json(contact);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to update contact',
            error: error.message
        });
    }
});

// DELETE CONTACT
router.delete('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid contact id'
            });
        }

        const contact = await Contact.findOneAndDelete({
            _id: req.params.id,
            owner: req.userId
        });

        if (!contact) {
            return res.status(404).json({
                message: 'Contact not found'
            });
        }

        res.status(200).json({
            message: 'Contact deleted successfully',
            id: req.params.id
        });

    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete contact',
            error: error.message
        });
    }
});

module.exports = router;