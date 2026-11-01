const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
        enum: ['student', 'teacher', 'university', 'course-center', 'other']
    },
    about: {
    type: String,
    default: "Available on AME Messenger",
    maxlength: 150
},
phone: {
    type: String,
    default: ""
}
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
