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
