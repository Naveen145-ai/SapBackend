const express = require('express');
const router = express.Router();
const { submitSAPForm } = require('../controllers/sapControllers');
const upload = require('../middleware/upload');
const SAPForm = require('../models/SAPForm'); // ✅ Use CommonJS

router.post('/submit', upload.single('proof'), submitSAPForm);

router.get('/submissions/:email', async (req, res) => {
  try {
    const submissions = await SAPForm.find({ email: req.params.email }).sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

module.exports = router;
