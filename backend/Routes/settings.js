const express = require('express');
const router = express.Router();

// Works with either "bcryptjs" or "bcrypt", whichever is installed
let bcrypt;
try {
    bcrypt = require('bcryptjs');
} catch (error) {
    bcrypt = require('bcrypt');
}

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
        const user = await User.findById(req.userId).select('settings theme');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Settings fetched successfully',
            settings: user.settings,
            theme: user.theme
        });
    } catch (error) {
        console.error('Get Settings Error:', error);
        res.status(500).json({ message: 'Unable to fetch settings' });
    }
});

// UPDATE USER SETTINGS
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { settings, theme } = req.body;

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (settings !== undefined) {
            if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
                return res.status(400).json({ message: 'Invalid settings data' });
            }

            for (const key of Object.keys(settings)) {
                if (!allowedSettings.includes(key)) {
                    return res.status(400).json({ message: `Invalid setting: ${key}` });
                }

                if (typeof settings[key] !== 'boolean') {
                    return res.status(400).json({ message: `${key} must be true or false` });
                }

                user.set(`settings.${key}`, settings[key]);
            }
        }

        if (theme !== undefined) {
            if (!['Light', 'Dark', 'System'].includes(theme)) {
                return res.status(400).json({ message: 'Invalid theme' });
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
        res.status(500).json({ message: 'Unable to update settings' });
    }
});

// CHANGE PASSWORD
router.put('/password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please fill all password fields' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters' });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ message: 'Unable to change password' });
    }
});

// DELETE ACCOUNT
router.delete('/account', authMiddleware, async (req, res) => {
    try {
        const { password } = req.body;

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password || '', user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Password is incorrect' });
        }

        await User.findByIdAndDelete(req.userId);

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete Account Error:', error);
        res.status(500).json({ message: 'Unable to delete account' });
    }
});

// REMOVE PROFILE PHOTO
router.delete('/profile-photo', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.profilePhoto = '';
        user.profilePhotoPublicId = '';
        await user.save();

        res.status(200).json({ message: 'Profile photo removed' });
    } catch (error) {
        console.error('Remove Photo Error:', error);
        res.status(500).json({ message: 'Unable to remove profile photo' });
    }
});

module.exports = router;