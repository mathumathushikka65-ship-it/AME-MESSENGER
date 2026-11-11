
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

async function resetAdminPassword() {
    try {
        const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error('Admin email or password missing in .env');
        }

        if (ADMIN_PASSWORD.length < 12) {
            throw new Error('Password must contain at least 12 characters');
        }

        await connectDB();

        const admin = await User.findOne({
            email: ADMIN_EMAIL.trim().toLowerCase(),
            role: 'admin'
        });

        if (!admin) {
            throw new Error('Admin account not found');
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

        admin.password = hashedPassword;
        admin.status = 'Active';

        await admin.save();

        console.log('Admin password reset successfully!');
        console.log('Admin email:', admin.email);

    } catch (error) {
        console.error('Password reset error:', error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
}

resetAdminPassword();
