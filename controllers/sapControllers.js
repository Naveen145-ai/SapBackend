const SAPForm = require('../models/SAPForm');
const User = require('../models/userAuthModel');
const Mentor = require('../models/mentorAuthModel');
const { sendEmail } = require('../utils/mailer');

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

    // Notify mentor via email
    try {
      await sendEmail({
        to: mentor.email,
        subject: `New SAP submission from ${name}`,
        html: `
          <p>Hello ${mentor.email},</p>
          <p>You have a new SAP submission awaiting review.</p>
          <ul>
            <li>Student: <strong>${name}</strong> (${email})</li>
            <li>Activity: <strong>${activity}</strong></li>
            <li>Proof: <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}${newForm.proofUrl}">View Proof</a></li>
          </ul>
          <p>Please login to your mentor dashboard to Accept or Reject.</p>
        `
      });
    } catch (mailErr) {
      console.error('Email send error:', mailErr.message);
    }

    res.status(201).json({ message: 'SAP Form submitted successfully and mentor notified', formId: newForm._id });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.submitFullForm = async (req, res) => {
  try {
    const { studentInfo, tableData, mentorEmail, email } = req.body; // email is student email

    if (!mentorEmail || !email) {
      return res.status(400).json({ error: 'mentorEmail and student email are required' });
    }

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

    // Create a record with full details JSON
    const record = await SAPForm.create({
      name: studentInfo?.studentName || 'Unknown',
      email,
      activity: 'Full SAP Form',
      category: 'fullForm',
      mentorEmail: mentor.email,
      details: { studentInfo, tableData }
    });

    // Email mentor
    try {
      await sendEmail({
        to: mentor.email,
        subject: `New SAP full form from ${studentInfo?.studentName || email}`,
        html: `
          <p>You have a new full SAP form to review.</p>
          <ul>
            <li>Student: <strong>${studentInfo?.studentName || email}</strong> (${email})</li>
          </ul>
          <p>Login to your mentor dashboard to review and mark.</p>
        `
      });
    } catch (e) {
      console.error('Email error:', e.message);
    }

    res.status(201).json({ message: 'Full form submitted to mentor', id: record._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
