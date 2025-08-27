const SAPForm = require('../models/SAPForm');
const User = require('../models/userAuthModel');
const Mentor = require('../models/mentorAuthModel');

exports.submitSAPForm = async (req, res) => {
  try {
    const { name, email, activity, mentorEmail } = req.body;
    const proof = req.file?.filename;

    if (!proof) {
      return res.status(400).json({ error: 'File not uploaded' });
    }

    // Validate mentor email exists in database
    const mentor = await User.findOne({ email: mentorEmail, role: 'mentor' });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor email not found in database' });
    }
    
    console.log('Assigning mentor:', mentorEmail);

    const newForm = new SAPForm({
      name,
      email,
      activity,
      proofUrl: `/uploads/${proof}`,
      mentorEmail: mentorEmail,
      category: 'activity'
    });

    await newForm.save();

    res.status(201).json({ message: 'SAP Form submitted successfully', formId: newForm._id });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.submitFullForm = async (req, res) => {
  try {
    // For multipart requests, JSON is provided as text fields
    const { studentInfo: studentInfoStr, tableData: tableDataStr, mentorEmail, email } = req.body; // email is student email

    if (!mentorEmail || !email) {
      return res.status(400).json({ error: 'mentorEmail and student email are required' });
    }

    const studentInfo = studentInfoStr ? JSON.parse(studentInfoStr) : {};
    const tableData = tableDataStr ? JSON.parse(tableDataStr) : [];

    // Validate mentor email
    let mentor = await User.findOne({ email: mentorEmail, role: 'mentor' });
    if (!mentor) {
      const mentorDoc = await Mentor.findOne({ email: mentorEmail });
      if (mentorDoc) {
        mentor = { email: mentorDoc.email };
      }
    }
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor email not found' });
    }

    // Collect multiple proofs from multer
    const files = Array.isArray(req.files) ? req.files : [];
    const proofUrls = files.map(f => `/uploads/${f.filename}`);

    const record = await SAPForm.create({
      name: studentInfo?.studentName || 'Unknown',
      email,
      activity: 'Full SAP Form',
      category: 'fullForm',
      mentorEmail: mentor.email,
      details: { studentInfo, tableData },
      proofUrls
    });

    res.status(201).json({ message: 'Full form submitted to mentor', id: record._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.submitEventsForm = async (req, res) => {
  try {
    const { mentorEmail, email, name, events: eventsStr } = req.body;
    if (!mentorEmail || !email) {
      return res.status(400).json({ error: 'mentorEmail and student email are required' });
    }

    // Validate mentor email exists in database
    const mentor = await User.findOne({ email: mentorEmail, role: 'mentor' });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor email not found in database' });
    }
    console.log('Assigning mentor (eventsForm):', mentorEmail);

    const eventsInput = eventsStr ? JSON.parse(eventsStr) : [];

    // Map files by fieldname e.g., proofs[paperPresentation] or files[paperPresentation]
    const files = Array.isArray(req.files) ? req.files : [];
    const proofMap = {};
    for (const f of files) {
      // Support both proofs[key] and files[key] patterns
      const m = f.fieldname.match(/^(?:proofs|files)\[(.+)\]$/) || f.fieldname.match(/^(.+)$/);
      if (m) {
        const key = m[1];
        if (!proofMap[key]) proofMap[key] = [];
        proofMap[key].push(`/uploads/${f.filename}`);
      }
    }

    const events = eventsInput.map(ev => ({
      key: ev.key,
      title: ev.title,
      values: ev.values,
      proofUrls: proofMap[ev.key] || []
    }));

    const record = await SAPForm.create({
      name: name || 'Unknown',
      email,
      activity: 'Events SAP Form',
      category: 'eventsForm',
      mentorEmail: mentor.email,
      events
    });

    res.status(201).json({ message: 'Events submitted', id: record._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// New endpoint for individual event submissions
exports.submitIndividualEvent = async (req, res) => {
  try {
    const { studentInfo, eventKey, eventTitle, eventData, mentorEmail, email } = req.body;
    
    if (!mentorEmail || !email) {
      return res.status(400).json({ error: 'mentorEmail and student email are required' });
    }

    // Validate mentor email exists in database
    const mentor = await User.findOne({ email: mentorEmail, role: 'mentor' });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor email not found in database' });
    }
    console.log('Assigning mentor (individualEvent):', mentorEmail);

    const parsedStudentInfo = studentInfo ? JSON.parse(studentInfo) : {};
    const parsedEventData = eventData ? JSON.parse(eventData) : {};

    // Handle file uploads for this specific event
    const files = Array.isArray(req.files) ? req.files : [];
    const proofUrls = files.map(f => `/uploads/${f.filename}`);
    
    console.log('Files received:', files.length);
    console.log('Event data:', parsedEventData);

    // Check if student already has a submission for this event
    let existingSubmission = await SAPForm.findOne({
      email,
      mentorEmail: mentorEmail,
      'events.key': eventKey
    });

    if (existingSubmission) {
      // Update existing event
      const eventIndex = existingSubmission.events.findIndex(e => e.key === eventKey);
      if (eventIndex !== -1) {
        existingSubmission.events[eventIndex] = {
          key: eventKey,
          title: eventTitle,
          values: parsedEventData,
          proofUrls,
          mentorMarks: existingSubmission.events[eventIndex].mentorMarks || {},
          status: 'pending'
        };
      }
      await existingSubmission.save();
      res.status(200).json({ message: `${eventTitle} updated successfully`, id: existingSubmission._id });
    } else {
      // Create new submission or add to existing events submission
      let eventsSubmission = await SAPForm.findOne({
        email,
        mentorEmail: mentorEmail,
        category: 'individualEvents'
      });

      const newEvent = {
        key: eventKey,
        title: eventTitle,
        values: parsedEventData,
        proofUrls,
        mentorMarks: {},
        status: 'pending'
      };

      if (eventsSubmission) {
        eventsSubmission.events.push(newEvent);
        await eventsSubmission.save();
      } else {
        eventsSubmission = await SAPForm.create({
          name: parsedStudentInfo.studentName || 'Unknown',
          email,
          activity: 'Individual Events Submission',
          category: 'individualEvents',
          mentorEmail: mentorEmail,
          details: parsedStudentInfo,
          events: [newEvent],
          status: 'pending'
        });
      }
      
      res.status(201).json({ message: `${eventTitle} submitted successfully`, id: eventsSubmission._id });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get student marks and feedback
exports.getStudentMarks = async (req, res) => {
  try {
    const { email } = req.params;
    
    const submissions = await SAPForm.find({ email }).sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get SAP form submissions for mentor marking
exports.getSAPSubmissionsForMentor = async (req, res) => {
  try {
    const { mentorEmail } = req.params;
    
    const submissions = await SAPForm.find({ 
      mentorEmail: decodeURIComponent(mentorEmail),
      category: 'fullForm'
    }).sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update SAP marks by mentor
exports.updateSAPMarks = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks, mentorEmail } = req.body;
    
    const submission = await SAPForm.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    if (submission.mentorEmail !== mentorEmail) {
      return res.status(403).json({ message: 'Unauthorized to mark this submission' });
    }
    
    submission.mentorMarks = marks;
    submission.status = 'reviewed';
    submission.mentorDecisionAt = new Date();
    
    await submission.save();
    
    res.json({ message: 'Marks updated successfully', submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit total marks only
const submitTotalMarks = async (req, res) => {
  try {
    const { studentInfo, totalMarks, mentorEmail, email } = req.body;

    // Validate mentor email exists in database
    const mentorExists = await User.findOne({ email: mentorEmail, role: 'mentor' });
    if (!mentorExists) {
      return res.status(400).json({ error: 'Mentor email not found in database' });
    }

    // Create a simplified SAP form with only total marks
    const sapForm = new SAPForm({
      studentName: studentInfo.studentName,
      rollNumber: studentInfo.rollNumber,
      year: studentInfo.year,
      section: studentInfo.section,
      semester: studentInfo.semester,
      academicYear: studentInfo.academicYear,
      mentorName: studentInfo.mentorName,
      email: email,
      mentorEmail: mentorEmail,
      totalMarks: totalMarks,
      submissionType: 'total_marks_only',
      activities: [], // Empty activities array for total marks submission
      submittedAt: new Date()
    });

    await sapForm.save();
    res.status(200).json({ message: 'Total marks submitted successfully' });
  } catch (error) {
    console.error('Error submitting total marks:', error);
    res.status(500).json({ error: 'Failed to submit total marks' });
  }
};

module.exports = {
  submitSAPForm: exports.submitSAPForm,
  submitFullForm: exports.submitFullForm,
  submitEventsForm: exports.submitEventsForm,
  submitIndividualEvent: exports.submitIndividualEvent,
  getStudentMarks: exports.getStudentMarks,
  getSAPSubmissionsForMentor: exports.getSAPSubmissionsForMentor,
  updateSAPMarks: exports.updateSAPMarks,
  submitTotalMarks
};
