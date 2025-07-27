const express = require('express');
const router = express.Router();
const SAPForm = require('../models/SAPForm');

// GET submissions assigned to a mentor
router.get('/submissions/:mentorEmail', async (req, res) => {
  try {
    const submissions = await SAPForm.find({ mentorEmail: req.params.mentorEmail });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
