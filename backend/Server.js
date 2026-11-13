const path = require('path');
require('dotenv').config();
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const paymentRoutes = require('./Routes/payment');
const settingsRoutes = require('./Routes/settings');

dotenv.config();

const connectDB = require('./config/db');

// Routes
const authRoutes = require('./Routes/auth');
const userRoutes = require('./Routes/Users');
const messageRoutes = require('./Routes/messages');
const conversationRoutes = require('./Routes/conversation');
const callRoutes = require('./Routes/calls');
const uploadRoutes = require('./Routes/upload');
const assignmentRoutes = require('./Routes/assignments');
const reminderRoutes = require("./Routes/reminderRoutes");
const documentRoutes = require('./Routes/documents');
const adminAuthRoutes = require('./Routes/adminAuth');
const contactRoutes = require('./Routes/contacts');

// Models
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const console = require('console');

// App setup
const app = express();
const server = http.createServer(app);

app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));






// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173',
            'http://localhost:5174'
        ],
        methods: ['GET', 'POST']
    }
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/reminders", reminderRoutes);

// API Routes
app.use('/api/payment', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', require('./Routes/adminRoutes'));
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contacts', contactRoutes);

console.log('PAYMENT ROUTE MOUNTED');
console.log('USER ROUTE MOUNTED');
console.log('AUTH ROUTE MOUNTED');
console.log('MESSAGE ROUTE MOUNTED');
console.log('CONVERSATION ROUTE MOUNTED');
console.log('CALL ROUTE MOUNTED');
console.log('UPLOAD ROUTE MOUNTED');
console.log('ASSIGNMENT ROUTE MOUNTED');
console.log('REMINDER ROUTE MOUNTED');
console.log('DOCUMENT ROUTE MOUNTED');
console.log('ADMIN ROUTE MOUNTED');
console.log('ADMIN AUTH ROUTE MOUNTED');
console.log('SETTINGS ROUTE MOUNTED');
console.log('CONTACT ROUTE MOUNTED');

// Home route
app.get('/', (req, res) => {
    res.send('AME MESSENGER Backend Server is running!');
});

// Debug route
app.get('/debug/routes', (req, res) => {
    res.json({
        authRoutesLoaded: typeof authRoutes
    });
});

// Online users tracking
const onlineUsers = new Map();

// Socket authentication
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        socket.userId = decoded.userId;

        next();

    } catch (error) {
        next(new Error('Invalid or expired token'));
    }
});

// Notify conversation participants about user status
const notifyUserStatus = async (userId, isOnline, lastSeen) => {
    try {
        const conversations = await Conversation.find({
            participants: userId
        }).select('participants');

        conversations.forEach((conversation) => {
            conversation.participants.forEach((participant) => {
                const participantId = participant.toString();

                if (participantId !== userId) {
                    io.to(`user:${participantId}`).emit('user-status', {
                        userId,
                        isOnline,
                        lastSeen
                    });
                }
            });
        });

    } catch (error) {
        console.error('Status notification error:', error.message);
    }
};

// Socket connection
io.on('connection', async (socket) => {

    const userId = socket.userId.toString();

    console.log('User connected:', userId);

    // Track multiple devices
    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId).add(socket.id);

    // Join personal room
    socket.join(`user:${userId}`);

    // Update online status
    try {
        await User.findByIdAndUpdate(userId, {
            isOnline: true,
            lastSeen: null
        });

        await notifyUserStatus(userId, true, null);

    } catch (error) {
        console.error('Online status error:', error.message);
    }

    // Typing indicator
    const sendTypingStatus = async (conversationId, isTyping) => {
        try {
            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: userId
            });

            if (!conversation) {
                return;
            }

            conversation.participants.forEach((participant) => {
                const participantId = participant.toString();

                if (participantId !== userId) {
                    io.to(`user:${participantId}`).emit('typing-status', {
                        conversationId,
                        userId,
                        isTyping
                    });
                }
            });

        } catch (error) {
            console.error('Typing status error:', error.message);
        }
    };

    socket.on('typing', ({ conversationId } = {}) => {
        if (conversationId) {
            sendTypingStatus(conversationId, true);
        }
    });

    socket.on('stop-typing', ({ conversationId } = {}) => {
        if (conversationId) {
            sendTypingStatus(conversationId, false);
        }
    });

    // Disconnect
    socket.on('disconnect', async () => {

        const userSockets = onlineUsers.get(userId);

        if (userSockets) {
            userSockets.delete(socket.id);
        }

        // Mark offline only when all devices disconnect
        if (!userSockets || userSockets.size === 0) {

            onlineUsers.delete(userId);

            const lastSeen = new Date();

            try {
                await User.findByIdAndUpdate(userId, {
                    isOnline: false,
                    lastSeen
                });

                await notifyUserStatus(userId, false, lastSeen);

                console.log('User disconnected:', userId);

            } catch (error) {
                console.error('Offline status error:', error.message);
            }
        }
    });
});

// Server port
const PORT = process.env.PORT || 5000;

// Handle port errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Close the old server process.`);
    } else {
        console.error('Server error:', error);
    }
});

// Start server
const startServer = async () => {
    try {
        await connectDB();

        // Reset stale online statuses after server restart
        await User.updateMany(
            { isOnline: true },
            {
                $set: {
                    isOnline: false,
                    lastSeen: new Date()
                }
            }
        );

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log('Socket.IO server is ready!');
        });

    } catch (error) {
        console.error('Server startup failed:', error.message);
        process.exit(1);
    }
};

startServer();









