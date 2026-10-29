const mongoose =require('mongoose');

const connectDB = async () => {
    try{
        await mongoose mongoose.connect(process.env.MONGO-URL);
        console.log("MongoDB Connected Success!");
    } 
    catch(error){
        console.error("MongoDB Error:",error.Message);
        process.exit(1);
    }
};
module.exports = connectDB;