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
app.use(cors()); // 👈 இங்கே புள்ளி (dot) சரியாக வைக்கப்பட்டுள்ளது
app.use(express.json()); // JSON தரவை படிக்க

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Database conected! ✅"))
    .catch((error) => console.error("Database இணைப்பு தோல்வி! ❌", error));

// ஒரு எளிய Test Route
app.get('/', (req, res) => {
    res.send("Backend Server இயங்குகிறது! 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server port ${PORT}-ல் இயங்குகிறது... 🚀`);
});

