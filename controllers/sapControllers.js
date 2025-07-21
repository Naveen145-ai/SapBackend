const SAPSubmission = require('../models/sapForm');

const submitSAPForm = async (req, res) => {
  try {
    const { name, email, activity } = req.body;

    // Make sure file is uploaded
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'File upload failed or missing' });
    }

    const newSubmission = new SAPSubmission({
      name,
      email,
      activity,
      proofUrl: req.file.path, // Cloudinary URL
    });

    await newSubmission.save(); // Saves to MongoDB Atlas

    res.status(201).json({
      success: true,
      message: 'SAP form submitted successfully',
      data: newSubmission,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { submitSAPForm };
