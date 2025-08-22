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

    // Check if mentor exists (either in Users with role 'mentor' or in Mentor collection)
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

    const newForm = new SAPForm({
      name,
      email,
      activity,
      proofUrl: `/uploads/${proof}`,
      mentorEmail: mentor.email,
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

    // Validate mentor
    let mentor = await User.findOne({ email: mentorEmail, role: 'mentor' });
    if (!mentor) {
      const mentorDoc = await Mentor.findOne({ email: mentorEmail });
      if (mentorDoc) mentor = { email: mentorDoc.email };
    }
    if (!mentor) return res.status(404).json({ error: 'Mentor email not found' });

    const eventsInput = eventsStr ? JSON.parse(eventsStr) : [];

    // Map files by fieldname e.g., proofs[paperPresentation]
    const files = Array.isArray(req.files) ? req.files : [];
    const proofMap = {};
    for (const f of files) {
      const m = f.fieldname.match(/^proofs\[(.+)\]$/);
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

    // Validate mentor
    let mentor = await User.findOne({ email: mentorEmail, role: 'mentor' });
    if (!mentor) {
      const mentorDoc = await Mentor.findOne({ email: mentorEmail });
      if (mentorDoc) mentor = { email: mentorDoc.email };
    }
    if (!mentor) return res.status(404).json({ error: 'Mentor email not found' });

    const parsedStudentInfo = studentInfo ? JSON.parse(studentInfo) : {};
    const parsedEventData = eventData ? JSON.parse(eventData) : {};

    // Handle file uploads for this specific event
    const files = Array.isArray(req.files) ? req.files : [];
    const proofUrls = files.map(f => `/uploads/${f.filename}`);

    // Check if student already has a submission for this event
    let existingSubmission = await SAPForm.findOne({
      email,
      mentorEmail: mentor.email,
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
        mentorEmail: mentor.email,
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
          mentorEmail: mentor.email,
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
