
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');

const authRoutes = require('./Routes/auth');
const messageRoutes = require('./Routes/messages');
const conversationRoutes = require('./Routes/conversation');
const callRoutes = require('./Routes/calls');
const userRoutes = require('./Routes/Users');
console.log('USER ROUTE MOUNTED');
const Conversation = require('./models/Conversation');

dotenv.config();

const app = express();
const server = http.createServer(app);

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

// Make Socket.IO available inside API routes
app.set('io', io);

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/calls', callRoutes);

console.log('AUTH ROUTE MOUNTED');
console.log('MESSAGE ROUTE MOUNTED');
console.log('CONVERSATION ROUTE MOUNTED');
console.log('CALL ROUTE MOUNTED');

// Home route
app.get('/', (req, res) => {
    res.send('AME MESSENGER Backend Server is running!');
});

// Debug routes
app.get('/debug/routes', (req, res) => {
    res.json({
        authRoutesLoaded: typeof authRoutes,
        routes: authRoutes.stack.map(item => ({
            path: item.route?.path,
            methods: item.route?.methods
        }))
    });
});

// Socket.IO JWT Authentication
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

// Socket.IO connection
io.on('connection', (socket) => {

    console.log('User connected:', socket.userId);

    // Join personal room
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
    });

    // Socket.IO connection
io.on('connection', (socket) => {

    console.log('User connected:', socket.userId);

    // Join personal room
    socket.join(`user:${socket.userId}`);

    // Typing indicator
    const sendTypingStatus = async (conversationId, isTyping) => {
        try {
            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: socket.userId
            });

            if (!conversation) return;

            conversation.participants.forEach((participant) => {
                const participantId = participant.toString();

                if (participantId !== socket.userId.toString()) {
                    io.to(`user:${participantId}`).emit('typing-status', {
                        conversationId,
                        userId: socket.userId,
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

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
    });

});

});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

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






