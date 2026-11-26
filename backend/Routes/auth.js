const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../Middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const LoginLog = require('../models/LoginLog');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Signup API
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password || !role) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        const allowedRoles = ['student', 'teacher', 'university', 'course-center', 'other'];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid user role' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim();

        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
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
                role: newUser.role,
                profilePhoto: newUser.profilePhoto || ""
            }
        });

    } catch (error) {
        console.error('Signup Error:', error.message);
        res.status(500).json({ message: 'Signup failed' });
    }
});

// Login API (normal users only. Admins log in through /api/admin-auth/login)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter email and password' });
        }

        const user = await User.findOne({
            email: String(email).trim().toLowerCase()
        });

        // Admin accounts are treated as "not found" here, so this page never reveals them
        if (!user || user.role === 'admin') {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Deactivated by an admin
        if (user.status === 'Inactive') {
            return res.status(403).json({
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        const now = new Date();

        const loginLog = await LoginLog.create({
            user: user._id,
            loginAt: now,
            lastActiveAt: now,
            ip: req.ip,
            userAgent: req.get('user-agent') || '',
            sessionStatus: 'Online'
        });

        user.isOnline = true;
        user.lastSeen = now;
        await user.save();

        const token = jwt.sign(
            { userId: user._id, sessionId: loginLog._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profilePhoto: user.profilePhoto || ""
            }
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ message: 'Login failed' });
    }
});

// Return the authenticated account profile (also used by Admin Settings).
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password -passwordResetToken -passwordResetExpires');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        return res.json({ user });
    } catch (error) {
        console.error('Get current user error:', error.message);
        return res.status(500).json({ message: 'Unable to load account profile.' });
    }
});

// UPDATE USER PROFILE
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const {
            username,
            about,
            phone,
            email,
            profilePhoto,
            profilePhotoPublicId
        } = req.body;

        if (!username || !username.trim()) {
            return res.status(400).json({ message: "Username is required" });
        }

        if (username.trim().length > 30) {
            return res.status(400).json({ message: "Username must be less than 30 characters" });
        }

        const updateData = {
            username: username.trim(),
            about: about?.trim() || "",
            phone: phone?.trim() || ""
        };

        if (email !== undefined) {
            updateData.email = email.trim().toLowerCase();
        }

        if (profilePhoto !== undefined) {
            updateData.profilePhoto = profilePhoto;
        }

        if (profilePhotoPublicId !== undefined) {
            updateData.profilePhotoPublicId = profilePhotoPublicId;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "This username or email is already taken" });
        }

        console.error("Profile Update Error:", error.message);
        res.status(500).json({ message: "Unable to update profile" });
    }
});

// Firebase social sign-in exchange (Google / Facebook popup on the client).
router.post('/oauth', async (req, res) => {
    try {
        const { idToken } = req.body;
        const requestedRole = req.body.role;
        const allowedSocialRoles = ['student', 'teacher', 'university', 'course-center', 'other'];
        const socialRole = allowedSocialRoles.includes(requestedRole) ? requestedRole : 'student';
        const apiKey = process.env.FIREBASE_WEB_API_KEY;

        if (!idToken || !apiKey) {
            return res.status(503).json({
                message: 'Social login is not configured. Add FIREBASE_WEB_API_KEY to the backend environment.'
            });
        }

        const verifyResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            }
        );

        const verified = await verifyResponse.json();
        const identity = verified.users?.[0];

        if (!verifyResponse.ok || !identity?.email) {
            return res.status(401).json({ message: 'Social account verification failed.' });
        }

        const email = identity.email.toLowerCase();
        let user = await User.findOne({ email });

        if (!user) {
            const base =
                String(identity.displayName || email.split('@')[0])
                    .trim()
                    .replace(/[^a-zA-Z0-9_-]/g, '')
                    .slice(0, 24) || 'student';

            let username = base;
            let suffix = 1;

            while (await User.exists({ username })) {
                username = `${base}${suffix++}`;
            }

            user = await User.create({
                username,
                email,
                role: socialRole,
                password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
                profilePhoto: identity.photoUrl || ''
            });
        }

        // Admins must use the admin login. Deactivated users are blocked.
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Social login is not available for this account.' });
        }

        if (user.status === 'Inactive') {
            return res.status(403).json({
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        const now = new Date();

        const loginLog = await LoginLog.create({
            user: user._id,
            loginAt: now,
            lastActiveAt: now,
            ip: req.ip,
            userAgent: req.get('user-agent') || '',
            sessionStatus: 'Online'
        });

        user.isOnline = true;
        user.lastSeen = now;

        if (!user.profilePhoto && identity.photoUrl) {
            user.profilePhoto = identity.photoUrl;
        }

        await user.save();

        const token = jwt.sign(
            { userId: user._id, sessionId: loginLog._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: 'Social login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profilePhoto: user.profilePhoto || ''
            }
        });

    } catch (error) {
        console.error('OAuth exchange error:', error.message);
        return res.status(500).json({ message: 'Social login failed.' });
    }
});

// Request a password reset email. SMTP settings are required in backend .env.
router.post('/forgot-password', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();

        if (!email) {
            return res.status(400).json({ message: 'Enter your email address.' });
        }

        const user = await User.findOne({ email });

        // Do not reveal whether an account exists.
        if (!user) {
            return res.status(200).json({ message: 'If the account exists, a reset link will be sent.' });
        }

        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return res.status(503).json({
                message: 'Password reset email is not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM to backend .env.'
            });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');

        user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();

        const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        const resetUrl = `${frontend}/reset-password?token=${rawToken}`;

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: String(process.env.SMTP_SECURE || 'false') === 'true',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: user.email,
            subject: 'Reset your AME Messenger password',
            html: `<p>We received a request to reset your AME Messenger password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes. If you did not request this, ignore this email.</p>`
        });

        return res.status(200).json({ message: 'If the account exists, a reset link will be sent.' });

    } catch (error) {
        console.error('Forgot password error:', error.message);
        return res.status(500).json({ message: 'Unable to send password reset email.' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password || password.length < 8) {
            return res.status(400).json({
                message: 'Provide a valid reset link and a password of at least 8 characters.'
            });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'This reset link is invalid or has expired. Request a new one.'
            });
        }

        user.password = await bcrypt.hash(password, 10);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        return res.status(200).json({ message: 'Password updated successfully. You can now log in.' });

    } catch (error) {
        console.error('Reset password error:', error.message);
        return res.status(500).json({ message: 'Unable to reset password.' });
    }
});

module.exports = router;