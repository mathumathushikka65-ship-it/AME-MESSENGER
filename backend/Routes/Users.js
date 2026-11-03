const express = require('express');
const router = express.Router();

const User = require('../models/User');
const authMiddleware = require('../Middleware/authMiddleware');

// Get registered users
router.get('/', authMiddleware, async (req, res) => {
    try {
        const search = req.query.search || '';

        const users = await User.find({
            _id: { $ne: req.userId },
            $or: [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        })
            .select('-password')
            .sort({ username: 1 });

        res.status(200).json(users);

    } catch (error) {
        res.status(500).json({
            message: 'Failed to get users',
            error: error.message
        });
    }
});

module.exports = router;