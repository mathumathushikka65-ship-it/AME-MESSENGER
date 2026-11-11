
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

async function checkAdmin() {
    try {
        await connectDB();

        const email = process.env.ADMIN_EMAIL.trim().toLowerCase();

        const admin = await User.findOne({ email });

        if (!admin) {
            console.log('ERROR: Admin account not found!');
            return;
        }

        console.log('Admin account found!');
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
        console.log('Status:', admin.status);

        const passwordMatch = await bcrypt.compare(
            process.env.ADMIN_PASSWORD,
            admin.password
        );

        console.log(
            'Password matches .env:',
            passwordMatch ? 'YES' : 'NO'
        );

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkAdmin();

