const express = require('express');
const router = express.Router();
const { submitSAPForm, submitFullForm, submitEventsForm, submitIndividualEvent, getStudentMarks } = require('../controllers/sapControllers');
const upload = require('../middleware/upload');
const SAPForm = require('../models/SAPForm');
const User = require('../models/userAuthModel'); 

router.post('/submit', upload.single('proof'), submitSAPForm);
router.post('/submit-full', upload.array('proofs', 20), submitFullForm);
router.post('/submit-events', upload.any(), submitEventsForm);
router.post('/submit-individual-event', upload.array('files'), submitIndividualEvent);
router.get('/student-marks/:email', getStudentMarks);

// User authentication endpoints
router.post('/user-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email, role: 'mentee' });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Simple password check (in production, use bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.json({ message: 'Login successful', user: { email: user.email, name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/user-signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const newUser = new User({
      name,
      email,
      password, // In production, hash this with bcrypt
      role: 'mentee',
      sapPoints: 0
    });
    
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/submissions/:email', async (req, res) => {
  try {
    const submissions = await SAPForm.find({ email: req.params.email }).sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

module.exports = router;
