const SAPForm = require('../models/SAPForm');

// Get all submissions for a specific mentor
exports.getMentorSubmissions = async (req, res) => {
  try {
    const { mentorEmail } = req.params;
    
    if (!mentorEmail) {
      return res.status(400).json({ message: 'Mentor email is required' });
    }

    console.log('Fetching submissions for mentor:', mentorEmail);
    
    // Find all submissions assigned to this mentor
    const submissions = await SAPForm.find({ mentorEmail })
      .sort({ submittedAt: -1 })
      .lean();

    console.log(`Found ${submissions.length} submissions for mentor ${mentorEmail}`);
    
    // Add userName field for compatibility with frontend
    const submissionsWithUserName = submissions.map(sub => ({
      ...sub,
      userName: sub.name || 'Unknown User'
    }));

    res.json(submissionsWithUserName);
  } catch (error) {
    console.error('Error fetching mentor submissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update submission status and marks
exports.updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, marksAwarded, decisionNote } = req.body;

    const submission = await SAPForm.findByIdAndUpdate(
      id,
      {
        status,
        marksAwarded: marksAwarded || 0,
        decisionNote: decisionNote || '',
        mentorDecisionAt: new Date()
      },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({ message: 'Status updated successfully', submission });
  } catch (error) {
    console.error('Error updating submission status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update individual event marks
exports.updateEventMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { eventKey, eventMarks, eventNote } = req.body;

    const submission = await SAPForm.findById(id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Find and update the specific event
    const eventIndex = submission.events.findIndex(e => e.key === eventKey);
    if (eventIndex === -1) {
      return res.status(404).json({ message: 'Event not found' });
    }

    submission.events[eventIndex].mentorMarks = eventMarks || 0;
    submission.events[eventIndex].mentorNote = eventNote || '';
    submission.events[eventIndex].status = 'reviewed';

    await submission.save();

    res.json({ message: 'Event marks updated successfully', submission });
  } catch (error) {
    console.error('Error updating event marks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate SAP marks report for mentor
exports.getSAPReport = async (req, res) => {
  try {
    const { mentorEmail } = req.params;
    
    const submissions = await SAPForm.find({ 
      mentorEmail,
      category: 'individualEvents',
      'events.status': 'reviewed'
    }).lean();

    const report = {};
    
    submissions.forEach(submission => {
      if (!report[submission.email]) {
        report[submission.email] = {
          studentName: submission.name || 'Unknown',
          studentEmail: submission.email,
          events: {},
          totalMarks: 0
        };
      }

      submission.events.forEach(event => {
        if (event.status === 'reviewed') {
          report[submission.email].events[event.key] = {
            title: event.title,
            marks: event.mentorMarks || 0,
            note: event.mentorNote || ''
          };
          report[submission.email].totalMarks += (event.mentorMarks || 0);
        }
      });
    });

    res.json(report);
  } catch (error) {
    console.error('Error generating SAP report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
