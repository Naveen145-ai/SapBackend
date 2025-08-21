const express = require('express');
const router = express.Router();
const SAPForm = require('../models/SAPForm');
const User = require('../models/userAuthModel');
const { sendEmail } = require('../utils/mailer');

// GET submissions assigned to a mentor
router.get('/submissions/:mentorEmail', async (req, res) => {
  try {
    const submissions = await SAPForm.find({ mentorEmail: req.params.mentorEmail }).sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/update-status/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { status, marksAwarded, decisionNote } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await SAPForm.findByIdAndUpdate(
      submissionId,
      { status, marksAwarded: Number(marksAwarded) || 0, decisionNote, mentorDecisionAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Update student's SAP points balance if accepted
    if (status === 'accepted') {
      await User.updateOne({ email: updated.email, role: 'mentee' }, { $inc: { sapPoints: Number(marksAwarded) || 0 } });
    }

    // Notify student of decision
    try {
      await sendEmail({
        to: updated.email,
        subject: `Your SAP submission was ${updated.status}`,
        html: `
          <p>Hello ${updated.name},</p>
          <p>Your SAP submission for <strong>${updated.activity}</strong> was <strong>${updated.status}</strong>.</p>
          <ul>
            <li>Marks Awarded: <strong>${updated.marksAwarded || 0}</strong></li>
            ${updated.decisionNote ? `<li>Note: ${updated.decisionNote}</li>` : ''}
          </ul>
          <p>Thank you.</p>
        `
      });
    } catch (mailErr) {
      console.error('Student email send error:', mailErr.message);
    }

    res.json({ message: 'Status updated successfully', updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
