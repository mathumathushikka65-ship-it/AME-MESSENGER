const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const dotenv = require ('dotenv');
const connectDB = require('./config/db');

const app = express();

dotenv.config();
connectDB();
// Middlewares
const app = express ();
app.use(cors());
app.use(express.json()); 

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Database conected!"))
    .catch((error) => console.error("Database is not connected! ", error));


app.get('/', (req, res) => {
    res.send("Backend Server is running! ");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server port ${PORT}-running... `);
});

