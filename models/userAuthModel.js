const mongoose = require("mongoose");

const userAuth = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    confirmPassword: { type: String, required: true },
    role: { type: String, enum: ['mentor', 'mentee'], required: true } // ✅ ADD THIS
});

const User = mongoose.model('User', userAuth);
module.exports = User;
