const express = require('express');
const router = express.Router();
const { submitSAPForm, submitFullForm, submitEventsForm, submitIndividualEvent, getStudentMarks, getSAPSubmissionsForMentor, updateSAPMarks } = require('../controllers/sapControllers');
const upload = require('../middleware/upload');
const SAPForm = require('../models/SAPForm');
const User = require('../models/userAuthModel'); 

router.post('/submit', upload.single('proof'), submitSAPForm);
router.post('/submit-full', upload.array('proofs', 20), submitFullForm);
router.post('/submit-events', upload.any(), submitEventsForm);
router.post('/submit-individual-event', upload.any(), submitIndividualEvent);
router.get('/student-marks/:email', getStudentMarks);

// User authentication endpoints
router.post('/user-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for email:', email);
    
    // Check if user exists with any role
    const user = await User.findOne({ email });
    console.log('User found:', user ? `Yes (role: ${user.role})` : 'No');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Simple password check (in production, use bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Allow login regardless of role - frontend will handle routing
    res.json({ 
      message: 'Login successful', 
      user: { 
        email: user.email, 
        name: user.name, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/user-signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    
    console.log('Signup attempt:', { name, email, role: 'mentee' });
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const newUser = new User({
      name,
      email,
      password,
      confirmPassword: confirmPassword || password, // Handle missing confirmPassword
      role: 'mentee',
      sapPoints: 0
    });
    
    const savedUser = await newUser.save();
    console.log('User created successfully:', savedUser.email, 'Role:', savedUser.role);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
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

// New mentor endpoints for SAP marking
router.get('/mentor/sap-submissions/:mentorEmail', getSAPSubmissionsForMentor);
router.put('/mentor/update-sap-marks/:submissionId', updateSAPMarks);

module.exports = router;
