const User = require('../models/userAuthModel');

const userSignUp = async (req, res) => {
    const { name, email, password, confirmPassword, role } = req.body;

    if (!role || !['mentor', 'mentee'].includes(role)) {
        return res.status(400).json({ message: "Invalid or missing role" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
        const exist = await User.findOne({ email });
        if (exist) {
            return res.status(400).json({ message: "User already exists" });
        }

        const newUser = new User({ name, email, password, confirmPassword, role });
        await newUser.save();

        res.status(200).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


const userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // ✅ Return email and role for localStorage
    res.status(200).json({
      message: 'Login successful',
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

    

module.exports = { userSignUp, userLogin };
