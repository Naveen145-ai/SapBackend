const express = require('express');

const router = express.Router();

const {userSignUp,userLogin} = require('../controllers/userAuthController');
const User = require('../models/userAuthModel');

router.post('/user-signup',userSignUp);

router.post('/user-login',userLogin);

// Get profile by email
router.get('/profile/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }, { password: 0, confirmPassword: 0 });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;