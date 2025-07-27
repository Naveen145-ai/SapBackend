const SAPForm = require('../models/SAPForm');
const User = require('../models/userAuthModel');

exports.submitSAPForm = async (req, res) => {
  try {
    const { name, email, activity, mentorEmail } = req.body;
    const proof = req.file?.filename;

    if (!proof) {
      return res.status(400).json({ error: 'File not uploaded' });
    }

    // Check if mentor exists
    const mentor = await User.findOne({ email: mentorEmail, role: 'mentor' });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor email not found' });
    }

    const newForm = new SAPForm({
      name,
      email,
      activity,
      proofUrl: `/uploads/${proof}`,
      mentorEmail: mentor.email
    });

    await newForm.save();
    res.status(201).json({ message: 'SAP Form submitted successfully' });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
