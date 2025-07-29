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

router.put('/update-status/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await SAPForm.findByIdAndUpdate(
      submissionId,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({ message: 'Status updated successfully', updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
