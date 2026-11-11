const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const router = express.Router();

const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Document = require('../models/Document');
const Message = require('../models/Message');
const Reminder = require('../models/reminder');
const LoginLog = require('../models/LoginLog');
const authMiddleware = require('../Middleware/authMiddleware');
const adminMiddleware = require('../Middleware/adminMiddleware');

// Ellaa admin routes-ukum: mudhalla login check, apram admin check
router.use(authMiddleware, adminMiddleware);

// ---------- helpers ----------
const handle = (fn) => (req, res) =>
    fn(req, res).catch((err) => {
        console.error('Admin route error:', err.message);
        res.status(500).json({ message: 'Server error' });
    });

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const startOfMonth = (offset = 0) => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + offset, 1);
};

// "from last month" growth %
const growth = async (Model, filter = {}) => {
    const thisStart = startOfMonth(0);
    const lastStart = startOfMonth(-1);

    const thisMonth = await Model.countDocuments({
        ...filter,
        createdAt: { $gte: thisStart }
    });
    const lastMonth = await Model.countDocuments({
        ...filter,
        createdAt: { $gte: lastStart, $lt: thisStart }
    });

    if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
    return Number((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1));
};

const card = async (Model, filter = {}) => ({
    count: await Model.countDocuments(filter),
    change: await growth(Model, filter)
});

const toAdminUser = (u) => ({
    id: u._id,
    name: u.username,
    email: u.email,
    role: u.role,
    status: u.status || 'Active',
    createdAt: u.createdAt
});

const officerRoles = ['university', 'course-center', 'other'];

// ---------- DASHBOARD ----------

router.get('/stats', handle(async (req, res) => {

    const platformUsers = { role: { $ne: 'admin' } };

    const [
        totalUsers,
        students,
        teachers,
        universities,
        courseCenters,
        other,
        officers,
        onlineUsers,
        assignments,
        documents,
        messages,
        reminders,
        submissionResult
    ] = await Promise.all([

        card(User, platformUsers),

        card(User, { role: 'student' }),

        card(User, { role: 'teacher' }),

        card(User, { role: 'university' }),

        card(User, { role: 'course-center' }),

        card(User, { role: 'other' }),

        card(User, { role: { $in: officerRoles } }),

        User.countDocuments({
            ...platformUsers,
            isOnline: true
        }),

        card(Assignment),

        card(Document),

        card(Message),

        card(Reminder),

        Assignment.aggregate([
            {
                $project: {
                    submissionCount: {
                        $size: { $ifNull: ['$submissions', []] }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$submissionCount' }
                }
            }
        ])
    ]);

    res.json({
        totalUsers,
        students,
        teachers,
        universities,
        courseCenters,
        other,
        officers,
        onlineUsers: {
            count: onlineUsers
        },
        assignments,
        documents,
        messages,
        reminders,
        submissions: {
            count: submissionResult[0]?.total || 0
        }
    });

}));


router.get('/chart', handle(async (req, res) => {
    const year = new Date().getFullYear();
    const from = new Date(year, 0, 1);
    const to = new Date(year + 1, 0, 1);
    const monthly = new Array(12).fill(0);

    const results = await Promise.all(
        [Message, Assignment, Document, Reminder].map((Model) =>
            Model.aggregate([
                { $match: { createdAt: { $gte: from, $lt: to } } },
                { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } }
            ])
        )
    );

    results.forEach((rows) =>
        rows.forEach((r) => { monthly[r._id - 1] += r.count; })
    );

    res.json(monthly);
}));

router.get('/activities', handle(async (req, res) => {
    const latest = (Model, fields) =>
        Model.find().sort({ createdAt: -1 }).limit(5).select(fields);

    const [users, assignments, documents, reminders, messages] = await Promise.all([
        latest(User, 'username role createdAt'),
        latest(Assignment, 'title createdAt'),
        latest(Document, 'title createdAt'),
        latest(Reminder, 'title createdAt'),
        Message.find().sort({ createdAt: -1 }).limit(5)
            .populate('sender', 'username').select('sender messageType createdAt')
    ]);

    const activities = [
        ...users.map((u) => ({ type: 'user', title: 'New user registered',
            detail: `${u.username} joined as ${u.role}`, createdAt: u.createdAt })),
        ...assignments.map((a) => ({ type: 'assignment', title: 'Assignment created',
            detail: a.title, createdAt: a.createdAt })),
        ...documents.map((d) => ({ type: 'document', title: 'New document created',
            detail: d.title, createdAt: d.createdAt })),
        ...reminders.map((r) => ({ type: 'reminder', title: 'New reminder created',
            detail: r.title, createdAt: r.createdAt })),
        ...messages.map((m) => ({ type: 'message', title: 'New message activity',
            detail: `${m.sender?.username || 'Someone'} sent a ${m.messageType} message`,
            createdAt: m.createdAt }))
    ]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);

    res.json(activities);
}));

// ---------- USERS ----------
router.get('/users', handle(async (req, res) => {
    const search = escapeRegex(req.query.search || '');

    const users = await User.find({
        $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { role: { $regex: search, $options: 'i' } }
        ]
    }).select('-password').sort({ createdAt: -1 });

    res.json(users.map(toAdminUser));
}));

router.post('/users', handle(async (req, res) => {
    const { username, email, password, role } = req.body;
    const allowedRoles = ['student', 'teacher', 'university', 'course-center', 'other'];

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid user role' });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    const existing = await User.findOne({
        $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
    });
    if (existing) {
        return res.status(400).json({ message: 'Username or email already exists' });
    }

    const user = await User.create({
        username: normalizedUsername,
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        role
    });

    res.status(201).json(toAdminUser(user));
}));

router.put('/users/:id/status', handle(async (req, res) => {
    const { status } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    if (!['Active', 'Pending', 'Inactive'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { status } },
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(toAdminUser(user));
}));

router.delete('/users/:id', handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    if (req.params.id === String(req.userId)) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted', id: req.params.id });
}));

// ---------- MONITOR PAGES ----------
router.get('/assignments', handle(async (req, res) => {
    const items = await Assignment.find()
        .populate('user', 'username')
        .select('title subject dueDate priority status user createdAt')
        .sort({ createdAt: -1 }).limit(100);
    res.json(items);
}));

router.get('/documents', handle(async (req, res) => {
    const items = await Document.find()
        .populate('owner', 'username')
        .select('title owner createdAt updatedAt')
        .sort({ createdAt: -1 }).limit(100);
    res.json(items);
}));

router.get('/reminders', handle(async (req, res) => {
    const items = await Reminder.find()
        .select('title category date time priority completed')
        .sort({ date: 1 }).limit(100);
    res.json(items);
}));

router.get('/messages', handle(async (req, res) => {
    const items = await Message.find()
        .populate('sender', 'username')
        .select('sender messageType conversationId createdAt')
        .sort({ createdAt: -1 }).limit(100);
    res.json(items);
}));

// ---------- LOGIN HISTORY ----------
router.get('/login-history', handle(async (req, res) => {
    const logs = await LoginLog.find()
        .populate('user', 'username email role')
        .sort({ createdAt: -1 })
        .limit(100);

    res.json(logs);
}));

module.exports = router;