const express = require('express');
const router = express.Router();
const { submitSAPForm, submitFullForm } = require('../controllers/sapControllers');
const upload = require('../middleware/upload');
const SAPForm = require('../models/SAPForm'); // ✅ Use CommonJS

router.post('/submit', upload.single('proof'), submitSAPForm);
router.post('/submit-full', upload.array('proofs', 20), submitFullForm);

router.get('/submissions/:email', async (req, res) => {
  try {
    const submissions = await SAPForm.find({ email: req.params.email }).sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

module.exports = router;
