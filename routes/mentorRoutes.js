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

// Update individual event marks
router.put('/update-event-marks/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { eventKey, eventMarks, eventNote } = req.body;

    const submission = await SAPForm.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Find and update the specific event
    const eventIndex = submission.events.findIndex(e => e.key === eventKey);
    if (eventIndex === -1) {
      return res.status(404).json({ message: 'Event not found' });
    }

    submission.events[eventIndex].mentorMarks = eventMarks;
    submission.events[eventIndex].mentorNote = eventNote;
    submission.events[eventIndex].status = 'reviewed';

    await submission.save();

    // Calculate total marks for the student across all events
    const totalMarks = submission.events.reduce((total, event) => {
      if (event.mentorMarks) {
        const eventTotal = Object.values(event.mentorMarks).reduce((sum, mark) => sum + (Number(mark) || 0), 0);
        return total + eventTotal;
      }
      return total;
    }, 0);

    // Update student's SAP points
    await User.updateOne(
      { email: submission.email, role: 'mentee' },
      { $inc: { sapPoints: totalMarks } }
    );

    res.json({ message: 'Event marks updated successfully', totalMarks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate SAP marks report
router.get('/sap-report/:mentorEmail', async (req, res) => {
  try {
    const { mentorEmail } = req.params;
    
    const submissions = await SAPForm.find({ mentorEmail }).populate('email', 'name');
    
    const report = {};
    
    submissions.forEach(submission => {
      const studentEmail = submission.email;
      
      if (!report[studentEmail]) {
        report[studentEmail] = {
          studentName: submission.name,
          studentEmail,
          events: {},
          totalMarks: 0
        };
      }
      
      if (submission.category === 'individualEvents' && submission.events) {
        submission.events.forEach(event => {
          if (event.status === 'reviewed' && event.mentorMarks) {
            const eventTotal = Object.values(event.mentorMarks).reduce((sum, mark) => sum + (Number(mark) || 0), 0);
            report[studentEmail].events[event.key] = {
              title: event.title,
              marks: eventTotal,
              details: event.mentorMarks,
              note: event.mentorNote || ''
            };
            report[studentEmail].totalMarks += eventTotal;
          }
        });
      }
    });
    
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
