const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./Routes/auth');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
console.log("AUTH ROUTE MOUNTED");

// Database Connection
connectDB();

app.get('/', (req, res) => {
    res.send("AME MESSENGER Backend Server is running!");
});

const PORT = process.env.PORT || 5000;

app.get('/debug/routes', (req, res) => {
    res.json({
        authRoutesLoaded: typeof authRoutes,
        routes: authRoutes.stack.map(item => ({
            path: item.route?.path,
            methods: item.route?.methods
        }))
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


