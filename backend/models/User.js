
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    // USER INFORMATION
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        required: true,
        enum: ['student', 'teacher', 'university', 'course-center', 'other', 'admin']
    },

    status: {
        type: String,
        enum: ['Active', 'Pending', 'Inactive'],
        default: 'Active'
    },

    about: {
        type: String,
        default: "Available on AME Messenger",
        maxlength: 150
    },

    phone: {
        type: String,
        default: ""
    },
    profilePhoto: {
    type: String,
    default: ""
},

profilePhotoPublicId: {
    type: String,
    default: ""
},
    // ONLINE STATUS
    isOnline: {
        type: Boolean,
        default: false
    },

    lastSeen: {
        type: Date,
        default: null
    },

    // PRIVACY AND NOTIFICATION SETTINGS
    settings: {
        lastSeen: {
            type: Boolean,
            default: true
        },

        profilePhoto: {
            type: Boolean,
            default: true
        },

        readReceipts: {
            type: Boolean,
            default: true
        },

        onlineStatus: {
            type: Boolean,
            default: true
        },

        messageNotifications: {
            type: Boolean,
            default: true
        },

        groupNotifications: {
            type: Boolean,
            default: true
        },

        assignmentNotifications: {
            type: Boolean,
            default: true
        },

        reminderNotifications: {
            type: Boolean,
            default: true
        },

        notificationSound: {
            type: Boolean,
            default: true
        },

        desktopNotifications: {
            type: Boolean,
            default: true
        },

        enterToSend: {
            type: Boolean,
            default: false
        },

        mediaAutoDownload: {
            type: Boolean,
            default: false
        },

        twoFactor: {
            type: Boolean,
            default: false
        },

        groupInvitations: {
            type: Boolean,
            default: true
        }
    },

    // APPEARANCE THEME
    theme: {
        type: String,
        enum: ['Light', 'Dark', 'System'],
        default: 'Light'
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);

