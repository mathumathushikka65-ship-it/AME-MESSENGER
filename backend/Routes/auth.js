
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../Middleware/authMiddleware');


// Signup API
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password || !role) {
            return res.status(400).json({
                message: 'Please fill all fields'
            });
        }

        const allowedRoles = [
            'student',
            'teacher',
            'university',
            'course-center',
            'other'
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                message: 'Invalid user role'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim();

        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { username: normalizedUsername }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'Username or email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hashedPassword,
            role: role
        });

        await newUser.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Signup Error:', error.message);

        res.status(500).json({
            message: 'Signup failed',
            error: error.message
        });
    }
});


// Login API
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Please enter email and password'
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const token = require('jsonwebtoken').sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Login failed',
            error: error.message
        });
    }
});


router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            message: 'User authenticated successfully',
            user
        });

    } catch (error) {
        res.status(500).json({
            message: 'Unable to get user details'
        });
    }
});


module.exports = router;

// Profile Update API

// UPDATE USER PROFILE
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { username, about, phone ,email } = req.body;

        if (!username || !username.trim()) {
            return res.status(400).json({
                message: "Username is required"
            });
        }

        if (username.trim().length > 30) {
            return res.status(400).json({
                message: "Username must be less than 30 characters"
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            {
                username: username.trim(),
                  email: email?.trim().toLowerCase(),
                about: about?.trim() || "",
                phone: phone?.trim() || ""
            },
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "This username is already taken"
            });
        }

        res.status(500).json({
            message: "Unable to update profile",
            error: error.message
        });
    }
});
