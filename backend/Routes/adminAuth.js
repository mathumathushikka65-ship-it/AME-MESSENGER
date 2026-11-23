const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        // Search admin accounts only
        const admin = await User.findOne({
            email: String(email).trim().toLowerCase(),
            role: 'admin'
        });

        if (!admin) {
            return res.status(401).json({
                message: 'Invalid admin email or password'
            });
        }

        // Verify the password first, so the account status is never revealed to someone who does not know it
        const isMatch = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid admin email or password'
            });
        }

        // Inactive admin cannot login
        if (admin.status !== 'Active') {
            return res.status(403).json({
                message: 'This admin account is inactive'
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is missing in .env');
        }

        const token = jwt.sign(
            { userId: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: 'Admin login successful',
            token,
            user: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Admin login error:', error.message);

        return res.status(500).json({
            message: 'Admin login failed'
        });
    }
});

module.exports = router;