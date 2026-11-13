
const express = require('express');
const router = express.Router();

const User = require('../models/User');
const authMiddleware = require('../Middleware/authMiddleware');

// Allowed settings
const allowedSettings = [
    'lastSeen',
    'profilePhoto',
    'readReceipts',
    'onlineStatus',
    'messageNotifications',
    'groupNotifications',
    'assignmentNotifications',
    'reminderNotifications',
    'notificationSound',
    'desktopNotifications',
    'enterToSend',
    'mediaAutoDownload',
    'twoFactor',
    'groupInvitations'
];

// GET USER SETTINGS
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select('settings theme');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            message: 'Settings fetched successfully',
            settings: user.settings,
            theme: user.theme
        });

    } catch (error) {
        console.error('Get Settings Error:', error);

        res.status(500).json({
            message: 'Unable to fetch settings'
        });
    }
});

// UPDATE USER SETTINGS
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { settings, theme } = req.body;

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Validate settings
        if (settings !== undefined) {
            if (
                !settings ||
                typeof settings !== 'object' ||
                Array.isArray(settings)
            ) {
                return res.status(400).json({
                    message: 'Invalid settings data'
                });
            }

            for (const key of Object.keys(settings)) {
                if (!allowedSettings.includes(key)) {
                    return res.status(400).json({
                        message: `Invalid setting: ${key}`
                    });
                }

                if (typeof settings[key] !== 'boolean') {
                    return res.status(400).json({
                        message: `${key} must be true or false`
                    });
                }

                user.set(`settings.${key}`, settings[key]);
            }
        }

        // Validate theme
        if (theme !== undefined) {
            if (!['Light', 'Dark', 'System'].includes(theme)) {
                return res.status(400).json({
                    message: 'Invalid theme'
                });
            }

            user.theme = theme;
        }

        await user.save();

        res.status(200).json({
            message: 'Settings updated successfully',
            settings: user.settings,
            theme: user.theme
        });

    } catch (error) {
        console.error('Update Settings Error:', error);

        res.status(500).json({
            message: 'Unable to update settings'
        });
    }
});

module.exports = router;
